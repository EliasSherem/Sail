import type { LatLon, Port } from "../types";
import { PORTS } from "./ports";

export type PortArchitecture = "mediterranean" | "metropolis" | "resort" | "desert" | "industrial" | "northern" | "arctic" | "polar" | "tropical" | "asian";
export type TerminalKind = "marina" | "container" | "ferry" | "fishing" | "bulk" | "research";
export interface PortSceneProfile {
  id: string;
  architecture: PortArchitecture;
  terminal: TerminalKind;
  city?: LatLon;
  terminalPosition?: LatLon;
  cityRadius: number;
  buildings: number;
  height: number;
  highRise: number;
  streetAngle: number;
  palette: string[];
  roof: string;
  craneColor: string;
  description: string;
}
export interface OSMBuilding { id: number; lat: number; lon: number; h: number; k: string; p: [number, number][]; a: number }
export interface PortSceneAtlas { version: number; source: string; license: string; buildings: Record<string, OSMBuilding[]> }
export type LandmarkKind = "basilica" | "cathedral" | "sail-hotel" | "column" | "world-trade" | "liberty" | "opera" | "needle" | "gold-dome" | "skypark" | "lighthouse" | "stepped-hotel";
export interface PortLandmark extends LatLon { id: string; portId: string; kind: LandmarkKind; width: number; depth: number; height: number; heading?: number; source: string }

const styleDefaults: Record<PortArchitecture, Omit<PortSceneProfile, "id" | "architecture" | "description">> = {
  mediterranean: { terminal: "marina", cityRadius: 1900, buildings: 280, height: 16, highRise: 35, streetAngle: 0.12, palette: ["#d8c6a7", "#e0d3b5", "#c9b7a0", "#e8dfcd", "#bfad92"], roof: "#a66e4d", craneColor: "#486b78" },
  metropolis: { terminal: "container", cityRadius: 4200, buildings: 520, height: 35, highRise: 210, streetAngle: 0.35, palette: ["#9daaad", "#c6c5bb", "#929fa5", "#d1d3cf", "#b0b7b9"], roof: "#687076", craneColor: "#be4b36" },
  resort: { terminal: "marina", cityRadius: 3500, buildings: 310, height: 17, highRise: 65, streetAngle: 0.10, palette: ["#eee4d1", "#d5cbb8", "#f0e9db", "#c4b5a1", "#e7d1b3"], roof: "#b48a68", craneColor: "#8aa5a8" },
  desert: { terminal: "bulk", cityRadius: 2600, buildings: 220, height: 15, highRise: 58, streetAngle: 0.18, palette: ["#cfb697", "#e3d2b7", "#dcc5a1", "#bba98e", "#efddbe"], roof: "#b0a28b", craneColor: "#cf9b4d" },
  industrial: { terminal: "container", cityRadius: 3200, buildings: 340, height: 18, highRise: 62, streetAngle: 0, palette: ["#a5aba7", "#ccd0c5", "#a1b0b4", "#c2bbb0", "#8e9a9c"], roof: "#738084", craneColor: "#47779c" },
  northern: { terminal: "ferry", cityRadius: 1800, buildings: 180, height: 13, highRise: 38, streetAngle: 0.25, palette: ["#b78066", "#dfd2ba", "#98abb0", "#b8baa6", "#c5ad91"], roof: "#656769", craneColor: "#c4934a" },
  arctic: { terminal: "fishing", cityRadius: 1100, buildings: 85, height: 5.5, highRise: 11, streetAngle: 0.2, palette: ["#a85742", "#d0ac55", "#719ba5", "#d5d1bf", "#668c76"], roof: "#5a6067", craneColor: "#be8047" },
  polar: { terminal: "research", cityRadius: 160, buildings: 12, height: 3.5, highRise: 5, streetAngle: .2, palette: ["#b44838", "#d3ba62", "#e2e4dc", "#687d85", "#a45b46"], roof: "#505b62", craneColor: "#bca467" },
  tropical: { terminal: "ferry", cityRadius: 2300, buildings: 260, height: 11, highRise: 38, streetAngle: -0.15, palette: ["#d6bf95", "#e5d3b1", "#cb9d82", "#c5d7c7", "#e7d8be"], roof: "#b07153", craneColor: "#448da4" },
  asian: { terminal: "container", cityRadius: 4200, buildings: 460, height: 30, highRise: 160, streetAngle: -0.2, palette: ["#b5c3c8", "#d0d2c9", "#8eacb7", "#d7d5c6", "#a8babd"], roof: "#70878a", craneColor: "#bd573f" },
};

// These are deliberate regional building forms and port functions, not random
// recolourings of one dock. Exact footprints come from the OSM atlas where present.
const groups: Record<PortArchitecture, string[]> = {
  mediterranean: ["marseille", "cassis", "toulon", "barcelona", "la-ciotat", "bandol", "hyeres", "nice", "monaco", "genoa", "ajaccio", "palma", "valencia", "cartagena", "malaga", "gibraltar", "cadiz", "lisbon", "porto", "vigo", "a-coruna", "piraeus", "istanbul", "funchal", "las-palmas", "ponta-delgada", "horta"],
  metropolis: ["new-york", "boston", "miami", "san-diego", "los-angeles", "san-francisco", "seattle", "vancouver", "rio-de-janeiro", "santos", "buenos-aires", "montevideo", "sydney", "auckland", "brisbane", "dubai"],
  resort: ["acapulco", "los-cabos", "cancun", "bermuda", "nassau"],
  desert: ["haifa", "ashdod", "eilat", "port-said", "suez", "jeddah", "casablanca"],
  industrial: ["veracruz", "manzanillo", "colon", "balboa", "rotterdam", "hamburg", "callao", "valparaiso", "cape-town", "fremantle"],
  northern: ["brest", "cork", "falmouth", "killybegs", "stornoway", "reykjavik", "st-johns", "halifax", "bergen", "oslo", "saint-pierre", "st-anthony"],
  arctic: ["torshavn", "hofn", "vestmannaeyjar", "isafjordur", "tasiilaq", "prins-christian-sund", "nanortalik", "qaqortoq", "paamiut", "nuuk", "sisimiut", "qikiqtarjuaq", "pangnirtung", "iqaluit", "saglek", "nain", "cartwright"],
  polar: [],
  tropical: ["havana", "san-juan", "cartagena-colombia", "dakar", "colombo"],
  asian: ["mumbai", "singapore", "hong-kong", "shanghai", "busan", "yokohama"],
};
const pt = (lat: number, lon: number): LatLon => ({ lat, lon });
const specific: Record<string, Partial<PortSceneProfile>> = {
  marseille: { city: pt(43.297, 5.374), terminalPosition: pt(43.327, 5.353), terminal: "ferry", buildings: 420, height: 19, highRise: 58, streetAngle: .10, description: "Vieux-Port de fachadas claras y cubiertas de teja; ciudad densa y terminales de Joliette al norte." },
  barcelona: { city: pt(41.37, 2.177), terminalPosition: pt(41.336, 2.148), terminal: "container", buildings: 450, height: 23, highRise: 90, streetAngle: -.62, description: "Frente del Port Vell, manzanas compactas y grandes terminales al suroeste; hotel vela y columna costera." },
  "new-york": { city: pt(40.707, -74.009), terminalPosition: pt(40.661, -74.076), buildings: 650, height: 46, highRise: 310, streetAngle: .48, description: "Skyline real de Lower Manhattan a distancia del fondeo exterior, viviendas bajas de Brooklyn y terminales de Upper Bay." },
  acapulco: { city: pt(16.858, -99.89), terminalPosition: pt(16.849, -99.903), buildings: 390, height: 26, highRise: 110, streetAngle: .25, description: "Anfiteatro de la bahía: franja de hoteles altos claros, barrios escalonados y puerto de cruceros." },
  "los-cabos": { city: pt(22.892, -109.914), terminalPosition: pt(22.883, -109.916), height: 9, highRise: 28, buildings: 230, streetAngle: -.55, roof: "#b57f54", description: "Marina de Cabo San Lucas, complejos bajos blancos y ocres del desierto; cubiertas de teja y hoteles escalonados." },
  cancun: { city: pt(21.129, -86.765), buildings: 330, height: 29, highRise: 78, streetAngle: .12, description: "Hoteles blancos de la franja litoral de Cancún, volúmenes escalonados y corredores tropicales junto a la laguna." },
  veracruz: { city: pt(19.195, -96.139), terminalPosition: pt(19.22, -96.16), buildings: 360, height: 13, highRise: 34, streetAngle: .30, palette: ["#e5d7b3", "#d0b794", "#d9caaa", "#dcd1bc", "#be9e7d"], description: "Malecón histórico bajo de tonos arena, faro y complejo industrial de almacenes y grúas." },
  haifa: { city: pt(32.819, 34.994), terminalPosition: pt(32.821, 35.018), terminal: "container", buildings: 380, height: 22, highRise: 80, streetAngle: .68, description: "Ciudad en terrazas sobre el Carmelo, cúpula dorada y frente industrial de grúas al pie de la ladera." },
  ashdod: { city: pt(31.806, 34.651), terminalPosition: pt(31.826, 34.649), terminal: "container", buildings: 350, height: 27, highRise: 100, streetAngle: -.28, description: "Costa baja con bloques residenciales claros, almacenes, silos y grandes grúas de contenedores." },
  eilat: { city: pt(29.55, 34.951), terminalPosition: pt(29.526, 34.939), buildings: 240, height: 13, highRise: 45, streetAngle: .12, description: "Hoteles escalonados y marina en el extremo del golfo; terminal de carga en el litoral sur, entorno desértico." },
  singapore: { city: pt(1.291, 103.849), terminalPosition: pt(1.269, 103.824), buildings: 600, height: 45, highRise: 235, streetAngle: -.35, description: "Torres densas del centro, tres torres con SkyPark y filas de terminales de contenedores en el litoral sur." },
  sydney: { city: pt(-33.861, 151.211), terminalPosition: pt(-33.86, 151.203), terminal: "ferry", buildings: 480, height: 36, highRise: 150, streetAngle: -.13, description: "CBD junto a Circular Quay, cubiertas blancas inspiradas en la Ópera y torre mirador; barrios bajos en las bahías." },
  monaco: { buildings: 310, height: 35, highRise: 100, city: pt(43.737,7.421), cityRadius: 1200 },
  rotterdam: { buildings: 260, height: 13, highRise: 25, cityRadius: 5600, terminal: "container" },
  hamburg: { buildings: 190, height: 12, highRise: 25, terminal: "bulk" },
  "prins-christian-sund": { buildings: 12, cityRadius: 450, height: 4, highRise: 5 },
  saglek: { buildings: 10, cityRadius: 400, height: 4, highRise: 5 },
  "puerto-montt": { architecture: "northern", terminal: "ferry", buildings: 220, height: 10, highRise: 30 },
  "puerto-chacabuco": { architecture: "northern", terminal: "fishing", buildings: 45, cityRadius: 800, height: 6, highRise: 10 },
  "puerto-natales": { terminal: "ferry", buildings: 100, cityRadius: 1300, height: 6, highRise: 12 },
  "punta-arenas": { terminal: "ferry", buildings: 220, cityRadius: 2300, height: 8, highRise: 24 },
  ushuaia: { terminal: "ferry", buildings: 160, cityRadius: 1700, height: 7, highRise: 22 },
  "puerto-williams": { terminal: "fishing", buildings: 40, cityRadius: 700, height: 4.5, highRise: 7 },
  "cape-horn": { architecture: "polar", terminal: "research", buildings: 3, cityRadius: 100, height: 3.5, highRise: 5, description: "Cabo de Hornos: pequeño puesto aislado de cubiertas oscuras sobre roca y vegetación baja; fondeo de servicio ficticio." },
  // Approximate base massing, not surveyed replicas or claims of public fuel supply.
  // Fildes/Escudero: INACH; Port Lockroy: British Antarctic Survey / UKAHT.
  "fildes-bay": { city: pt(-62.2158333, -58.9597222), buildings: 16, cityRadius: 230, height: 4, highRise: 6, description: "Bahía Fildes: módulos bajos de las bases científicas entre roca oscura, nieve y hielo. Desembarco de juego, no terminal comercial." },
  "deception-island": { city: pt(-62.9833333, -60.5666667), buildings: 5, cityRadius: 140, height: 3.5, highRise: 5, palette: ["#8c5445", "#b09d7c", "#a4a8a6", "#6b7479", "#b47559"], description: "Isla Decepción: refugios bajos y restos de instalaciones en una bahía volcánica de roca negra y nieve; fondeo de juego." },
  "port-lockroy": { city: pt(-64.8166667, -63.5), buildings: 3, cityRadius: 80, height: 3, highRise: 4.5, palette: ["#303b42", "#444c50", "#dddace", "#9b4a3d", "#646a69"], roof: "#333d43", description: "Port Lockroy: pequeño conjunto de cabañas oscuras con detalles rojos, inspirado en la base histórica de isla Goudier, rodeado de hielo." },
  dubai: { buildings: 540, height: 40, highRise: 260, palette: ["#d7c6a6", "#c4cece", "#a6c0c5", "#e5d5b5", "#b1c2c4"] },
};

function regionalArchitecture(port: Port): PortArchitecture {
  if (port.lat < -60) return "polar";
  if (port.lat < -45) return "northern";
  if (port.lat > 60) return "arctic";
  if (port.region === "Mediterráneo" || /España|France|Francia|Portugal/.test(port.country)) return "mediterranean";
  if (/Rojo|Arábigo/.test(port.region)) return "desert";
  if (/asiático/.test(port.region)) return "asian";
  if (port.lat > 45) return "northern";
  if (/Caribe/.test(port.region)) return "tropical";
  if (port.lat > -24 && port.lat < 28) return "tropical";
  return "industrial";
}

export const PORT_SCENERY: PortSceneProfile[] = PORTS.map((port: Port) => {
  const architecture = specific[port.id]?.architecture ?? (Object.keys(groups) as PortArchitecture[]).find((key) => groups[key].includes(port.id)) ?? regionalArchitecture(port);
  const remoteService = port.name.includes("escala costera");
  return { id: port.id, architecture, ...styleDefaults[architecture],
    ...(remoteService ? { buildings: 8, cityRadius: 350, height: 4, highRise: 5, terminal: "fishing" as const } : {}),
    description: `${port.name}: composición regional aproximada de ${port.region}, con edificios y actividad portuaria propios del lugar.`, ...specific[port.id] };
});
export const portSceneProfile = (id: string) => PORT_SCENERY.find((p) => p.id === id)!;

// Approximate public coordinates and exterior massing, not surveyed 3D replicas.
export const PORT_LANDMARKS: PortLandmark[] = [
  { id: "notre-dame-garde", portId: "marseille", kind: "basilica", lat: 43.2841, lon: 5.3710, width: 70, depth: 38, height: 62, source: "https://www.notredamedelagarde.com/" },
  { id: "major", portId: "marseille", kind: "cathedral", lat: 43.2992, lon: 5.3646, width: 130, depth: 55, height: 65, source: "https://www.marseille-tourisme.com/decouvrez-marseille/culture-et-patrimoine/les-sites-remarquables/la-cathedrale-de-la-major/" },
  { id: "barcelona-sail", portId: "barcelona", kind: "sail-hotel", lat: 41.3685, lon: 2.1902, width: 78, depth: 36, height: 99, source: "https://www.marriott.com/en-us/hotels/bcnwh-w-barcelona/overview/" },
  { id: "columbus", portId: "barcelona", kind: "column", lat: 41.3758, lon: 2.1778, width: 20, depth: 20, height: 60, source: "https://www.barcelonaturisme.com/wv3/en/page/457/columbus-monument.html" },
  { id: "one-world", portId: "new-york", kind: "world-trade", lat: 40.7127, lon: -74.0134, width: 64, depth: 64, height: 541, source: "https://www.onewtc.com/" },
  { id: "liberty", portId: "new-york", kind: "liberty", lat: 40.6892, lon: -74.0445, width: 40, depth: 40, height: 93, source: "https://www.nps.gov/stli/learn/historyculture/colossal-monument.htm" },
  { id: "bahai-dome", portId: "haifa", kind: "gold-dome", lat: 32.8142, lon: 34.9870, width: 48, depth: 48, height: 40, source: "https://ganbahai.org.il/visit-us-haifa/" },
  { id: "carranza-lighthouse", portId: "veracruz", kind: "lighthouse", lat: 19.2023, lon: -96.1325, width: 45, depth: 36, height: 55, source: "https://www.puertodeveracruz.com.mx/infraestructura/mapa-de-instalaciones/" },
  { id: "eilat-hotel", portId: "eilat", kind: "stepped-hotel", lat: 29.5484, lon: 34.9654, width: 95, depth: 85, height: 42, source: "https://eilatport.co.il/infrastructure/" },
  { id: "marina-bay-sands", portId: "singapore", kind: "skypark", lat: 1.2838, lon: 103.8609, width: 340, depth: 100, height: 195, heading: -.38, source: "https://www.marinabaysands.com/guides/exceptional-experiences/marina-bay-sands-architecture.html" },
  { id: "sydney-opera", portId: "sydney", kind: "opera", lat: -33.8568, lon: 151.2153, width: 170, depth: 120, height: 64, source: "https://www.sydneyoperahouse.com/our-story/jorn-utzon" },
  { id: "sydney-tower", portId: "sydney", kind: "needle", lat: -33.8705, lon: 151.2089, width: 34, depth: 34, height: 305, source: "https://www.sydneytowereye.com.au/" },
];
