import { CANALS } from "../data/canals";

/** Shared with the physical coast cut: no separate invisible transit geometry. */
export const CANAL_WAYPOINTS = CANALS.flatMap((canal) =>
  canal.centerline.slice(1, -1).map((point, index) => ({
    ...point, id: `canal-${canal.id}-${index}`, approach: true,
  })),
);
export const CANAL_CHAINS = CANALS.map((canal) => [
  canal.fromPortId,
  ...canal.centerline.slice(1, -1).map((_, index) => `canal-${canal.id}-${index}`),
  canal.toPortId,
]);
