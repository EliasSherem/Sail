import { useEffect, useRef, useState } from "react";
import { Minus, Plus, LocateFixed } from "lucide-react";
import type { LatLon, Route, VesselState } from "../types";
import type { World } from "../geo/world";
import { PORTS } from "../data/ports";
import { distance, normalizeLon } from "../geo/math";
interface Props {
  world: World;
  state: VesselState;
  route: Route | null;
  large?: boolean;
  onPort?: (id: string) => void;
}
export default function NauticalMap({
  world,
  state,
  route,
  large = false,
  onPort,
}: Props) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [zoom, setZoom] = useState(large ? 80 : 450);
  const [center, setCenter] = useState<LatLon>(
    { lat: state.lat, lon: state.lon },
  );
  const [follow, setFollow] = useState(true);
  const drag = useRef<{
    x: number;
    y: number;
    lat: number;
    lon: number;
    moved: boolean;
  } | null>(null);
  const centerNow = follow ? { lat: state.lat, lon: state.lon } : center;
  const zoomOnPlayer = (factor: number) => {
    setFollow(true);
    setZoom(z => Math.max(.8, Math.min(2000, z * factor)));
  };
  const render = () => {
    const el = canvas.current;
    if (!el) return;
    const { width: w, height: h } = el.getBoundingClientRect();
    const dpr = Math.min(devicePixelRatio, 2);
    if (el.width !== Math.round(w * dpr) || el.height !== Math.round(h * dpr)) {
      el.width = Math.round(w * dpr);
      el.height = Math.round(h * dpr);
    }
    const ctx = el.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "#dce9e6";
    ctx.fillRect(0, 0, w, h);
    const sx = (w / 360) * zoom,
      sy = sx / Math.max(0.35, Math.cos((centerNow.lat * Math.PI) / 180));
    const project = (p: LatLon) => ({
      x: w / 2 + normalizeLon(p.lon - centerNow.lon) * sx,
      y: h / 2 - (p.lat - centerNow.lat) * sy,
    });
    const grid =
      zoom < 3 ? 30 : zoom < 10 ? 10 : zoom < 40 ? 2 : zoom < 150 ? 0.5 : 0.1;
    ctx.lineWidth = 0.7;
    ctx.strokeStyle = "#b7cfca";
    ctx.font = "9px monospace";
    ctx.fillStyle = "#73918e";
    for (let lat = -80; lat <= 80; lat += grid) {
      const y = project({ lat, lon: centerNow.lon }).y;
      if (y < 0 || y > h) continue;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
      ctx.fillText(
        `${Math.abs(lat).toFixed(grid < 1 ? 1 : 0)}°${lat < 0 ? "S" : "N"}`,
        7,
        y - 4,
      );
    }
    for (let lon = -180; lon < 180; lon += grid) {
      const x = project({ lat: centerNow.lat, lon }).x;
      if (x < 0 || x > w) continue;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    ctx.fillStyle = "#f0efe2";
    ctx.strokeStyle = "#a6b9aa";
    ctx.lineWidth = 1;
    for (const poly of world.landPolygons) {
      if (poly.length < 3) continue;
      let previousLon = poly[0].lon;
      const firstLon =
        centerNow.lon + normalizeLon(previousLon - centerNow.lon);
      let unwrapped = firstLon;
      const pts = poly.map((p, i) => {
        if (i) unwrapped += normalizeLon(p.lon - previousLon);
        previousLon = p.lon;
        return {
          x: w / 2 + (unwrapped - centerNow.lon) * sx,
          y: h / 2 - (p.lat - centerNow.lat) * sy,
        };
      });
      const minX = Math.min(...pts.map((p) => p.x)),
        maxX = Math.max(...pts.map((p) => p.x)),
        minY = Math.min(...pts.map((p) => p.y)),
        maxY = Math.max(...pts.map((p) => p.y));
      if (maxY < 0 || minY > h) continue;
      for (const shift of [-360 * sx, 0, 360 * sx]) {
        if (maxX + shift < 0 || minX + shift > w) continue;
        ctx.beginPath();
        pts.forEach((p, i) =>
          i ? ctx.lineTo(p.x + shift, p.y) : ctx.moveTo(p.x + shift, p.y),
        );
        ctx.closePath();
        ctx.fill();
      }
    }
    if (route) {
      ctx.strokeStyle = "#cf7749";
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      let previous: { x: number; y: number } | null = null;
      for (const p of route.points) {
        const q = project(p);
        if (!previous || Math.abs(previous.x - q.x) > sx * 180)
          ctx.moveTo(q.x, q.y);
        else ctx.lineTo(q.x, q.y);
        previous = q;
      }
      ctx.stroke();
      ctx.setLineDash([]);
    }
    const labels: { x: number; y: number; width: number }[] = [];
    for (const port of PORTS) {
      const p = project(port);
      if (p.x < 0 || p.x > w || p.y < 0 || p.y > h) continue;
      if (port.id === route?.to || (!route && distance(port, state) < 8000)) {
        ctx.beginPath(); ctx.arc(p.x, p.y, large ? 11 : 8, 0, Math.PI * 2);
        ctx.fillStyle = "#ffd45270"; ctx.fill(); ctx.strokeStyle = "#b98029"; ctx.lineWidth = 1.5; ctx.stroke();
      }
      ctx.beginPath();
      ctx.arc(p.x, p.y, large ? 4 : 3, 0, Math.PI * 2);
      ctx.fillStyle = "#315a5b";
      ctx.fill();
      ctx.strokeStyle = "#fffdf3";
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = "#315a5b";
      ctx.font = large ? "600 11px sans-serif" : "10px sans-serif";
      const label = {
        x: p.x + 9,
        y: p.y - 7,
        width: ctx.measureText(port.name).width,
      };
      if (
        !labels.some(
          (other) =>
            Math.abs(other.y - label.y) < 14 &&
            label.x < other.x + other.width + 5 &&
            label.x + label.width + 5 > other.x,
        )
      ) {
        ctx.fillText(port.name, label.x, label.y);
        labels.push(label);
      }
    }
    const pos = project(state);
    ctx.save();
    ctx.translate(pos.x, pos.y);
    ctx.rotate(state.heading);
    ctx.fillStyle = "#e5814e";
    ctx.strokeStyle = "#fff9e8";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -10);
    ctx.lineTo(6, 7);
    ctx.lineTo(0, 4);
    ctx.lineTo(-6, 7);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    ctx.strokeStyle = "#dd8955";
    ctx.globalAlpha = 0.35;
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, 20, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;
    const scalePixels = Math.min(70, w / 3);
    const nm =
      ((scalePixels / sx) *
        111320 *
        Math.cos((centerNow.lat * Math.PI) / 180)) /
      1852;
    ctx.strokeStyle = "#527876";
    ctx.fillStyle = "#527876";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(15, h - 22);
    ctx.lineTo(15, h - 17);
    ctx.lineTo(15 + scalePixels, h - 17);
    ctx.lineTo(15 + scalePixels, h - 22);
    ctx.stroke();
    ctx.font = "9px monospace";
    ctx.fillText(`${nm < 10 ? nm.toFixed(1) : Math.round(nm)} mn`, 15, h - 27);
  };
  useEffect(() => {
    render();
  });
  useEffect(() => {
    const obs = new ResizeObserver(render);
    if (canvas.current) obs.observe(canvas.current);
    return () => obs.disconnect();
  }, [zoom, follow, centerNow.lat, centerNow.lon, world]);
  return (
    <div className={`nautical-map ${large ? "large" : ""}`} data-following-player={follow} data-zoom={zoom}
      data-route-start-lat={route?.points[0]?.lat} data-route-start-lon={route?.points[0]?.lon}
      data-route-next-lat={route?.points[1]?.lat} data-route-next-lon={route?.points[1]?.lon}
      data-route-distance={route?.distance}>
      <canvas
        ref={canvas}
        aria-label="Carta náutica: arrastra para mover, usa los botones para acercar"
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          drag.current = {
            x: e.clientX,
            y: e.clientY,
            lat: centerNow.lat,
            lon: centerNow.lon,
            moved: false,
          };
        }}
        onPointerMove={(e) => {
          const d = drag.current;
          if (!d) return;
          const w = e.currentTarget.clientWidth,
            sx = (w / 360) * zoom,
            sy = sx / Math.max(0.35, Math.cos((d.lat * Math.PI) / 180));
          if (Math.hypot(e.clientX - d.x, e.clientY - d.y) > 4) d.moved = true;
          if (d.moved) {
            setFollow(false);
            setCenter({
              lat: Math.max(-80, Math.min(80, d.lat + (e.clientY - d.y) / sy)),
              lon: normalizeLon(d.lon - (e.clientX - d.x) / sx),
            });
          }
        }}
        onPointerUp={(e) => {
          const d = drag.current;
          if (d && !d.moved && onPort) {
            const r = e.currentTarget.getBoundingClientRect(),
              sx = (r.width / 360) * zoom,
              sy =
                sx / Math.max(0.35, Math.cos((centerNow.lat * Math.PI) / 180));
            let closest: (typeof PORTS)[number] | undefined;
            let closestPixels = 18;
            for (const p of PORTS) {
              const pixels = Math.hypot(
                r.width / 2 +
                  normalizeLon(p.lon - centerNow.lon) * sx -
                  (e.clientX - r.left),
                r.height / 2 -
                  (p.lat - centerNow.lat) * sy -
                  (e.clientY - r.top),
              );
              if (pixels < closestPixels) {
                closest = p;
                closestPixels = pixels;
              }
            }
            if (closest) onPort(closest.id);
          }
          drag.current = null;
        }}
        onWheel={(e) => zoomOnPlayer(Math.exp(-e.deltaY * .002))}
      />
      <div className="map-north">
        N<span>↑</span>
      </div>
      <div className="map-zoom">
        <button
          title="Acercar mapa"
          onClick={() => zoomOnPlayer(2)}
        >
          <Plus size={14} />
        </button>
        <button
          title="Alejar mapa"
          onClick={() => zoomOnPlayer(.5)}
        >
          <Minus size={14} />
        </button>
        <button
          title="Centrar en el barco"
          onClick={() => {
            setFollow(true);
            setZoom(large ? 80 : 180);
          }}
        >
          <LocateFixed size={14} />
        </button>
      </div>
      {large && (
        <span className="map-attribution">
          Natural Earth · costas simplificadas · no apto para navegación real
        </span>
      )}
    </div>
  );
}
