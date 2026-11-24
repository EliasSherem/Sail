#!/usr/bin/env python3
"""Prepare the offline OSM atlas; never runs as part of the game/build.

Normalize already cached Overpass responses (no network by default):
    python3 scripts/download-port-scenes.py --cache-dir /tmp
Explicitly download one area, with one attempt and no automatic retries:
    python3 scripts/download-port-scenes.py --port new-york --fetch
Existing atlas areas without a cached response are preserved.
"""

import argparse
import datetime
import json
import math
import os
from pathlib import Path
import re
import subprocess
import tempfile

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_ENDPOINT = "https://overpass-api.de/api/interpreter"
MANHATTAN_BBOX = [40.699, -74.023, 40.721, -73.991]


def number(value):
    match = re.search(r"-?[\d.]+", str(value))
    if not match:
        return None
    try:
        return float(match.group())
    except ValueError:
        return None


def normalize(element):
    tags, geometry = element.get("tags", {}), element.get("geometry", [])
    if len(geometry) < 4 or geometry[0] != geometry[-1]:
        return None
    lat = sum(p["lat"] for p in geometry[:-1]) / (len(geometry) - 1)
    lon = sum(p["lon"] for p in geometry[:-1]) / (len(geometry) - 1)
    cosine = math.cos(math.radians(lat))
    points = [((p["lon"] - lon) * 111195 * cosine, -(p["lat"] - lat) * 111195) for p in geometry[:-1]]
    area = abs(sum(a[0] * points[(i + 1) % len(points)][1] - points[(i + 1) % len(points)][0] * a[1] for i, a in enumerate(points))) / 2
    if area < 50 or area > 250000:
        return None
    # Original normalization: .45 m collinearity tolerance, at most 32 vertices.
    for _ in range(3):
        simplified = []
        for i, b in enumerate(points):
            a, c = points[i - 1], points[(i + 1) % len(points)]
            denominator = max(math.hypot(c[0] - a[0], c[1] - a[1]), .01)
            deviation = abs((c[0] - a[0]) * (a[1] - b[1]) - (a[0] - b[0]) * (c[1] - a[1])) / denominator
            if deviation > .45:
                simplified.append(b)
        if len(simplified) < 3 or len(simplified) == len(points):
            break
        points = simplified
    if len(points) > 32:
        points = points[::math.ceil(len(points) / 32)]
    height, levels = number(tags.get("height")), number(tags.get("building:levels"))
    if height is not None and "ft" in str(tags.get("height", "")):
        height *= .3048
    if height is None and levels is not None:
        height = levels * 3.2
    return {"id": element["id"], "lat": round(lat, 6), "lon": round(lon, 6),
            "h": round(min(550, max(3, height)), 1) if height else 0,
            "k": tags.get("building", "yes"), "p": [[round(x, 1), round(z, 1)] for x, z in points], "a": round(area)}


def select(rows, config, port):
    if port == "new-york":
        return sorted((b for b in rows if b["h"] > 50), key=lambda b: (-b["h"], -b["a"], b["id"]))[:400]
    lat, lon = config["center"]
    tiles = {}
    for building in rows:
        key = (int((building["lat"] - lat) * 111195 / 175), int((building["lon"] - lon) * 111195 * math.cos(math.radians(lat)) / 175))
        score = building["a"] ** .4 * (1 + (building["h"] or 12) / 40)
        tiles.setdefault(key, []).append((score, building))
    for tile in tiles.values():
        tile.sort(key=lambda item: item[0], reverse=True)
    chosen = []
    for depth in range(8):
        candidates = sorted((tile[depth] for tile in tiles.values() if len(tile) > depth), key=lambda item: item[0], reverse=True)
        chosen.extend(building for _, building in candidates[:700 - len(chosen)])
        if len(chosen) >= 700:
            break
    return chosen


def query_for(port, config):
    if port == "new-york":
        bbox = ",".join(map(str, MANHATTAN_BBOX))
        return f'[out:json][timeout:45];(way[building][height]({bbox});way[building]["building:levels"]({bbox}););out tags geom 4000;'
    lat, lon = config["center"]
    limit = config.get("queryLimit")
    return f'[out:json][timeout:45];way[building](around:{config["radiusM"]},{lat},{lon});out tags geom' + (f" {limit}" if limit else "") + ";"


def atomic_json(path, value, pretty=False):
    path.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.NamedTemporaryFile("w", dir=path.parent, delete=False, encoding="utf-8") as handle:
        json.dump(value, handle, ensure_ascii=False, indent=2 if pretty else None, separators=None if pretty else (",", ":"))
        temp = handle.name
    os.replace(temp, path)


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--port", action="append", help="Area to update; repeat only for cached normalization")
    parser.add_argument("--cache-dir", type=Path, default=ROOT / "artifacts/port-scenes-raw")
    parser.add_argument("--output", type=Path, default=ROOT / "public/data/port-scenes")
    parser.add_argument("--fetch", action="store_true", help="Explicitly download exactly one --port; one attempt")
    args = parser.parse_args()
    if args.fetch and (not args.port or len(args.port) != 1):
        parser.error("--fetch requires exactly one --port; bulk downloads are intentionally disabled")
    atlas_path, manifest_path = args.output / "osm-buildings.json", args.output / "osm-manifest.json"
    atlas, manifest = json.loads(atlas_path.read_text()), json.loads(manifest_path.read_text())
    for port in args.port or manifest["ports"]:
        if port not in manifest["ports"]:
            parser.error(f"Unknown atlas area: {port}")
        config = dict(manifest["ports"][port])
        if port == "new-york":
            config = {"center": [40.710, -74.007], "bbox": MANHATTAN_BBOX, "queryLimit": 4000, "selection": "height > 50 m, tallest 400"}
        query = query_for(port, config)
        cached = args.cache_dir / f"deriva-{port}-osm.json"
        if args.fetch:
            cached.parent.mkdir(parents=True, exist_ok=True)
            temporary = cached.with_suffix(".download")
            endpoint = config.get("endpoint", DEFAULT_ENDPOINT)
            try:
                subprocess.run(["curl", "--silent", "--show-error", "--fail", "--max-time", "65", "-A", "DerivaOfflinePortScene/1.1", "--data-urlencode", "data=" + query, endpoint, "-o", str(temporary)], check=True)
                json.loads(temporary.read_text())  # Never replace a good cache with an HTML error.
                os.replace(temporary, cached)
            except (subprocess.CalledProcessError, ValueError):
                temporary.unlink(missing_ok=True)
                raise
        if not cached.exists():
            print(f"{port}: no cache; preserving existing atlas")
            continue
        raw = json.loads(cached.read_text())
        if raw.get("remark"):
            raise ValueError(f"{port}: incomplete Overpass response: {raw['remark']}")
        buildings = [b for element in raw.get("elements", []) if (b := normalize(element))]
        chosen = select(buildings, config, port)
        if not chosen:
            print(f"{port}: no valid buildings; preserving existing atlas")
            continue
        atlas["buildings"][port] = chosen
        config.update(downloaded=len(raw["elements"]), retained=len(chosen), query=query)
        config.pop("error", None)
        config.pop("fallback", None)
        manifest["ports"][port] = config
        print(f"{port}: {len(raw['elements'])} raw → {len(chosen)} retained")
    atlas["retrieved"] = datetime.date.today().isoformat()
    atomic_json(atlas_path, atlas)
    atomic_json(manifest_path, manifest, pretty=True)
    print(f"Atlas: {sum(map(len, atlas['buildings'].values()))} buildings; {atlas_path.stat().st_size} bytes")


if __name__ == "__main__":
    main()
