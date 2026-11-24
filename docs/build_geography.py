"""Regenerate the bundled coastline (Python 3 + shapely + pyshp).

Usage: python docs/build_geography.py
The downloaded public-domain archive stays in the system temporary directory.
"""
import json
import argparse
import tempfile
import subprocess
import zipfile
from pathlib import Path

import shapefile
from shapely.geometry import Polygon, box, shape
from shapely.ops import unary_union

SOURCE = 'https://naciscdn.org/naturalearth/10m/physical/ne_10m_land.zip'
ROOT = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--output', type=Path, default=ROOT / 'public/data/land.geojson')
args = parser.parse_args()


def parts(geometry):
    if geometry.geom_type == 'Polygon':
        yield geometry
    elif geometry.geom_type in ('MultiPolygon', 'GeometryCollection'):
        for child in geometry.geoms:
            yield from parts(child)


with tempfile.TemporaryDirectory(prefix='juego-coast-') as temp:
    archive = Path(temp) / 'land.zip'
    subprocess.run(['curl', '-L', '--fail', '--silent', '--show-error', '-o', str(archive), SOURCE], check=True)
    with zipfile.ZipFile(archive) as compressed:
        compressed.extractall(temp)
    reader = shapefile.Reader(str(Path(temp) / 'ne_10m_land.shp'))
    # Detail is retained around the tutorial coast and western Mediterranean.
    mediterranean = box(-6, 35, 10, 45)
    features = []
    source_land = [shape(feature.__geo_interface__) for feature in reader.shapes()]
    for land in source_land:
        for region, tolerance in [(land.intersection(mediterranean), .001), (land.difference(mediterranean), .04)]:
            for polygon in parts(region):
                # Omit minute polygons globally; all Mediterranean source islands remain.
                if polygon.area < .00003 and tolerance > .01:
                    continue
                simple = polygon.simplify(tolerance, preserve_topology=True)
                ring = [[round(x, 5), round(y, 5)] for x, y in simple.exterior.coords]
                if len(ring) >= 4:
                    # Inland water bodies are intentionally solid/unavailable in this sea game.
                    features.append({'type': 'Feature', 'properties': {}, 'geometry': {'type': 'Polygon', 'coordinates': [ring]}})
    # Replace only three audited urban-coast patches. Build the original coarse
    # world first so every coordinate outside these boxes remains unchanged.
    # Bounds are [west, south, east, north], in degrees, not surveyed harbour limits.
    detailed_regions = unary_union([
        box(-74.32, 40.40, -73.67, 41.0),  # New York / Lower Bay and Manhattan
        box(103.55, 1.05, 104.17, 1.51),   # Singapore and neighbouring islands
        box(34.73, 29.32, 35.2, 29.79),    # Northern Gulf of Aqaba / Eilat
    ])
    local_parts = []
    for land in source_land:
        if land.intersects(detailed_regions):
            local_parts.extend(parts(land.intersection(detailed_regions)))
    local_land = unary_union([Polygon(polygon.exterior) for polygon in local_parts])
    patched = []
    for feature in features:
        land = shape(feature['geometry'])
        if not land.intersects(detailed_regions):
            patched.append(feature)
            continue
        for polygon in parts(land.difference(detailed_regions)):
            patched.append({'type': 'Feature', 'properties': {}, 'geometry': {
                'type': 'Polygon', 'coordinates': [list(polygon.exterior.coords)]}})
    for polygon in parts(local_land):
        simple = polygon.simplify(.001, preserve_topology=True)
        ring = [[round(x, 5), round(y, 5)] for x, y in simple.exterior.coords]
        if len(ring) >= 4:
            patched.append({'type': 'Feature', 'properties': {}, 'geometry': {
                'type': 'Polygon', 'coordinates': [ring]}})
    features = patched
    result = {'type': 'FeatureCollection', 'name': 'Natural Earth 5.1.1 land — maritime simplification', 'features': features}
    target = args.output
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(json.dumps(result, separators=(',', ':')))
    print(f'{len(features)} polygons, {sum(len(f["geometry"]["coordinates"][0]) for f in features)} vertices, {target.stat().st_size:,} bytes')
