import type { LatLon } from "../types";

export interface GameCanal {
  id: "panama" | "suez";
  name: string;
  fromPortId: string;
  toPortId: string;
  /** Deliberately widened gameplay channel, not surveyed navigation geometry. */
  widthM: number;
  centerline: LatLon[];
  source: string;
}

/** Hand-drafted regional alignments following the official overview maps.
 * Panama's locks/elevation and Suez's parallel traffic lanes are not simulated.
 * Both are continuous sea-level gameplay channels with visible/collidable banks.
 */
export const CANALS: GameCanal[] = [
  {
    id: "panama", name: "Canal de Panamá", fromPortId: "colon", toPortId: "balboa",
    widthM: 1400,
    source: "https://pancanal.com/plan-de-uso-de-suelo/",
    centerline: [
      { lat: 9.39, lon: -79.925 },
      { lat: 9.34, lon: -79.925 },
      { lat: 9.285, lon: -79.923 },
      { lat: 9.255, lon: -79.913 },
      { lat: 9.22, lon: -79.875 },
      { lat: 9.18, lon: -79.81 },
      { lat: 9.145, lon: -79.755 },
      { lat: 9.12, lon: -79.70 },
      { lat: 9.105, lon: -79.672 },
      { lat: 9.07, lon: -79.655 },
      { lat: 9.035, lon: -79.635 },
      { lat: 9.005, lon: -79.61 },
      { lat: 8.977, lon: -79.585 },
      { lat: 8.95, lon: -79.56 },
      { lat: 8.92, lon: -79.53 },
    ],
  },
  {
    id: "suez", name: "Canal de Suez", fromPortId: "port-said", toPortId: "suez",
    widthM: 1200,
    source: "https://www.suezcanal.gov.eg/English/MediaCenter/Brochures/New%20Suez%20Canal.pdf",
    centerline: [
      { lat: 31.30, lon: 32.34 },
      { lat: 31.265, lon: 32.32 },
      { lat: 31.23, lon: 32.31 },
      { lat: 31.10, lon: 32.305 },
      { lat: 30.98, lon: 32.31 },
      { lat: 30.86, lon: 32.325 },
      { lat: 30.74, lon: 32.345 },
      { lat: 30.66, lon: 32.345 },
      { lat: 30.585, lon: 32.315 },
      { lat: 30.52, lon: 32.35 },
      { lat: 30.45, lon: 32.395 },
      { lat: 30.365, lon: 32.445 },
      { lat: 30.29, lon: 32.505 },
      { lat: 30.215, lon: 32.555 },
      { lat: 30.12, lon: 32.57 },
      { lat: 30.02, lon: 32.57 },
      { lat: 29.95, lon: 32.56 },
      { lat: 29.91, lon: 32.57 },
    ],
  },
];
