import type { Port } from "../types";

/** Civil zones for the game's listed service ports, not a political-boundary
 * polygon map. Multi-zone countries use explicit port exceptions below.
 * IANA references: https://data.iana.org/time-zones/tzdb/zone1970.tab
 * and https://www.iana.org/time-zones/tz-link . Intl supplies dated DST rules. */
const COUNTRY_ZONES: Readonly<Record<string, string>> = {
  "Francia": "Europe/Paris", "España": "Europe/Madrid", "Mónaco": "Europe/Paris",
  "Italia": "Europe/Rome", "Gibraltar": "Europe/Gibraltar", "Portugal": "Europe/Lisbon",
  "Irlanda": "Europe/Dublin", "Reino Unido": "Europe/London", "Islas Feroe": "Atlantic/Faroe",
  "Faroe Islands": "Atlantic/Faroe", "Islandia": "Atlantic/Reykjavik", "Groenlandia": "America/Nuuk",
  "EE. UU.": "America/New_York", "Estados Unidos": "America/New_York",
  "México": "America/Mexico_City", "Bermudas": "Atlantic/Bermuda", "Bahamas": "America/Nassau",
  "Cuba": "America/Havana", "Puerto Rico": "America/Puerto_Rico", "Colombia": "America/Bogota",
  "Panamá": "America/Panama", "Perú": "America/Lima", "Chile": "America/Santiago",
  "Brasil": "America/Sao_Paulo", "Argentina": "America/Argentina/Buenos_Aires", "Uruguay": "America/Montevideo",
  "Países Bajos": "Europe/Amsterdam", "Alemania": "Europe/Berlin", "Noruega": "Europe/Oslo",
  "Grecia": "Europe/Athens", "Turquía": "Europe/Istanbul", "Chipre": "Asia/Nicosia",
  "Egipto": "Africa/Cairo", "Israel": "Asia/Jerusalem", "Arabia Saudí": "Asia/Riyadh",
  "Arabia Saudita": "Asia/Riyadh", "Emiratos Árabes Unidos": "Asia/Dubai", "Yemen": "Asia/Aden",
  "Omán": "Asia/Muscat", "India": "Asia/Kolkata", "Sri Lanka": "Asia/Colombo",
  "Pakistán": "Asia/Karachi", "Singapur": "Asia/Singapore", "Malasia": "Asia/Kuala_Lumpur",
  "Indonesia": "Asia/Jakarta", "Tailandia": "Asia/Bangkok", "China": "Asia/Shanghai",
  "Corea del Sur": "Asia/Seoul", "Japón": "Asia/Tokyo", "Nueva Zelanda": "Pacific/Auckland",
  "Sudáfrica": "Africa/Johannesburg", "Senegal": "Africa/Dakar", "Marruecos": "Africa/Casablanca",
  "Sáhara Occidental": "Africa/El_Aaiun", "Mauritania": "Africa/Nouakchott", "Gambia": "Africa/Banjul",
  "Guinea": "Africa/Conakry", "Sierra Leona": "Africa/Freetown", "Liberia": "Africa/Monrovia",
  "Ghana": "Africa/Accra", "Nigeria": "Africa/Lagos", "Guinea Ecuatorial": "Africa/Malabo",
  "Gabón": "Africa/Libreville", "Rep. del Congo": "Africa/Brazzaville", "Angola": "Africa/Luanda",
  "Namibia": "Africa/Windhoek", "El Salvador": "America/El_Salvador", "Costa Rica": "America/Costa_Rica",
  "Ecuador": "America/Guayaquil", "Rep. Dominicana": "America/Santo_Domingo", "Jamaica": "America/Jamaica",
  "Honduras": "America/Tegucigalpa", "Antigua y Barbuda": "America/Antigua", "Martinica": "America/Martinique",
  "Trinidad y Tobago": "America/Port_of_Spain", "Guatemala": "America/Guatemala", "Nicaragua": "America/Managua",
  "Belice": "America/Belize",
};
const PORT_ZONES: Readonly<Record<string, string>> = {
  "ushuaia": "America/Argentina/Ushuaia", "rio-gallegos": "America/Argentina/Rio_Gallegos",
  "punta-arenas": "America/Punta_Arenas", "puerto-natales": "America/Punta_Arenas",
  "puerto-williams": "America/Punta_Arenas", "cape-horn": "America/Punta_Arenas",
  "puerto-chacabuco": "America/Coyhaique",
  // IANA explicitly assigns Escudero/Frei/Villa Las Estrellas to Magallanes:
  // https://data.iana.org/time-zones/tzdb/antarctica . Aysén uses Coyhaique since 2025.
  "fildes-bay": "America/Punta_Arenas",
  // Seasonal landing sites have no dedicated IANA station zone. Use the stated
  // UTC-03 operational convention, rather than inventing civil DST boundaries.
  // Port Lockroy operator IEE: https://documents.ats.aq/EIES/EIA/01750enRoyal%20Caribbean_IEE_4_15-16.pdf
  "deception-island": "Etc/GMT+3", "port-lockroy": "Etc/GMT+3",
  "saint-pierre": "America/Miquelon", "las-palmas": "Atlantic/Canary",
  "funchal": "Atlantic/Madeira", "ponta-delgada": "Atlantic/Azores", "horta": "Atlantic/Azores",
  "san-diego": "America/Los_Angeles", "los-angeles": "America/Los_Angeles", "san-francisco": "America/Los_Angeles",
  "seattle": "America/Los_Angeles", "morro-bay": "America/Los_Angeles", "eureka": "America/Los_Angeles", "astoria": "America/Los_Angeles",
  "cancun": "America/Cancun", "los-cabos": "America/Mazatlan", "mazatlan": "America/Mazatlan",
  "la-paz": "America/Mazatlan", "san-carlos": "America/Mazatlan", "bahia-tortugas": "America/Mazatlan",
  "ensenada": "America/Tijuana", "san-quintin": "America/Tijuana",
  "progreso": "America/Merida", "rio-lagartos": "America/Merida", "celestun": "America/Merida",
  "campeche": "America/Merida", "champoton": "America/Merida", "ciudad-carmen": "America/Merida",
  "qikiqtarjuaq": "America/Iqaluit", "pangnirtung": "America/Iqaluit", "iqaluit": "America/Iqaluit",
  "cape-dyer": "America/Iqaluit", "brevoort": "America/Iqaluit", "resolution-harbour": "America/Iqaluit",
  "saglek": "America/Goose_Bay", "nain": "America/Goose_Bay", "cartwright": "America/Goose_Bay", "hopedale": "America/Goose_Bay",
  "st-johns": "America/St_Johns", "st-anthony": "America/St_Johns", "bonavista": "America/St_Johns",
  "halifax": "America/Halifax", "yarmouth-canada": "America/Halifax",
  "north-sydney": "America/Glace_Bay", "port-hawkesbury": "America/Glace_Bay", "vancouver": "America/Vancouver",
  "recife": "America/Recife", "natal": "America/Fortaleza", "fortaleza": "America/Fortaleza",
  "ilheus": "America/Bahia", "salvador": "America/Bahia", "hong-kong": "Asia/Hong_Kong",
  "sydney": "Australia/Sydney", "brisbane": "Australia/Brisbane", "fremantle": "Australia/Perth",
};

export function portTimeZone(port: Port): string | undefined {
  return PORT_ZONES[port.id] ?? COUNTRY_ZONES[port.country];
}
