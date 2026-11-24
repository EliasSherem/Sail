/** Offline authoring tool. Produces reviewed, swept-checked fictional offshore port locations.
 * Regional seed positions use NGA WPI + regional authorities; not navigational data.
 */
import fs from "node:fs";
import { destination, distance, bearing, toLocal, fromLocal } from "../src/geo/math";
import { World, worldFromGeoJSON } from "../src/geo/world";
import type { LatLon, Port } from "../src/types";

type Seed = Port & { bearing: number };
const seeds: Seed[] = JSON.parse(fs.readFileSync("docs/port-seeds.json", "utf8"));
const data = JSON.parse(fs.readFileSync("public/data/land.geojson", "utf8"));
const land = worldFromGeoJSON(data, []);
const fixed = new Set(["colon", "balboa", "port-said", "suez"]);
const ports: Port[] = [];
const placements: object[] = [];
for (const seed of seeds) {
  let chosen: LatLon | undefined;
  if (fixed.has(seed.id)) chosen = { lat: seed.lat, lon: seed.lon };
  // Inland WPI city locations (for example Jacksonville) need an exterior
  // approach farther down the estuary; retain the exact offset in the audit.
  else for (const meters of [0, 300, 600, 1000, 1500, 2200, 3000, 4000, 5500, 7500, 10000, 14000, 18000, 25000, 35000, 50000]) {
    for (const turn of [0, 20, -20, 45, -45, 70, -70, 100, -100, 135, -135, 180]) {
      const p = destination(seed, (seed.bearing + turn) * Math.PI / 180, meters);
      if (land.clearance(p) < 650) continue;
      chosen = p; break;
    }
    if (chosen) break;
  }
  if (!chosen) throw Error(`No safe coastal berth near ${seed.id}`);
  const description = seed.id === "hamburg" ? "Fondeo ficticio en el acceso oceánico al Elba; el tramo fluvial a Hamburgo no se reproduce."
    : seed.id === "prins-christian-sund" ? "Entrada oriental de Prins Christian Sund. Estación de repostaje ficticia costera; hielo y restricciones reales no simulados."
    : seed.id === "saglek" ? "Saglek, junto a Torngat y St. John's Harbour. Fondeo regional simplificado con servicios de juego."
    : fixed.has(seed.id) ? "Fondeo exterior y terminal de juego junto a la entrada del canal navegable simplificado."
    : seed.description || `${seed.region} · fondeo regional exterior de ${seed.name}. Muelle y repostaje ficticios; costa simplificada.`;
  const port = { id: seed.id, name: seed.name, country: seed.country, region: seed.region, lat: +chosen.lat.toFixed(7), lon: +chosen.lon.toFixed(7), heading: seed.bearing * Math.PI / 180, description };
  ports.push(port); placements.push({ id: seed.id, seed: { lat: seed.lat, lon: seed.lon }, berth: chosen, offsetMeters: Math.round(distance(seed, chosen)), landClearance: Math.round(land.clearance(chosen)) });
}
fs.writeFileSync("src/data/expandedPorts.ts", `import type { Port } from "../types";\n\n// Regional locations, not surveyed docks. Offshore offsets are checked against World.\n// Primary geographic reference: https://msi.nga.mil/api/publications/world-port-index?output=json\n// Arctic references: Government of Nunavut, Parks Canada, DMI/GEUS (docs/port-network-sources.md).\nexport const EXPANDED_PORTS: Port[] = ${JSON.stringify(ports, null, 2)};\n`);
fs.writeFileSync("docs/port-placement-audit.json", JSON.stringify(placements, null, 2));
console.log(`Placed ${ports.length} new ports; largest offset ${Math.max(...placements.map((p: any) => p.offsetMeters))} m`);
