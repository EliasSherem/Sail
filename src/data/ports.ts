import type { Port } from "../types";
import { EXPANDED_PORTS } from "./expandedPorts";

// Real port regions; gameplay berths are simplified offshore approaches, never charted quays.
export const PORTS: Port[] = [
  {
    id: "marseille",
    name: "Marsella",
    country: "Francia",
    region: "Mediterráneo",
    lat: 43.286,
    lon: 5.347,
    heading: Math.PI,
    description:
      "Zona inicial · fondeo de aproximación al Vieux-Port. Muelle genérico; costa simplificada.",
  },
  {
    id: "cassis",
    name: "Cassis",
    country: "Francia",
    region: "Mediterráneo",
    lat: 43.201,
    lon: 5.53,
    heading: Math.PI,
    description:
      "Traslado cercano por las Calanques · fondeo exterior simplificado.",
  },
  {
    id: "toulon",
    name: "Tolón",
    country: "Francia",
    region: "Mediterráneo",
    lat: 43.068,
    lon: 5.948,
    heading: Math.PI,
    description:
      "Rada exterior de Tolón · instalación ficticia para la demostración.",
  },
  {
    id: "barcelona",
    name: "Barcelona",
    country: "España",
    region: "Mediterráneo",
    lat: 41.31,
    lon: 2.191,
    heading: Math.PI,
    description:
      "Travesía del golfo de León · fondeo al sur de la entrada portuaria.",
  },
  // Mediterranean expansion: fictional offshore berths near the named real ports.
  // Positions are intentionally displaced seaward and validated against the bundled coast.
  // Regional references (not the coordinates of these fictional berths):
  // https://www.ports-monaco.com/en/the-ports-of-monaco/port-hercule/
  // https://www.valenciaport.com/wp-content/uploads/CUADERNILLO-VALENCIA-1.1.pdf
  // https://www.nicecotedazur.org/metropole/territoire/les-ports-dazur/port-de-nice/
  // https://www.cci.corsica/ports/
  {
    id: "la-ciotat", name: "La Ciotat", country: "Francia", region: "Mediterráneo",
    lat: 43.165, lon: 5.628, heading: Math.PI,
    description: "Escala corta en la bahía de La Ciotat. Fondeo exterior y muelle genérico simplificados.",
  },
  {
    id: "bandol", name: "Bandol", country: "Francia", region: "Mediterráneo",
    lat: 43.117, lon: 5.75, heading: Math.PI,
    description: "Costa del Var · aproximación exterior al sur de Bandol. Instalación de juego, no muelle real.",
  },
  {
    id: "hyeres", name: "Hyères", country: "Francia", region: "Mediterráneo",
    lat: 43.065, lon: 6.195, heading: Math.PI,
    description: "Rada de Hyères, frente a las islas de Oro. Fondeo y acceso costero simplificados.",
  },
  {
    id: "nice", name: "Niza", country: "Francia", region: "Mediterráneo",
    lat: 43.673, lon: 7.285, heading: Math.PI,
    description: "Riviera francesa · fondeo al sur de Port Lympia. Costa y muelle genéricos.",
  },
  {
    id: "monaco", name: "Mónaco", country: "Mónaco", region: "Mediterráneo",
    lat: 43.724, lon: 7.445, heading: Math.PI,
    description: "Aproximación exterior a Port Hercule. Fondeo ficticio, sin reproducir las dársenas reales.",
  },
  {
    id: "genoa", name: "Génova", country: "Italia", region: "Mediterráneo",
    lat: 44.375, lon: 8.93, heading: Math.PI,
    description: "Mar de Liguria · fondeo exterior al sur de Génova. Terminal genérica para la simulación.",
  },
  {
    id: "ajaccio", name: "Ajaccio", country: "Francia", region: "Mediterráneo",
    lat: 41.902, lon: 8.72, heading: Math.PI,
    description: "Costa occidental de Córcega · fondeo simplificado en el golfo de Ajaccio.",
  },
  {
    id: "palma", name: "Palma", country: "España", region: "Mediterráneo",
    lat: 39.525, lon: 2.62, heading: Math.PI,
    description: "Bahía de Palma, Mallorca · aproximación exterior y muelle de juego simplificados.",
  },
  {
    id: "valencia", name: "Valencia", country: "España", region: "Mediterráneo",
    lat: 39.423, lon: -0.278, heading: Math.PI,
    description: "Golfo de Valencia · fondeo al sureste del puerto real. Costa simplificada.",
  },
  {
    id: "cartagena", name: "Cartagena", country: "España", region: "Mediterráneo",
    lat: 37.555, lon: -0.98, heading: Math.PI,
    description: "Costa de Murcia · fondeo exterior al sur de Cartagena. Acceso y muelle genéricos.",
  },
  {
    id: "malaga", name: "Málaga", country: "España", region: "Mediterráneo",
    lat: 36.675, lon: -4.42, heading: Math.PI,
    description: "Mar de Alborán · aproximación exterior a Málaga. Instalación portuaria ficticia.",
  },
  {
    id: "gibraltar", name: "Gibraltar", country: "Gibraltar", region: "Mediterráneo",
    lat: 36.12, lon: -5.395, heading: Math.PI,
    description: "Bahía de Gibraltar · fondeo simplificado al oeste del peñón, conectado al estrecho.",
  },
  {
    id: "new-york",
    name: "Nueva York",
    country: "EE. UU.",
    region: "Atlántico norte",
    lat: 40.455,
    lon: -73.865,
    heading: Math.PI,
    description:
      "Aproximación oceánica a Lower Bay. Canales interiores no disponibles.",
  },
  {
    id: "cape-town",
    name: "Ciudad del Cabo",
    country: "Sudáfrica",
    region: "Atlántico sur",
    lat: -33.858,
    lon: 18.401,
    heading: 0,
    description:
      "Fondeo exterior de Table Bay. Corredores oceánicos por el cabo de Buena Esperanza.",
  },
  {
    id: "sydney",
    name: "Sídney",
    country: "Australia",
    region: "Pacífico",
    lat: -33.831,
    lon: 151.322,
    heading: Math.PI,
    description:
      "Aproximación exterior a Sydney Heads. Paso al puerto interior no disponible.",
  },
  {
    id: "yokohama",
    name: "Yokohama",
    country: "Japón",
    region: "Pacífico",
    lat: 35.406,
    lon: 139.753,
    heading: Math.PI,
    description: "Fondeo simplificado en bahía de Tokio. Navegación libre.",
  },
  ...EXPANDED_PORTS,
];

export const portById = (id: string): Port | undefined =>
  PORTS.find((port) => port.id === id);
