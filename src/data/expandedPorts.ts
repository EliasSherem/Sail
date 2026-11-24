import type { Port } from "../types";

// Regional locations, not surveyed docks. Offshore offsets are checked against World.
// Primary geographic reference: https://msi.nga.mil/api/publications/world-port-index?output=json
// Arctic references: Government of Nunavut, Parks Canada, DMI/GEUS (docs/port-network-sources.md).
export const EXPANDED_PORTS: Port[] = [
  {
    "id": "cadiz",
    "name": "Cádiz",
    "country": "España",
    "region": "Atlántico norte",
    "lat": 36.53,
    "lon": -6.32,
    "heading": 4.71238898038469,
    "description": "Atlántico norte · fondeo regional exterior de Cádiz. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "lisbon",
    "name": "Lisboa",
    "country": "Portugal",
    "region": "Atlántico norte",
    "lat": 38.66,
    "lon": -9.31,
    "heading": 4.1887902047863905,
    "description": "Atlántico norte · fondeo regional exterior de Lisboa. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "porto",
    "name": "Oporto",
    "country": "Portugal",
    "region": "Atlántico norte",
    "lat": 41.16,
    "lon": -8.71,
    "heading": 4.71238898038469,
    "description": "Atlántico norte · fondeo regional exterior de Oporto. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "vigo",
    "name": "Vigo",
    "country": "España",
    "region": "Atlántico norte",
    "lat": 42.22,
    "lon": -8.78,
    "heading": 4.1887902047863905,
    "description": "Atlántico norte · fondeo regional exterior de Vigo. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "a-coruna",
    "name": "A Coruña",
    "country": "España",
    "region": "Atlántico norte",
    "lat": 43.39,
    "lon": -8.37,
    "heading": 0,
    "description": "Atlántico norte · fondeo regional exterior de A Coruña. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "brest",
    "name": "Brest",
    "country": "Francia",
    "region": "Atlántico norte",
    "lat": 48.35,
    "lon": -4.61,
    "heading": 4.1887902047863905,
    "description": "Atlántico norte · fondeo regional exterior de Brest. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "cork",
    "name": "Cork",
    "country": "Irlanda",
    "region": "Atlántico norte",
    "lat": 51.78,
    "lon": -8.24,
    "heading": 3.141592653589793,
    "description": "Atlántico norte · fondeo regional exterior de Cork. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "falmouth",
    "name": "Falmouth",
    "country": "Reino Unido",
    "region": "Atlántico norte",
    "lat": 50.12,
    "lon": -5.04,
    "heading": 3.141592653589793,
    "description": "Atlántico norte · fondeo regional exterior de Falmouth. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "killybegs",
    "name": "Killybegs",
    "country": "Irlanda",
    "region": "Atlántico norte",
    "lat": 54.6,
    "lon": -8.45,
    "heading": 3.141592653589793,
    "description": "Atlántico norte · fondeo regional exterior de Killybegs. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "stornoway",
    "name": "Stornoway",
    "country": "Reino Unido",
    "region": "Atlántico norte",
    "lat": 58.17,
    "lon": -6.35,
    "heading": 3.141592653589793,
    "description": "Atlántico norte · fondeo regional exterior de Stornoway. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "torshavn",
    "name": "Tórshavn",
    "country": "Islas Feroe",
    "region": "Atlántico norte",
    "lat": 61.9899881,
    "lon": -6.6825508,
    "heading": 1.5707963267948966,
    "description": "Atlántico norte · fondeo regional exterior de Tórshavn. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "hofn",
    "name": "Höfn",
    "country": "Islandia",
    "region": "Atlántico norte",
    "lat": 64.22,
    "lon": -15.2,
    "heading": 3.141592653589793,
    "description": "Atlántico norte · fondeo regional exterior de Höfn. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "vestmannaeyjar",
    "name": "Vestmannaeyjar",
    "country": "Islandia",
    "region": "Atlántico norte",
    "lat": 63.43,
    "lon": -20.25,
    "heading": 1.5707963267948966,
    "description": "Atlántico norte · fondeo regional exterior de Vestmannaeyjar. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "reykjavik",
    "name": "Reikiavik",
    "country": "Islandia",
    "region": "Atlántico norte",
    "lat": 64.17,
    "lon": -21.99,
    "heading": 4.71238898038469,
    "description": "Atlántico norte · fondeo regional exterior de Reikiavik. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "isafjordur",
    "name": "Ísafjörður",
    "country": "Islandia",
    "region": "Atlántico norte",
    "lat": 66.1,
    "lon": -23.08,
    "heading": 0,
    "description": "Atlántico norte · fondeo regional exterior de Ísafjörður. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "tasiilaq",
    "name": "Tasiilaq",
    "country": "Groenlandia",
    "region": "Atlántico norte",
    "lat": 65.57,
    "lon": -37.62,
    "heading": 3.141592653589793,
    "description": "Atlántico norte · fondeo regional exterior de Tasiilaq. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "prins-christian-sund",
    "name": "Prins Christian Sund",
    "country": "Groenlandia",
    "region": "Atlántico norte",
    "lat": 60.05,
    "lon": -43.1,
    "heading": 1.5707963267948966,
    "description": "Entrada oriental de Prins Christian Sund. Estación de repostaje ficticia costera; hielo y restricciones reales no simulados."
  },
  {
    "id": "nanortalik",
    "name": "Nanortalik",
    "country": "Groenlandia",
    "region": "Atlántico norte",
    "lat": 60.12,
    "lon": -45.26,
    "heading": 3.141592653589793,
    "description": "Atlántico norte · fondeo regional exterior de Nanortalik. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "qaqortoq",
    "name": "Qaqortoq",
    "country": "Groenlandia",
    "region": "Atlántico norte",
    "lat": 60.7038153,
    "lon": -46.0377975,
    "heading": 3.141592653589793,
    "description": "Atlántico norte · fondeo regional exterior de Qaqortoq. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "paamiut",
    "name": "Paamiut",
    "country": "Groenlandia",
    "region": "Atlántico norte",
    "lat": 61.97,
    "lon": -49.7,
    "heading": 4.71238898038469,
    "description": "Atlántico norte · fondeo regional exterior de Paamiut. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "nuuk",
    "name": "Nuuk",
    "country": "Groenlandia",
    "region": "Atlántico norte",
    "lat": 64.15,
    "lon": -51.76,
    "heading": 4.71238898038469,
    "description": "Atlántico norte · fondeo regional exterior de Nuuk. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "sisimiut",
    "name": "Sisimiut",
    "country": "Groenlandia",
    "region": "Atlántico norte",
    "lat": 66.9299994,
    "lon": -53.7137702,
    "heading": 4.71238898038469,
    "description": "Atlántico norte · fondeo regional exterior de Sisimiut. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "qikiqtarjuaq",
    "name": "Qikiqtarjuaq",
    "country": "Canadá",
    "region": "Atlántico norte",
    "lat": 67.5495368,
    "lon": -64.0449781,
    "heading": 1.5707963267948966,
    "description": "Atlántico norte · fondeo regional exterior de Qikiqtarjuaq. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "pangnirtung",
    "name": "Pangnirtung",
    "country": "Canadá",
    "region": "Atlántico norte",
    "lat": 66.128669,
    "lon": -65.7855355,
    "heading": 4.1887902047863905,
    "description": "Atlántico norte · fondeo regional exterior de Pangnirtung. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "iqaluit",
    "name": "Iqaluit",
    "country": "Canadá",
    "region": "Atlántico norte",
    "lat": 63.72,
    "lon": -68.53,
    "heading": 2.443460952792061,
    "description": "Atlántico norte · fondeo regional exterior de Iqaluit. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "saglek",
    "name": "Saglek · Torngat",
    "country": "Canadá",
    "region": "Atlántico norte",
    "lat": 58.4809227,
    "lon": -62.6151505,
    "heading": 1.5707963267948966,
    "description": "Saglek, junto a Torngat y St. John's Harbour. Fondeo regional simplificado con servicios de juego."
  },
  {
    "id": "nain",
    "name": "Nain",
    "country": "Canadá",
    "region": "Atlántico norte",
    "lat": 56.53,
    "lon": -61.67,
    "heading": 1.5707963267948966,
    "description": "Atlántico norte · fondeo regional exterior de Nain. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "cartwright",
    "name": "Cartwright",
    "country": "Canadá",
    "region": "Atlántico norte",
    "lat": 53.7,
    "lon": -57.03,
    "heading": 1.5707963267948966,
    "description": "Atlántico norte · fondeo regional exterior de Cartwright. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "st-johns",
    "name": "San Juan de Terranova",
    "country": "Canadá",
    "region": "Atlántico norte",
    "lat": 47.56,
    "lon": -52.66,
    "heading": 1.5707963267948966,
    "description": "Atlántico norte · fondeo regional exterior de San Juan de Terranova. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "halifax",
    "name": "Halifax",
    "country": "Canadá",
    "region": "Atlántico norte",
    "lat": 44.61,
    "lon": -63.55,
    "heading": 3.141592653589793,
    "description": "Atlántico norte · fondeo regional exterior de Halifax. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "boston",
    "name": "Boston",
    "country": "EE. UU.",
    "region": "Atlántico norte",
    "lat": 42.3238154,
    "lon": -70.8948394,
    "heading": 1.5707963267948966,
    "description": "Atlántico norte · fondeo regional exterior de Boston. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "funchal",
    "name": "Funchal · Madeira",
    "country": "Portugal",
    "region": "Atlántico norte",
    "lat": 32.62,
    "lon": -16.92,
    "heading": 3.141592653589793,
    "description": "Atlántico norte · fondeo regional exterior de Funchal · Madeira. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "las-palmas",
    "name": "Las Palmas",
    "country": "España",
    "region": "Atlántico norte",
    "lat": 28.13,
    "lon": -15.3969407,
    "heading": 1.5707963267948966,
    "description": "Atlántico norte · fondeo regional exterior de Las Palmas. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "ponta-delgada",
    "name": "Ponta Delgada",
    "country": "Portugal",
    "region": "Atlántico norte",
    "lat": 37.72,
    "lon": -25.67,
    "heading": 3.141592653589793,
    "description": "Atlántico norte · fondeo regional exterior de Ponta Delgada. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "horta",
    "name": "Horta · Azores",
    "country": "Portugal",
    "region": "Atlántico norte",
    "lat": 38.52,
    "lon": -28.61,
    "heading": 1.5707963267948966,
    "description": "Atlántico norte · fondeo regional exterior de Horta · Azores. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "bermuda",
    "name": "Bermudas",
    "country": "Bermudas",
    "region": "Atlántico norte",
    "lat": 32.2573236,
    "lon": -64.7945442,
    "heading": 3.141592653589793,
    "description": "Atlántico norte · fondeo regional exterior de Bermudas. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "miami",
    "name": "Miami",
    "country": "EE. UU.",
    "region": "Caribe",
    "lat": 25.76,
    "lon": -80.1,
    "heading": 1.5707963267948966,
    "description": "Caribe · fondeo regional exterior de Miami. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "nassau",
    "name": "Nassau",
    "country": "Bahamas",
    "region": "Caribe",
    "lat": 25.1,
    "lon": -77.33,
    "heading": 0,
    "description": "Caribe · fondeo regional exterior de Nassau. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "havana",
    "name": "La Habana",
    "country": "Cuba",
    "region": "Caribe",
    "lat": 23.16,
    "lon": -82.36,
    "heading": 0,
    "description": "Caribe · fondeo regional exterior de La Habana. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "cancun",
    "name": "Cancún",
    "country": "México",
    "region": "Caribe",
    "lat": 21.1407703,
    "lon": -86.742818,
    "heading": 1.5707963267948966,
    "description": "Caribe · fondeo regional exterior de Cancún. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "veracruz",
    "name": "Veracruz",
    "country": "México",
    "region": "Caribe",
    "lat": 19.2,
    "lon": -96.1,
    "heading": 0.7853981633974483,
    "description": "Caribe · fondeo regional exterior de Veracruz. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "san-juan",
    "name": "San Juan de Puerto Rico",
    "country": "Puerto Rico",
    "region": "Caribe",
    "lat": 18.47,
    "lon": -66.12,
    "heading": 0,
    "description": "Caribe · fondeo regional exterior de San Juan de Puerto Rico. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "cartagena-colombia",
    "name": "Cartagena de Indias",
    "country": "Colombia",
    "region": "Caribe",
    "lat": 10.3174647,
    "lon": -75.5809379,
    "heading": 4.71238898038469,
    "description": "Caribe · fondeo regional exterior de Cartagena de Indias. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "colon",
    "name": "Colón · Panamá",
    "country": "Panamá",
    "region": "Caribe",
    "lat": 9.39,
    "lon": -79.925,
    "heading": 0,
    "description": "Fondeo exterior y terminal de juego junto a la entrada del canal navegable simplificado."
  },
  {
    "id": "balboa",
    "name": "Balboa · Panamá",
    "country": "Panamá",
    "region": "Pacífico",
    "lat": 8.92,
    "lon": -79.53,
    "heading": 3.141592653589793,
    "description": "Fondeo exterior y terminal de juego junto a la entrada del canal navegable simplificado."
  },
  {
    "id": "acapulco",
    "name": "Acapulco",
    "country": "México",
    "region": "Pacífico",
    "lat": 16.83,
    "lon": -99.92,
    "heading": 3.141592653589793,
    "description": "Pacífico · fondeo regional exterior de Acapulco. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "los-cabos",
    "name": "Los Cabos",
    "country": "México",
    "region": "Pacífico",
    "lat": 22.87,
    "lon": -109.9,
    "heading": 3.141592653589793,
    "description": "Pacífico · fondeo regional exterior de Los Cabos. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "manzanillo",
    "name": "Manzanillo",
    "country": "México",
    "region": "Pacífico",
    "lat": 19.0323419,
    "lon": -104.3340531,
    "heading": 3.141592653589793,
    "description": "Pacífico · fondeo regional exterior de Manzanillo. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "san-diego",
    "name": "San Diego",
    "country": "EE. UU.",
    "region": "Pacífico",
    "lat": 32.66,
    "lon": -117.2,
    "heading": 3.141592653589793,
    "description": "Pacífico · fondeo regional exterior de San Diego. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "los-angeles",
    "name": "Los Ángeles",
    "country": "EE. UU.",
    "region": "Pacífico",
    "lat": 33.69,
    "lon": -118.25,
    "heading": 3.141592653589793,
    "description": "Pacífico · fondeo regional exterior de Los Ángeles. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "san-francisco",
    "name": "San Francisco",
    "country": "EE. UU.",
    "region": "Pacífico",
    "lat": 37.79,
    "lon": -122.52,
    "heading": 4.71238898038469,
    "description": "Pacífico · fondeo regional exterior de San Francisco. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "seattle",
    "name": "Seattle",
    "country": "EE. UU.",
    "region": "Pacífico",
    "lat": 47.59,
    "lon": -122.39,
    "heading": 4.71238898038469,
    "description": "Pacífico · fondeo regional exterior de Seattle. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "vancouver",
    "name": "Vancouver",
    "country": "Canadá",
    "region": "Pacífico",
    "lat": 49.2581542,
    "lon": -123.2377691,
    "heading": 4.71238898038469,
    "description": "Pacífico · fondeo regional exterior de Vancouver. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "callao",
    "name": "Lima · Callao",
    "country": "Perú",
    "region": "Pacífico",
    "lat": -12.0599998,
    "lon": -77.1791962,
    "heading": 4.71238898038469,
    "description": "Pacífico · fondeo regional exterior de Lima · Callao. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "valparaiso",
    "name": "Valparaíso",
    "country": "Chile",
    "region": "Pacífico",
    "lat": -33.01,
    "lon": -71.63,
    "heading": 0,
    "description": "Pacífico · fondeo regional exterior de Valparaíso. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "rio-de-janeiro",
    "name": "Río de Janeiro",
    "country": "Brasil",
    "region": "Atlántico sur",
    "lat": -22.98,
    "lon": -43.15,
    "heading": 3.141592653589793,
    "description": "Atlántico sur · fondeo regional exterior de Río de Janeiro. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "santos",
    "name": "Santos",
    "country": "Brasil",
    "region": "Atlántico sur",
    "lat": -24.02,
    "lon": -46.3,
    "heading": 3.141592653589793,
    "description": "Atlántico sur · fondeo regional exterior de Santos. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "buenos-aires",
    "name": "Buenos Aires",
    "country": "Argentina",
    "region": "Atlántico sur",
    "lat": -34.61,
    "lon": -58.32,
    "heading": 1.5707963267948966,
    "description": "Atlántico sur · fondeo regional exterior de Buenos Aires. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "montevideo",
    "name": "Montevideo",
    "country": "Uruguay",
    "region": "Atlántico sur",
    "lat": -34.93,
    "lon": -56.22,
    "heading": 3.141592653589793,
    "description": "Atlántico sur · fondeo regional exterior de Montevideo. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "dakar",
    "name": "Dakar",
    "country": "Senegal",
    "region": "Atlántico norte",
    "lat": 14.6674647,
    "lon": -17.4290462,
    "heading": 3.141592653589793,
    "description": "Atlántico norte · fondeo regional exterior de Dakar. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "casablanca",
    "name": "Casablanca",
    "country": "Marruecos",
    "region": "Atlántico norte",
    "lat": 33.62,
    "lon": -7.6,
    "heading": 0,
    "description": "Atlántico norte · fondeo regional exterior de Casablanca. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "rotterdam",
    "name": "Róterdam",
    "country": "Países Bajos",
    "region": "Atlántico norte",
    "lat": 51.99,
    "lon": 4,
    "heading": 4.71238898038469,
    "description": "Atlántico norte · fondeo regional exterior de Róterdam. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "hamburg",
    "name": "Hamburgo · Elba",
    "country": "Alemania",
    "region": "Atlántico norte",
    "lat": 53.96,
    "lon": 8.65,
    "heading": 4.71238898038469,
    "description": "Fondeo ficticio en el acceso oceánico al Elba; el tramo fluvial a Hamburgo no se reproduce."
  },
  {
    "id": "bergen",
    "name": "Bergen",
    "country": "Noruega",
    "region": "Atlántico norte",
    "lat": 60.3946113,
    "lon": 5.2643408,
    "heading": 4.71238898038469,
    "description": "Atlántico norte · fondeo regional exterior de Bergen. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "oslo",
    "name": "Oslo",
    "country": "Noruega",
    "region": "Atlántico norte",
    "lat": 59.89,
    "lon": 10.72,
    "heading": 3.141592653589793,
    "description": "Atlántico norte · fondeo regional exterior de Oslo. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "piraeus",
    "name": "Atenas · El Pireo",
    "country": "Grecia",
    "region": "Mediterráneo",
    "lat": 37.92,
    "lon": 23.61,
    "heading": 3.141592653589793,
    "description": "Mediterráneo · fondeo regional exterior de Atenas · El Pireo. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "istanbul",
    "name": "Estambul",
    "country": "Turquía",
    "region": "Mediterráneo",
    "lat": 40.96,
    "lon": 28.98,
    "heading": 3.141592653589793,
    "description": "Mediterráneo · fondeo regional exterior de Estambul. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "port-said",
    "name": "Port Said",
    "country": "Egipto",
    "region": "Mediterráneo",
    "lat": 31.3,
    "lon": 32.34,
    "heading": 0,
    "description": "Fondeo exterior y terminal de juego junto a la entrada del canal navegable simplificado."
  },
  {
    "id": "haifa",
    "name": "Haifa",
    "country": "Israel",
    "region": "Mediterráneo",
    "lat": 32.8526762,
    "lon": 34.9945078,
    "heading": 0,
    "description": "Mediterráneo · fondeo regional exterior de Haifa. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "ashdod",
    "name": "Ashdod",
    "country": "Israel",
    "region": "Mediterráneo",
    "lat": 31.84,
    "lon": 34.63,
    "heading": 4.71238898038469,
    "description": "Mediterráneo · fondeo regional exterior de Ashdod. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "suez",
    "name": "Suez",
    "country": "Egipto",
    "region": "Mar Rojo",
    "lat": 29.91,
    "lon": 32.57,
    "heading": 3.141592653589793,
    "description": "Fondeo exterior y terminal de juego junto a la entrada del canal navegable simplificado."
  },
  {
    "id": "eilat",
    "name": "Eilat",
    "country": "Israel",
    "region": "Mar Rojo",
    "lat": 29.53,
    "lon": 34.96,
    "heading": 3.141592653589793,
    "description": "Mar Rojo · fondeo regional exterior de Eilat. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "jeddah",
    "name": "Yeda",
    "country": "Arabia Saudí",
    "region": "Mar Rojo",
    "lat": 21.47,
    "lon": 39.13,
    "heading": 4.71238898038469,
    "description": "Mar Rojo · fondeo regional exterior de Yeda. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "dubai",
    "name": "Dubái",
    "country": "Emiratos Árabes Unidos",
    "region": "Índico",
    "lat": 25.28,
    "lon": 55.26,
    "heading": 4.71238898038469,
    "description": "Índico · fondeo regional exterior de Dubái. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "mumbai",
    "name": "Bombay",
    "country": "India",
    "region": "Índico",
    "lat": 18.89,
    "lon": 72.82,
    "heading": 3.141592653589793,
    "description": "Índico · fondeo regional exterior de Bombay. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "colombo",
    "name": "Colombo",
    "country": "Sri Lanka",
    "region": "Índico",
    "lat": 6.97,
    "lon": 79.82,
    "heading": 4.71238898038469,
    "description": "Índico · fondeo regional exterior de Colombo. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "singapore",
    "name": "Singapur",
    "country": "Singapur",
    "region": "Índico",
    "lat": 1.23,
    "lon": 103.8,
    "heading": 3.141592653589793,
    "description": "Índico · fondeo regional exterior de Singapur. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "hong-kong",
    "name": "Hong Kong",
    "country": "China",
    "region": "Pacífico",
    "lat": 22.2260092,
    "lon": 114.1548869,
    "heading": 3.141592653589793,
    "description": "Pacífico · fondeo regional exterior de Hong Kong. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "shanghai",
    "name": "Shanghái · Yangshan",
    "country": "China",
    "region": "Pacífico",
    "lat": 30.5836406,
    "lon": 122.0873867,
    "heading": 3.141592653589793,
    "description": "Pacífico · fondeo regional exterior de Shanghái · Yangshan. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "busan",
    "name": "Busan",
    "country": "Corea del Sur",
    "region": "Pacífico",
    "lat": 35.05,
    "lon": 129.06,
    "heading": 3.141592653589793,
    "description": "Pacífico · fondeo regional exterior de Busan. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "auckland",
    "name": "Auckland",
    "country": "Nueva Zelanda",
    "region": "Pacífico",
    "lat": -36.8219077,
    "lon": 174.8023832,
    "heading": 1.5707963267948966,
    "description": "Pacífico · fondeo regional exterior de Auckland. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "brisbane",
    "name": "Brisbane",
    "country": "Australia",
    "region": "Pacífico",
    "lat": -27.34,
    "lon": 153.2,
    "heading": 1.5707963267948966,
    "description": "Pacífico · fondeo regional exterior de Brisbane. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "fremantle",
    "name": "Perth · Fremantle",
    "country": "Australia",
    "region": "Índico",
    "lat": -32.05,
    "lon": 115.73,
    "heading": 4.71238898038469,
    "description": "Índico · fondeo regional exterior de Perth · Fremantle. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "st-anthony",
    "name": "St. Anthony",
    "country": "Canadá",
    "region": "Atlántico norte",
    "lat": 51.359998,
    "lon": -55.5383964,
    "heading": 1.5707963267948966,
    "description": "Atlántico norte · fondeo regional exterior de St. Anthony. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "saint-pierre",
    "name": "Saint-Pierre",
    "country": "Francia",
    "region": "Atlántico norte",
    "lat": 46.76,
    "lon": -56.13,
    "heading": 2.356194490192345,
    "description": "Atlántico norte · fondeo regional exterior de Saint-Pierre. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "la-spezia",
    "name": "La Spezia",
    "country": "Italia",
    "region": "Mediterráneo",
    "lat": 44.0910068,
    "lon": 9.8333333,
    "heading": 3.141592653589793,
    "description": "Mediterráneo · fondeo regional exterior de La Spezia. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "livorno",
    "name": "Livorno",
    "country": "Italia",
    "region": "Mediterráneo",
    "lat": 43.542,
    "lon": 10.29,
    "heading": 4.71238898038469,
    "description": "Mediterráneo · fondeo regional exterior de Livorno. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "piombino",
    "name": "Piombino",
    "country": "Italia",
    "region": "Mediterráneo",
    "lat": 42.9288664,
    "lon": 10.561737,
    "heading": 2.443460952792061,
    "description": "Mediterráneo · fondeo regional exterior de Piombino. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "civitavecchia",
    "name": "Civitavecchia",
    "country": "Italia",
    "region": "Mediterráneo",
    "lat": 42.102,
    "lon": 11.771,
    "heading": 4.537856055185257,
    "description": "Mediterráneo · fondeo regional exterior de Civitavecchia. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "anzio",
    "name": "Anzio",
    "country": "Italia",
    "region": "Mediterráneo",
    "lat": 41.4421844,
    "lon": 12.6319101,
    "heading": 3.9269908169872414,
    "description": "Mediterráneo · fondeo regional exterior de Anzio. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "gaeta",
    "name": "Gaeta",
    "country": "Italia",
    "region": "Mediterráneo",
    "lat": 41.2107738,
    "lon": 13.5845782,
    "heading": 3.9269908169872414,
    "description": "Mediterráneo · fondeo regional exterior de Gaeta. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "naples",
    "name": "Nápoles",
    "country": "Italia",
    "region": "Mediterráneo",
    "lat": 40.8276041,
    "lon": 14.275,
    "heading": 3.141592653589793,
    "description": "Mediterráneo · fondeo regional exterior de Nápoles. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "salerno",
    "name": "Salerno",
    "country": "Italia",
    "region": "Mediterráneo",
    "lat": 40.6531769,
    "lon": 14.75,
    "heading": 3.141592653589793,
    "description": "Mediterráneo · fondeo regional exterior de Salerno. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "vibo-valentia",
    "name": "Vibo Valentia",
    "country": "Italia",
    "region": "Mediterráneo",
    "lat": 38.7307882,
    "lon": 16.1242358,
    "heading": 5.410520681182422,
    "description": "Mediterráneo · fondeo regional exterior de Vibo Valentia. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "palermo",
    "name": "Palermo",
    "country": "Italia",
    "region": "Mediterráneo",
    "lat": 38.1253589,
    "lon": 13.3880837,
    "heading": 0,
    "description": "Mediterráneo · fondeo regional exterior de Palermo. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "messina",
    "name": "Messina",
    "country": "Italia",
    "region": "Mediterráneo",
    "lat": 38.1932307,
    "lon": 15.5903226,
    "heading": 1.5707963267948966,
    "description": "Mediterráneo · fondeo regional exterior de Messina. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "catania",
    "name": "Catania",
    "country": "Italia",
    "region": "Mediterráneo",
    "lat": 37.4999995,
    "lon": 15.1113357,
    "heading": 1.5707963267948966,
    "description": "Mediterráneo · fondeo regional exterior de Catania. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "crotone",
    "name": "Crotone",
    "country": "Italia",
    "region": "Mediterráneo",
    "lat": 39.0843589,
    "lon": 17.1441925,
    "heading": 1.5707963267948966,
    "description": "Mediterráneo · fondeo regional exterior de Crotone. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "taranto",
    "name": "Taranto",
    "country": "Italia",
    "region": "Mediterráneo",
    "lat": 40.4666667,
    "lon": 17.2,
    "heading": 3.9269908169872414,
    "description": "Mediterráneo · fondeo regional exterior de Taranto. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "brindisi",
    "name": "Brindisi",
    "country": "Italia",
    "region": "Mediterráneo",
    "lat": 40.6639887,
    "lon": 18.0017767,
    "heading": 0.7853981633974483,
    "description": "Mediterráneo · fondeo regional exterior de Brindisi. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "corfu",
    "name": "Corfú",
    "country": "Grecia",
    "region": "Mediterráneo",
    "lat": 39.6166666,
    "lon": 19.9368357,
    "heading": 1.5707963267948966,
    "description": "Mediterráneo · fondeo regional exterior de Corfú. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "argostoli",
    "name": "Argostoli",
    "country": "Grecia",
    "region": "Mediterráneo",
    "lat": 38.1653402,
    "lon": 20.477043,
    "heading": 3.839724354387525,
    "description": "Mediterráneo · fondeo regional exterior de Argostoli. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "katakolon",
    "name": "Katakolon",
    "country": "Grecia",
    "region": "Mediterráneo",
    "lat": 37.6453851,
    "lon": 21.3006574,
    "heading": 4.363323129985823,
    "description": "Mediterráneo · fondeo regional exterior de Katakolon. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "kalamata",
    "name": "Kalamata",
    "country": "Grecia",
    "region": "Mediterráneo",
    "lat": 37.0076735,
    "lon": 22.1166667,
    "heading": 3.141592653589793,
    "description": "Mediterráneo · fondeo regional exterior de Kalamata. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "kissamos",
    "name": "Kissamos",
    "country": "Grecia",
    "region": "Mediterráneo",
    "lat": 35.5301565,
    "lon": 23.6333333,
    "heading": 0,
    "description": "Mediterráneo · fondeo regional exterior de Kissamos. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "heraklion",
    "name": "Heraclión",
    "country": "Grecia",
    "region": "Mediterráneo",
    "lat": 35.35,
    "lon": 25.15,
    "heading": 0,
    "description": "Mediterráneo · fondeo regional exterior de Heraclión. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "sitia",
    "name": "Sitia",
    "country": "Grecia",
    "region": "Mediterráneo",
    "lat": 35.2166667,
    "lon": 26.1333333,
    "heading": 0,
    "description": "Mediterráneo · fondeo regional exterior de Sitia. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "rhodes",
    "name": "Rodas",
    "country": "Grecia",
    "region": "Mediterráneo",
    "lat": 36.45,
    "lon": 28.2333333,
    "heading": 1.5707963267948966,
    "description": "Mediterráneo · fondeo regional exterior de Rodas. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "fethiye",
    "name": "Fethiye",
    "country": "Turquía",
    "region": "Mediterráneo",
    "lat": 36.6425567,
    "lon": 29.0684031,
    "heading": 3.839724354387525,
    "description": "Mediterráneo · fondeo regional exterior de Fethiye. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "antalya",
    "name": "Antalya",
    "country": "Turquía",
    "region": "Mediterráneo",
    "lat": 36.8206569,
    "lon": 30.6224302,
    "heading": 3.141592653589793,
    "description": "Mediterráneo · fondeo regional exterior de Antalya. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "alanya",
    "name": "Alanya",
    "country": "Turquía",
    "region": "Mediterráneo",
    "lat": 36.5333333,
    "lon": 32,
    "heading": 2.792526803190927,
    "description": "Mediterráneo · fondeo regional exterior de Alanya. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "limassol",
    "name": "Limassol",
    "country": "Chipre",
    "region": "Mediterráneo",
    "lat": 34.6539903,
    "lon": 33.0556088,
    "heading": 3.141592653589793,
    "description": "Mediterráneo · fondeo regional exterior de Limassol. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "larnaca",
    "name": "Lárnaca",
    "country": "Chipre",
    "region": "Mediterráneo",
    "lat": 34.907995,
    "lon": 33.6626011,
    "heading": 2.2689280275926285,
    "description": "Mediterráneo · fondeo regional exterior de Lárnaca. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "progreso",
    "name": "Progreso",
    "country": "México",
    "region": "Caribe",
    "lat": 21.3103129,
    "lon": -89.6666667,
    "heading": 0,
    "description": "Caribe · fondeo regional exterior de Progreso. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "lazaro-cardenas",
    "name": "Lázaro Cárdenas",
    "country": "México",
    "region": "Pacífico",
    "lat": 17.9135483,
    "lon": -102.1666667,
    "heading": 3.141592653589793,
    "description": "Pacífico · fondeo regional exterior de Lázaro Cárdenas. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "puerto-vallarta",
    "name": "Puerto Vallarta",
    "country": "México",
    "region": "Pacífico",
    "lat": 20.6157439,
    "lon": -105.2693754,
    "heading": 4.71238898038469,
    "description": "Pacífico · fondeo regional exterior de Puerto Vallarta. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "mazatlan",
    "name": "Mazatlán",
    "country": "México",
    "region": "Pacífico",
    "lat": 23.1809212,
    "lon": -106.4374196,
    "heading": 3.9269908169872414,
    "description": "Pacífico · fondeo regional exterior de Mazatlán. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "la-paz",
    "name": "La Paz",
    "country": "México",
    "region": "Pacífico",
    "lat": 24.1801052,
    "lon": -110.3179555,
    "heading": 5.410520681182422,
    "description": "Pacífico · fondeo regional exterior de La Paz. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "ensenada",
    "name": "Ensenada",
    "country": "México",
    "region": "Pacífico",
    "lat": 31.8526755,
    "lon": -116.6498038,
    "heading": 3.9269908169872414,
    "description": "Pacífico · fondeo regional exterior de Ensenada. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "rio-lagartos",
    "name": "Río Lagartos",
    "country": "México",
    "region": "Caribe",
    "lat": 21.6129509,
    "lon": -88.1606615,
    "heading": 0,
    "description": "Caribe · fondeo regional exterior de Río Lagartos. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "celestun",
    "name": "Celestún",
    "country": "México",
    "region": "Caribe",
    "lat": 20.8479574,
    "lon": -90.4281483,
    "heading": 4.71238898038469,
    "description": "Caribe · fondeo regional exterior de Celestún. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "campeche",
    "name": "Campeche",
    "country": "México",
    "region": "Caribe",
    "lat": 19.8356347,
    "lon": -90.6015539,
    "heading": 4.71238898038469,
    "description": "Caribe · fondeo regional exterior de Campeche. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "champoton",
    "name": "Champotón",
    "country": "México",
    "region": "Caribe",
    "lat": 19.3580325,
    "lon": -90.7501237,
    "heading": 4.71238898038469,
    "description": "Caribe · fondeo regional exterior de Champotón. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "ciudad-carmen",
    "name": "Ciudad del Carmen",
    "country": "México",
    "region": "Caribe",
    "lat": 18.641667,
    "lon": -91.841667,
    "heading": 4.71238898038469,
    "description": "Caribe · fondeo regional exterior de Ciudad del Carmen. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "dos-bocas",
    "name": "Dos Bocas",
    "country": "México",
    "region": "Caribe",
    "lat": 18.4514257,
    "lon": -93.1927776,
    "heading": 0,
    "description": "Caribe · fondeo regional exterior de Dos Bocas. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "coatzacoalcos",
    "name": "Coatzacoalcos",
    "country": "México",
    "region": "Caribe",
    "lat": 18.1644026,
    "lon": -94.4167782,
    "heading": 0,
    "description": "Caribe · fondeo regional exterior de Coatzacoalcos. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "alvarado",
    "name": "Alvarado",
    "country": "México",
    "region": "Caribe",
    "lat": 18.7673288,
    "lon": -95.7659538,
    "heading": 0.7853981633974483,
    "description": "Caribe · fondeo regional exterior de Alvarado. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "zihuatanejo",
    "name": "Zihuatanejo",
    "country": "México",
    "region": "Pacífico",
    "lat": 17.6266154,
    "lon": -101.5620064,
    "heading": 3.141592653589793,
    "description": "Pacífico · fondeo regional exterior de Zihuatanejo. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "san-carlos",
    "name": "Puerto San Carlos · Magdalena",
    "country": "México",
    "region": "Pacífico",
    "lat": 24.7886111,
    "lon": -112.1177778,
    "heading": 4.1887902047863905,
    "description": "Pacífico · fondeo regional exterior de Puerto San Carlos · Magdalena. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "bahia-tortugas",
    "name": "Bahía Tortugas",
    "country": "México",
    "region": "Pacífico",
    "lat": 27.6833333,
    "lon": -114.8833333,
    "heading": 3.141592653589793,
    "description": "Pacífico · fondeo regional exterior de Bahía Tortugas. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "san-quintin",
    "name": "San Quintín",
    "country": "México",
    "region": "Pacífico",
    "lat": 30.4358333,
    "lon": -115.9869444,
    "heading": 4.71238898038469,
    "description": "Pacífico · fondeo regional exterior de San Quintín. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "gijon",
    "name": "Gijón",
    "country": "España",
    "region": "Atlántico norte",
    "lat": 43.569785,
    "lon": -5.6666667,
    "heading": 0,
    "description": "Atlántico norte · fondeo regional exterior de Gijón. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "santander",
    "name": "Santander",
    "country": "España",
    "region": "Atlántico norte",
    "lat": 43.4666667,
    "lon": -3.7833333,
    "heading": 0,
    "description": "Atlántico norte · fondeo regional exterior de Santander. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "la-rochelle",
    "name": "La Rochelle",
    "country": "Francia",
    "region": "Atlántico norte",
    "lat": 46.1453086,
    "lon": -1.1883495,
    "heading": 4.537856055185257,
    "description": "Atlántico norte · fondeo regional exterior de La Rochelle. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "newlyn",
    "name": "Newlyn",
    "country": "Reino Unido",
    "region": "Atlántico norte",
    "lat": 50.0976635,
    "lon": -5.5478971,
    "heading": 2.6179938779914944,
    "description": "Atlántico norte · fondeo regional exterior de Newlyn. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "galway",
    "name": "Galway",
    "country": "Irlanda",
    "region": "Atlántico norte",
    "lat": 53.2666667,
    "lon": -9.05,
    "heading": 3.6651914291880923,
    "description": "Atlántico norte · fondeo regional exterior de Galway. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "oban",
    "name": "Oban",
    "country": "Reino Unido",
    "region": "Atlántico norte",
    "lat": 56.4212783,
    "lon": -5.489586,
    "heading": 5.061454830783555,
    "description": "Atlántico norte · fondeo regional exterior de Oban. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "scrabster",
    "name": "Scrabster",
    "country": "Reino Unido",
    "region": "Atlántico norte",
    "lat": 58.6166667,
    "lon": -3.55,
    "heading": 0.17453292519943295,
    "description": "Atlántico norte · fondeo regional exterior de Scrabster. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "stromness",
    "name": "Stromness",
    "country": "Reino Unido",
    "region": "Atlántico norte",
    "lat": 58.9539901,
    "lon": -3.3089462,
    "heading": 3.141592653589793,
    "description": "Atlántico norte · fondeo regional exterior de Stromness. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "lerwick",
    "name": "Lerwick",
    "country": "Reino Unido",
    "region": "Atlántico norte",
    "lat": 60.186785,
    "lon": -1.15,
    "heading": 1.7453292519943295,
    "description": "Atlántico norte · fondeo regional exterior de Lerwick. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "sorvagur",
    "name": "Sørvágur",
    "country": "Faroe Islands",
    "region": "Atlántico norte",
    "lat": 62.0710111,
    "lon": -7.3221714,
    "heading": 4.71238898038469,
    "description": "Atlántico norte · fondeo regional exterior de Sørvágur. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "budir",
    "name": "Fáskrúðsfjörður",
    "country": "Islandia",
    "region": "Atlántico norte",
    "lat": 64.9240938,
    "lon": -13.9568473,
    "heading": 2.2689280275926285,
    "description": "Atlántico norte · fondeo regional exterior de Fáskrúðsfjörður. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "seydisfjordur",
    "name": "Seyðisfjörður",
    "country": "Islandia",
    "region": "Atlántico norte",
    "lat": 65.2835429,
    "lon": -13.8888386,
    "heading": 1.2217304763960306,
    "description": "Atlántico norte · fondeo regional exterior de Seyðisfjörður. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "qutdleq",
    "name": "Qutdleq · escala costera",
    "country": "Groenlandia",
    "region": "Atlántico norte",
    "lat": 61.5166667,
    "lon": -42.2166667,
    "heading": 1.9198621771937625,
    "description": "Atlántico norte · fondeo regional exterior de Qutdleq · escala costera. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "north-sydney",
    "name": "North Sydney",
    "country": "Canadá",
    "region": "Atlántico norte",
    "lat": 46.2083022,
    "lon": -60.2240891,
    "heading": 1.2217304763960306,
    "description": "Atlántico norte · fondeo regional exterior de North Sydney. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "port-hawkesbury",
    "name": "Port Hawkesbury",
    "country": "Canadá",
    "region": "Atlántico norte",
    "lat": 45.6131981,
    "lon": -61.3725759,
    "heading": 4.014257279586958,
    "description": "Atlántico norte · fondeo regional exterior de Port Hawkesbury. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "portland-maine",
    "name": "Portland, Maine",
    "country": "Estados Unidos",
    "region": "Atlántico norte",
    "lat": 43.6666667,
    "lon": -70.25,
    "heading": 2.0943951023931953,
    "description": "Atlántico norte · fondeo regional exterior de Portland, Maine. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "newport-rhode-island",
    "name": "Newport, Rhode Island",
    "country": "Estados Unidos",
    "region": "Atlántico norte",
    "lat": 41.4990772,
    "lon": -71.3367183,
    "heading": 3.141592653589793,
    "description": "Atlántico norte · fondeo regional exterior de Newport, Rhode Island. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "portimao",
    "name": "Portimão",
    "country": "Portugal",
    "region": "Atlántico norte",
    "lat": 37.109302,
    "lon": -8.533,
    "heading": 3.141592653589793,
    "description": "Atlántico norte · fondeo regional exterior de Portimão. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "bayonne",
    "name": "Bayona",
    "country": "Francia",
    "region": "Atlántico norte",
    "lat": 43.5343489,
    "lon": -1.5322229,
    "heading": 5.235987755982989,
    "description": "Atlántico norte · fondeo regional exterior de Bayona. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "lorient",
    "name": "Lorient",
    "country": "Francia",
    "region": "Atlántico norte",
    "lat": 47.673,
    "lon": -3.386,
    "heading": 3.6651914291880923,
    "description": "Atlántico norte · fondeo regional exterior de Lorient. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "dingle",
    "name": "Dingle",
    "country": "Irlanda",
    "region": "Atlántico norte",
    "lat": 52.1,
    "lon": -10.27,
    "heading": 3.141592653589793,
    "description": "Atlántico norte · fondeo regional exterior de Dingle. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "kangerlussuaq-east",
    "name": "Kangerlussuaq Este · escala costera",
    "country": "Groenlandia",
    "region": "Atlántico norte",
    "lat": 68.083333,
    "lon": -31.666667,
    "heading": 2.6179938779914944,
    "description": "Atlántico norte · fondeo regional exterior de Kangerlussuaq Este · escala costera. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "kulusuk",
    "name": "Kulusuk",
    "country": "Groenlandia",
    "region": "Atlántico norte",
    "lat": 65.5784283,
    "lon": -37.2071269,
    "heading": 1.7453292519943295,
    "description": "Atlántico norte · fondeo regional exterior de Kulusuk. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "skjoldungen",
    "name": "Skjoldungen · escala costera",
    "country": "Groenlandia",
    "region": "Atlántico norte",
    "lat": 63.37,
    "lon": -41.18,
    "heading": 1.9198621771937625,
    "description": "Atlántico norte · fondeo regional exterior de Skjoldungen · escala costera. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "timmiarmiut",
    "name": "Timmiarmiut · escala costera",
    "country": "Groenlandia",
    "region": "Atlántico norte",
    "lat": 62.5216331,
    "lon": -42.2888618,
    "heading": 1.9198621771937625,
    "description": "Atlántico norte · fondeo regional exterior de Timmiarmiut · escala costera. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "cape-dyer",
    "name": "Cape Dyer · escala costera",
    "country": "Canadá",
    "region": "Atlántico norte",
    "lat": 66.558333,
    "lon": -61.659444,
    "heading": 3.141592653589793,
    "description": "Atlántico norte · fondeo regional exterior de Cape Dyer · escala costera. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "brevoort",
    "name": "Brevoort Harbour · escala costera",
    "country": "Canadá",
    "region": "Atlántico norte",
    "lat": 63.3201555,
    "lon": -64.1043129,
    "heading": 2.0943951023931953,
    "description": "Atlántico norte · fondeo regional exterior de Brevoort Harbour · escala costera. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "resolution-harbour",
    "name": "Resolution Harbour · escala costera",
    "country": "Canadá",
    "region": "Atlántico norte",
    "lat": 61.3,
    "lon": -64.85,
    "heading": 2.6179938779914944,
    "description": "Atlántico norte · fondeo regional exterior de Resolution Harbour · escala costera. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "hopedale",
    "name": "Hopedale",
    "country": "Canadá",
    "region": "Atlántico norte",
    "lat": 55.459,
    "lon": -60.204,
    "heading": 1.5707963267948966,
    "description": "Atlántico norte · fondeo regional exterior de Hopedale. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "bonavista",
    "name": "Bonavista",
    "country": "Canadá",
    "region": "Atlántico norte",
    "lat": 48.6676761,
    "lon": -53.1219861,
    "heading": 0,
    "description": "Atlántico norte · fondeo regional exterior de Bonavista. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "yarmouth-canada",
    "name": "Yarmouth",
    "country": "Canadá",
    "region": "Atlántico norte",
    "lat": 43.802,
    "lon": -66.17,
    "heading": 4.014257279586958,
    "description": "Atlántico norte · fondeo regional exterior de Yarmouth. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "morro-bay",
    "name": "Morro Bay",
    "country": "EE. UU.",
    "region": "Pacífico americano",
    "lat": 35.3657298,
    "lon": -120.8565164,
    "heading": 4.1887902047863905,
    "description": "Pacífico americano · fondeo regional exterior de Morro Bay. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "eureka",
    "name": "Eureka",
    "country": "EE. UU.",
    "region": "Pacífico americano",
    "lat": 40.8018453,
    "lon": -124.1900314,
    "heading": 4.71238898038469,
    "description": "Pacífico americano · fondeo regional exterior de Eureka. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "astoria",
    "name": "Astoria",
    "country": "EE. UU.",
    "region": "Pacífico americano",
    "lat": 46.2,
    "lon": -123.833333,
    "heading": 4.71238898038469,
    "description": "Pacífico americano · fondeo regional exterior de Astoria. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "acajutla",
    "name": "Acajutla",
    "country": "El Salvador",
    "region": "Pacífico americano",
    "lat": 13.557895,
    "lon": -89.8594988,
    "heading": 3.9269908169872414,
    "description": "Pacífico americano · fondeo regional exterior de Acajutla. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "puerto-caldera",
    "name": "Puerto Caldera",
    "country": "Costa Rica",
    "region": "Pacífico americano",
    "lat": 9.916667,
    "lon": -84.716667,
    "heading": 4.1887902047863905,
    "description": "Pacífico americano · fondeo regional exterior de Puerto Caldera. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "golfito",
    "name": "Golfito",
    "country": "Costa Rica",
    "region": "Pacífico americano",
    "lat": 8.6295322,
    "lon": -83.1749109,
    "heading": 3.9269908169872414,
    "description": "Pacífico americano · fondeo regional exterior de Golfito. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "puerto-armuelles",
    "name": "Puerto Armuelles",
    "country": "Panamá",
    "region": "Pacífico americano",
    "lat": 8.2480751,
    "lon": -82.8431624,
    "heading": 3.141592653589793,
    "description": "Pacífico americano · fondeo regional exterior de Puerto Armuelles. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "buenaventura",
    "name": "Buenaventura",
    "country": "Colombia",
    "region": "Pacífico americano",
    "lat": 3.8864088,
    "lon": -77.0751373,
    "heading": 4.71238898038469,
    "description": "Pacífico americano · fondeo regional exterior de Buenaventura. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "tumaco",
    "name": "Tumaco",
    "country": "Colombia",
    "region": "Pacífico americano",
    "lat": 1.816667,
    "lon": -78.75,
    "heading": 5.235987755982989,
    "description": "Pacífico americano · fondeo regional exterior de Tumaco. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "esmeraldas",
    "name": "Esmeraldas",
    "country": "Ecuador",
    "region": "Pacífico americano",
    "lat": 1,
    "lon": -79.65,
    "heading": 0,
    "description": "Pacífico americano · fondeo regional exterior de Esmeraldas. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "manta",
    "name": "Manta",
    "country": "Ecuador",
    "region": "Pacífico americano",
    "lat": -0.9239397,
    "lon": -80.7236507,
    "heading": 5.235987755982989,
    "description": "Pacífico americano · fondeo regional exterior de Manta. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "cabo-blanco",
    "name": "Cabo Blanco",
    "country": "Perú",
    "region": "Pacífico americano",
    "lat": -4.2404612,
    "lon": -81.2428979,
    "heading": 4.71238898038469,
    "description": "Pacífico americano · fondeo regional exterior de Cabo Blanco. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "salaverry",
    "name": "Salaverry",
    "country": "Perú",
    "region": "Pacífico americano",
    "lat": -8.234682,
    "lon": -78.9856938,
    "heading": 4.1887902047863905,
    "description": "Pacífico americano · fondeo regional exterior de Salaverry. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "chimbote",
    "name": "Chimbote",
    "country": "Perú",
    "region": "Pacífico americano",
    "lat": -9.083333,
    "lon": -78.616667,
    "heading": 3.9269908169872414,
    "description": "Pacífico americano · fondeo regional exterior de Chimbote. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "san-nicolas",
    "name": "San Nicolás",
    "country": "Perú",
    "region": "Pacífico americano",
    "lat": -15.2690766,
    "lon": -75.2531085,
    "heading": 4.71238898038469,
    "description": "Pacífico americano · fondeo regional exterior de San Nicolás. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "matarani",
    "name": "Matarani",
    "country": "Perú",
    "region": "Pacífico americano",
    "lat": -17.0134883,
    "lon": -72.1411014,
    "heading": 4.1887902047863905,
    "description": "Pacífico americano · fondeo regional exterior de Matarani. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "arica",
    "name": "Arica",
    "country": "Chile",
    "region": "Pacífico americano",
    "lat": -18.466667,
    "lon": -70.333333,
    "heading": 4.71238898038469,
    "description": "Pacífico americano · fondeo regional exterior de Arica. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "iquique",
    "name": "Iquique",
    "country": "Chile",
    "region": "Pacífico americano",
    "lat": -20.2,
    "lon": -70.166667,
    "heading": 4.71238898038469,
    "description": "Pacífico americano · fondeo regional exterior de Iquique. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "antofagasta",
    "name": "Antofagasta",
    "country": "Chile",
    "region": "Pacífico americano",
    "lat": -23.6499985,
    "lon": -70.4382661,
    "heading": 4.71238898038469,
    "description": "Pacífico americano · fondeo regional exterior de Antofagasta. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "caldera-chile",
    "name": "Caldera",
    "country": "Chile",
    "region": "Pacífico americano",
    "lat": -27.0404609,
    "lon": -70.8440424,
    "heading": 4.71238898038469,
    "description": "Pacífico americano · fondeo regional exterior de Caldera. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "coquimbo",
    "name": "Coquimbo",
    "country": "Chile",
    "region": "Pacífico americano",
    "lat": -29.9360089,
    "lon": -71.349477,
    "heading": 5.497787143782138,
    "description": "Pacífico americano · fondeo regional exterior de Coquimbo. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "talcahuano",
    "name": "Talcahuano",
    "country": "Chile",
    "region": "Pacífico americano",
    "lat": -36.6907682,
    "lon": -73.0683833,
    "heading": 0,
    "description": "Pacífico americano · fondeo regional exterior de Talcahuano. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "corral",
    "name": "Corral",
    "country": "Chile",
    "region": "Pacífico americano",
    "lat": -39.8471824,
    "lon": -73.4288581,
    "heading": 4.71238898038469,
    "description": "Pacífico americano · fondeo regional exterior de Corral. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "norfolk",
    "name": "Norfolk",
    "country": "EE. UU.",
    "region": "Atlántico americano",
    "lat": 36.8632848,
    "lon": -76.3029278,
    "heading": 1.5707963267948966,
    "description": "Atlántico americano · fondeo regional exterior de Norfolk. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "morehead-city",
    "name": "Morehead City",
    "country": "EE. UU.",
    "region": "Atlántico americano",
    "lat": 34.716667,
    "lon": -76.7,
    "heading": 3.141592653589793,
    "description": "Atlántico americano · fondeo regional exterior de Morehead City. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "charleston",
    "name": "Charleston",
    "country": "EE. UU.",
    "region": "Atlántico americano",
    "lat": 32.783333,
    "lon": -79.916667,
    "heading": 2.356194490192345,
    "description": "Atlántico americano · fondeo regional exterior de Charleston. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "jacksonville",
    "name": "Jacksonville",
    "country": "EE. UU.",
    "region": "Atlántico americano",
    "lat": 30.3161614,
    "lon": -81.2853762,
    "heading": 1.5707963267948966,
    "description": "Atlántico americano · fondeo regional exterior de Jacksonville. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "canaveral",
    "name": "Cabo Cañaveral",
    "country": "EE. UU.",
    "region": "Atlántico americano",
    "lat": 28.7,
    "lon": -80.616667,
    "heading": 1.5707963267948966,
    "description": "Atlántico americano · fondeo regional exterior de Cabo Cañaveral. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "key-west",
    "name": "Cayo Hueso",
    "country": "EE. UU.",
    "region": "Atlántico americano",
    "lat": 24.5490772,
    "lon": -81.8194542,
    "heading": 3.141592653589793,
    "description": "Atlántico americano · fondeo regional exterior de Cayo Hueso. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "matthew-town",
    "name": "Matthew Town",
    "country": "Bahamas",
    "region": "Caribe",
    "lat": 20.95,
    "lon": -73.683333,
    "heading": 4.71238898038469,
    "description": "Caribe · fondeo regional exterior de Matthew Town. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "haina",
    "name": "Haina",
    "country": "Rep. Dominicana",
    "region": "Caribe",
    "lat": 18.4039907,
    "lon": -70.0118045,
    "heading": 3.141592653589793,
    "description": "Caribe · fondeo regional exterior de Haina. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "rocky-point",
    "name": "Rocky Point",
    "country": "Jamaica",
    "region": "Caribe",
    "lat": 17.816667,
    "lon": -77.15,
    "heading": 3.141592653589793,
    "description": "Caribe · fondeo regional exterior de Rocky Point. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "trujillo-honduras",
    "name": "Trujillo",
    "country": "Honduras",
    "region": "Caribe",
    "lat": 15.9352587,
    "lon": -85.9570373,
    "heading": 0,
    "description": "Caribe · fondeo regional exterior de Trujillo. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "st-johns-antigua",
    "name": "Saint John’s",
    "country": "Antigua y Barbuda",
    "region": "Caribe",
    "lat": 17.1166668,
    "lon": -61.85941,
    "heading": 4.71238898038469,
    "description": "Caribe · fondeo regional exterior de Saint John’s. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "fort-de-france",
    "name": "Fort-de-France",
    "country": "Martinica",
    "region": "Caribe",
    "lat": 14.6,
    "lon": -61.066667,
    "heading": 4.1887902047863905,
    "description": "Caribe · fondeo regional exterior de Fort-de-France. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "point-lisas",
    "name": "Point Lisas",
    "country": "Trinidad y Tobago",
    "region": "Caribe",
    "lat": 10.4,
    "lon": -61.5,
    "heading": 4.71238898038469,
    "description": "Caribe · fondeo regional exterior de Point Lisas. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "rio-grande",
    "name": "Rio Grande",
    "country": "Brasil",
    "region": "Atlántico sur",
    "lat": -32.05,
    "lon": -52.083333,
    "heading": 2.356194490192345,
    "description": "Atlántico sur · fondeo regional exterior de Rio Grande. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "itajai",
    "name": "Itajaí",
    "country": "Brasil",
    "region": "Atlántico sur",
    "lat": -26.9166653,
    "lon": -48.6111441,
    "heading": 1.5707963267948966,
    "description": "Atlántico sur · fondeo regional exterior de Itajaí. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "vitoria",
    "name": "Vitória",
    "country": "Brasil",
    "region": "Atlántico sur",
    "lat": -20.2975884,
    "lon": -40.3536735,
    "heading": 2.356194490192345,
    "description": "Atlántico sur · fondeo regional exterior de Vitória. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "ilheus",
    "name": "Ilhéus",
    "country": "Brasil",
    "region": "Atlántico sur",
    "lat": -14.783333,
    "lon": -39.016667,
    "heading": 1.5707963267948966,
    "description": "Atlántico sur · fondeo regional exterior de Ilhéus. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "salvador",
    "name": "Salvador",
    "country": "Brasil",
    "region": "Atlántico sur",
    "lat": -12.966667,
    "lon": -38.516667,
    "heading": 3.9269908169872414,
    "description": "Atlántico sur · fondeo regional exterior de Salvador. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "recife",
    "name": "Recife",
    "country": "Brasil",
    "region": "Atlántico sur",
    "lat": -8.0694845,
    "lon": -34.870137,
    "heading": 1.5707963267948966,
    "description": "Atlántico sur · fondeo regional exterior de Recife. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "natal",
    "name": "Natal",
    "country": "Brasil",
    "region": "Atlántico sur",
    "lat": -5.7833324,
    "lon": -35.1728824,
    "heading": 1.5707963267948966,
    "description": "Atlántico sur · fondeo regional exterior de Natal. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "fortaleza",
    "name": "Fortaleza",
    "country": "Brasil",
    "region": "Atlántico sur",
    "lat": -3.6896874,
    "lon": -38.483333,
    "heading": 0,
    "description": "Atlántico sur · fondeo regional exterior de Fortaleza. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "agadir",
    "name": "Agadir",
    "country": "Marruecos",
    "region": "Atlántico africano",
    "lat": 30.4333329,
    "lon": -9.6395912,
    "heading": 4.71238898038469,
    "description": "Atlántico africano · fondeo regional exterior de Agadir. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "laayoune",
    "name": "El Aaiún",
    "country": "Sáhara Occidental",
    "region": "Atlántico africano",
    "lat": 27.083333,
    "lon": -13.433333,
    "heading": 4.71238898038469,
    "description": "Atlántico africano · fondeo regional exterior de El Aaiún. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "dakhla",
    "name": "Dajla",
    "country": "Sáhara Occidental",
    "region": "Atlántico africano",
    "lat": 23.7,
    "lon": -15.916667,
    "heading": 4.71238898038469,
    "description": "Atlántico africano · fondeo regional exterior de Dajla. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "nouadhibou",
    "name": "Nuadibú",
    "country": "Mauritania",
    "region": "Atlántico africano",
    "lat": 20.9096819,
    "lon": -17.0221025,
    "heading": 4.1887902047863905,
    "description": "Atlántico africano · fondeo regional exterior de Nuadibú. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "nouakchott",
    "name": "Nuakchot",
    "country": "Mauritania",
    "region": "Atlántico africano",
    "lat": 18.0333293,
    "lon": -16.0711642,
    "heading": 4.71238898038469,
    "description": "Atlántico africano · fondeo regional exterior de Nuakchot. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "banjul",
    "name": "Banjul",
    "country": "Gambia",
    "region": "Atlántico africano",
    "lat": 13.45,
    "lon": -16.566667,
    "heading": 4.71238898038469,
    "description": "Atlántico africano · fondeo regional exterior de Banjul. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "conakry",
    "name": "Conakri",
    "country": "Guinea",
    "region": "Atlántico africano",
    "lat": 9.5076738,
    "lon": -13.716667,
    "heading": 3.9269908169872414,
    "description": "Atlántico africano · fondeo regional exterior de Conakri. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "freetown",
    "name": "Freetown",
    "country": "Sierra Leona",
    "region": "Atlántico africano",
    "lat": 8.5,
    "lon": -13.233333,
    "heading": 4.71238898038469,
    "description": "Atlántico africano · fondeo regional exterior de Freetown. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "monrovia",
    "name": "Monrovia",
    "country": "Liberia",
    "region": "Atlántico africano",
    "lat": 6.316667,
    "lon": -10.816667,
    "heading": 3.9269908169872414,
    "description": "Atlántico africano · fondeo regional exterior de Monrovia. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "cape-palmas",
    "name": "Cabo Palmas",
    "country": "Liberia",
    "region": "Atlántico africano",
    "lat": 4.3585164,
    "lon": -7.7204787,
    "heading": 3.9269908169872414,
    "description": "Atlántico africano · fondeo regional exterior de Cabo Palmas. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "sekondi",
    "name": "Sekondi",
    "country": "Ghana",
    "region": "Atlántico africano",
    "lat": 4.95,
    "lon": -1.7,
    "heading": 3.141592653589793,
    "description": "Atlántico africano · fondeo regional exterior de Sekondi. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "lagos",
    "name": "Lagos",
    "country": "Nigeria",
    "region": "Atlántico africano",
    "lat": 6.4,
    "lon": 3.4,
    "heading": 3.141592653589793,
    "description": "Atlántico africano · fondeo regional exterior de Lagos. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "malabo",
    "name": "Malabo",
    "country": "Guinea Ecuatorial",
    "region": "Atlántico africano",
    "lat": 3.7553959,
    "lon": 8.783333,
    "heading": 0,
    "description": "Atlántico africano · fondeo regional exterior de Malabo. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "bata",
    "name": "Bata",
    "country": "Guinea Ecuatorial",
    "region": "Atlántico africano",
    "lat": 1.8666669,
    "lon": 9.75317,
    "heading": 4.71238898038469,
    "description": "Atlántico africano · fondeo regional exterior de Bata. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "port-gentil",
    "name": "Port-Gentil",
    "country": "Gabón",
    "region": "Atlántico africano",
    "lat": -0.7,
    "lon": 8.8,
    "heading": 4.71238898038469,
    "description": "Atlántico africano · fondeo regional exterior de Port-Gentil. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "pointe-noire",
    "name": "Pointe-Noire",
    "country": "Rep. del Congo",
    "region": "Atlántico africano",
    "lat": -4.7932253,
    "lon": 11.8161385,
    "heading": 4.1887902047863905,
    "description": "Atlántico africano · fondeo regional exterior de Pointe-Noire. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "luanda",
    "name": "Luanda",
    "country": "Angola",
    "region": "Atlántico africano",
    "lat": -8.7980922,
    "lon": 13.2480695,
    "heading": 4.71238898038469,
    "description": "Atlántico africano · fondeo regional exterior de Luanda. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "lobito",
    "name": "Lobito",
    "country": "Angola",
    "region": "Atlántico africano",
    "lat": -12.333333,
    "lon": 13.566667,
    "heading": 4.71238898038469,
    "description": "Atlántico africano · fondeo regional exterior de Lobito. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "namibe",
    "name": "Namibe",
    "country": "Angola",
    "region": "Atlántico africano",
    "lat": -15.1745618,
    "lon": 12.1236444,
    "heading": 4.71238898038469,
    "description": "Atlántico africano · fondeo regional exterior de Namibe. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "walvis-bay",
    "name": "Walvis Bay",
    "country": "Namibia",
    "region": "Atlántico africano",
    "lat": -22.9453856,
    "lon": 14.4862346,
    "heading": 4.71238898038469,
    "description": "Atlántico africano · fondeo regional exterior de Walvis Bay. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "luderitz",
    "name": "Lüderitz",
    "country": "Namibia",
    "region": "Atlántico africano",
    "lat": -26.6461844,
    "lon": 15.1457311,
    "heading": 4.71238898038469,
    "description": "Atlántico africano · fondeo regional exterior de Lüderitz. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "saldanha",
    "name": "Saldanha",
    "country": "Sudáfrica",
    "region": "Atlántico africano",
    "lat": -33.033333,
    "lon": 17.966667,
    "heading": 4.1887902047863905,
    "description": "Atlántico africano · fondeo regional exterior de Saldanha. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "sharm-el-sheikh",
    "name": "Sharm el-Sheij",
    "country": "Egipto",
    "region": "Mar Rojo",
    "lat": 27.8436407,
    "lon": 34.2905248,
    "heading": 2.356194490192345,
    "description": "Mar Rojo · fondeo regional exterior de Sharm el-Sheij. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "hurghada",
    "name": "Hurghada",
    "country": "Egipto",
    "region": "Mar Rojo",
    "lat": 27.216667,
    "lon": 33.85,
    "heading": 1.5707963267948966,
    "description": "Mar Rojo · fondeo regional exterior de Hurghada. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "al-qusayr",
    "name": "El Quseir",
    "country": "Egipto",
    "region": "Mar Rojo",
    "lat": 26.0999969,
    "lon": 34.3133762,
    "heading": 1.5707963267948966,
    "description": "Mar Rojo · fondeo regional exterior de El Quseir. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "duba",
    "name": "Duba",
    "country": "Arabia Saudita",
    "region": "Mar Rojo",
    "lat": 27.3164392,
    "lon": 35.6469512,
    "heading": 4.71238898038469,
    "description": "Mar Rojo · fondeo regional exterior de Duba. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "al-mukha",
    "name": "Moca",
    "country": "Yemen",
    "region": "Mar Rojo",
    "lat": 13.316667,
    "lon": 43.2472275,
    "heading": 4.71238898038469,
    "description": "Mar Rojo · fondeo regional exterior de Moca. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "muscat",
    "name": "Mascate",
    "country": "Omán",
    "region": "Mar Arábigo",
    "lat": 23.6473224,
    "lon": 58.5986056,
    "heading": 0.7853981633974483,
    "description": "Mar Arábigo · fondeo regional exterior de Mascate. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "sohar",
    "name": "Sohar",
    "country": "Omán",
    "region": "Mar Arábigo",
    "lat": 24.516667,
    "lon": 56.633333,
    "heading": 0.7853981633974483,
    "description": "Mar Arábigo · fondeo regional exterior de Sohar. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "fujairah",
    "name": "Fuyaira",
    "country": "Emiratos Árabes Unidos",
    "region": "Mar Arábigo",
    "lat": 25.1730526,
    "lon": 56.3989775,
    "heading": 1.5707963267948966,
    "description": "Mar Arábigo · fondeo regional exterior de Fuyaira. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "karachi",
    "name": "Karachi",
    "country": "Pakistán",
    "region": "Mar Arábigo",
    "lat": 24.783333,
    "lon": 66.983333,
    "heading": 3.141592653589793,
    "description": "Mar Arábigo · fondeo regional exterior de Karachi. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "okha",
    "name": "Okha",
    "country": "India",
    "region": "Mar Arábigo",
    "lat": 22.4680556,
    "lon": 69.0797222,
    "heading": 4.71238898038469,
    "description": "Mar Arábigo · fondeo regional exterior de Okha. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "veraval",
    "name": "Veraval",
    "country": "India",
    "region": "Mar Arábigo",
    "lat": 20.9,
    "lon": 70.366667,
    "heading": 3.141592653589793,
    "description": "Mar Arábigo · fondeo regional exterior de Veraval. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "penang",
    "name": "Penang",
    "country": "Malasia",
    "region": "Sudeste asiático",
    "lat": 5.416667,
    "lon": 100.35,
    "heading": 4.71238898038469,
    "description": "Sudeste asiático · fondeo regional exterior de Penang. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "port-klang",
    "name": "Port Klang",
    "country": "Malasia",
    "region": "Sudeste asiático",
    "lat": 2.9999994,
    "lon": 101.3639778,
    "heading": 3.9269908169872414,
    "description": "Sudeste asiático · fondeo regional exterior de Port Klang. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "sabang",
    "name": "Sabang",
    "country": "Indonesia",
    "region": "Sudeste asiático",
    "lat": 5.883333,
    "lon": 95.316667,
    "heading": 0,
    "description": "Sudeste asiático · fondeo regional exterior de Sabang. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "belawan",
    "name": "Belawan",
    "country": "Indonesia",
    "region": "Sudeste asiático",
    "lat": 3.8469222,
    "lon": 98.7470681,
    "heading": 0.7853981633974483,
    "description": "Sudeste asiático · fondeo regional exterior de Belawan. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "phuket",
    "name": "Phuket",
    "country": "Tailandia",
    "region": "Sudeste asiático",
    "lat": 7.8281746,
    "lon": 98.4074361,
    "heading": 3.9269908169872414,
    "description": "Sudeste asiático · fondeo regional exterior de Phuket. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "salina-cruz",
    "name": "Salina Cruz",
    "country": "México",
    "region": "Pacífico americano",
    "lat": 16.145215,
    "lon": -95.193,
    "heading": 3.141592653589793,
    "description": "Pacífico americano · fondeo regional exterior de Salina Cruz. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "puerto-quetzal",
    "name": "Puerto Quetzal",
    "country": "Guatemala",
    "region": "Pacífico americano",
    "lat": 13.9094068,
    "lon": -90.7842,
    "heading": 3.141592653589793,
    "description": "Pacífico americano · fondeo regional exterior de Puerto Quetzal. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "corinto",
    "name": "Corinto",
    "country": "Nicaragua",
    "region": "Pacífico americano",
    "lat": 12.4833,
    "lon": -87.1667,
    "heading": 3.9269908169872414,
    "description": "Pacífico americano · fondeo regional exterior de Corinto. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "belize-city",
    "name": "Ciudad de Belice",
    "country": "Belice",
    "region": "Caribe",
    "lat": 17.475,
    "lon": -88.195,
    "heading": 1.5707963267948966,
    "description": "Caribe · fondeo regional exterior de Ciudad de Belice. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "puerto-limon",
    "name": "Puerto Limón",
    "country": "Costa Rica",
    "region": "Caribe",
    "lat": 9.99,
    "lon": -83.025,
    "heading": 1.5707963267948966,
    "description": "Caribe · fondeo regional exterior de Puerto Limón. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "yanbu",
    "name": "Yanbu",
    "country": "Arabia Saudita",
    "region": "Mar Rojo",
    "lat": 24.0620856,
    "lon": 38.0361174,
    "heading": 4.71238898038469,
    "description": "Mar Rojo · fondeo regional exterior de Yanbu. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "jazan",
    "name": "Jazán",
    "country": "Arabia Saudita",
    "region": "Mar Rojo",
    "lat": 17.2832995,
    "lon": 42.3191723,
    "heading": 4.71238898038469,
    "description": "Mar Rojo · fondeo regional exterior de Jazán. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "aden",
    "name": "Adén",
    "country": "Yemen",
    "region": "Mar Arábigo",
    "lat": 12.7613041,
    "lon": 45.0333,
    "heading": 3.141592653589793,
    "description": "Mar Arábigo · fondeo regional exterior de Adén. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "mukalla",
    "name": "Mukalla",
    "country": "Yemen",
    "region": "Mar Arábigo",
    "lat": 14.5113041,
    "lon": 49.1167,
    "heading": 3.141592653589793,
    "description": "Mar Arábigo · fondeo regional exterior de Mukalla. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "salalah",
    "name": "Salalah",
    "country": "Omán",
    "region": "Mar Arábigo",
    "lat": 16.940461,
    "lon": 54.0266714,
    "heading": 2.356194490192345,
    "description": "Mar Arábigo · fondeo regional exterior de Salalah. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "duqm",
    "name": "Duqm",
    "country": "Omán",
    "region": "Mar Arábigo",
    "lat": 19.6499994,
    "lon": 57.714324,
    "heading": 1.5707963267948966,
    "description": "Mar Arábigo · fondeo regional exterior de Duqm. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "gwadar",
    "name": "Gwadar",
    "country": "Pakistán",
    "region": "Mar Arábigo",
    "lat": 25.0807272,
    "lon": 62.3333,
    "heading": 3.141592653589793,
    "description": "Mar Arábigo · fondeo regional exterior de Gwadar. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "mormugao",
    "name": "Mormugao · Goa",
    "country": "India",
    "region": "Mar Arábigo",
    "lat": 15.4167,
    "lon": 73.7833,
    "heading": 4.71238898038469,
    "description": "Mar Arábigo · fondeo regional exterior de Mormugao · Goa. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "new-mangalore",
    "name": "New Mangalore",
    "country": "India",
    "region": "Mar Arábigo",
    "lat": 12.9332985,
    "lon": 74.7890181,
    "heading": 4.71238898038469,
    "description": "Mar Arábigo · fondeo regional exterior de New Mangalore. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "kochi",
    "name": "Kochi",
    "country": "India",
    "region": "Mar Arábigo",
    "lat": 9.97,
    "lon": 76.2583,
    "heading": 4.71238898038469,
    "description": "Mar Arábigo · fondeo regional exterior de Kochi. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "puerto-montt",
    "name": "Puerto Montt",
    "country": "Chile",
    "region": "Patagonia y Tierra del Fuego",
    "lat": -41.4960094,
    "lon": -72.9605068,
    "heading": 3.141592653589793,
    "description": "Patagonia y Tierra del Fuego · fondeo regional exterior de Puerto Montt. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "puerto-chacabuco",
    "name": "Puerto Chacabuco",
    "country": "Chile",
    "region": "Patagonia y Tierra del Fuego",
    "lat": -45.447586,
    "lon": -72.8605262,
    "heading": 4.71238898038469,
    "description": "Patagonia y Tierra del Fuego · fondeo regional exterior de Puerto Chacabuco. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "puerto-natales",
    "name": "Puerto Natales",
    "country": "Chile",
    "region": "Patagonia y Tierra del Fuego",
    "lat": -51.7166667,
    "lon": -72.5666667,
    "heading": 4.71238898038469,
    "description": "Patagonia y Tierra del Fuego · fondeo regional exterior de Puerto Natales. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "punta-arenas",
    "name": "Punta Arenas",
    "country": "Chile",
    "region": "Patagonia y Tierra del Fuego",
    "lat": -53.1666658,
    "lon": -70.8849986,
    "heading": 1.5707963267948966,
    "description": "Patagonia y Tierra del Fuego · fondeo regional exterior de Punta Arenas. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "ushuaia",
    "name": "Ushuaia",
    "country": "Argentina",
    "region": "Patagonia y Tierra del Fuego",
    "lat": -54.8166667,
    "lon": -68.3,
    "heading": 3.141592653589793,
    "description": "Patagonia y Tierra del Fuego · fondeo regional exterior de Ushuaia. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "puerto-williams",
    "name": "Puerto Williams",
    "country": "Chile",
    "region": "Patagonia y Tierra del Fuego",
    "lat": -54.9243401,
    "lon": -67.6,
    "heading": 0,
    "description": "Patagonia y Tierra del Fuego · fondeo regional exterior de Puerto Williams. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "cape-horn",
    "name": "Cabo de Hornos",
    "country": "Chile",
    "region": "Paso Drake",
    "lat": -55.943,
    "lon": -67.2093333,
    "heading": 1.5707963267948966,
    "description": "Paso Drake · fondeo exterior de juego junto al Cabo de Hornos. Muelle y combustible ficticios; no es un puerto comercial real."
  },
  {
    "id": "fildes-bay",
    "name": "Bahía Fildes · Isla Rey Jorge",
    "country": "Antártida",
    "region": "Península Antártica",
    "lat": -62.2158333,
    "lon": -58.9597222,
    "heading": 2.356194490192345,
    "description": "Bahía Fildes, isla Rey Jorge · base antártica costera simplificada. Desembarco y repostaje de juego; no representan servicios públicos reales ni navegación entre hielos."
  },
  {
    "id": "deception-island",
    "name": "Isla Decepción · Whalers Bay",
    "country": "Antártida",
    "region": "Península Antártica",
    "lat": -62.9833333,
    "lon": -60.5666667,
    "heading": 2.356194490192345,
    "description": "Isla Decepción · fondeo antártico regional junto a Whalers Bay. Desembarco y combustible ficticios; costa volcánica y acceso simplificados."
  },
  {
    "id": "port-lockroy",
    "name": "Port Lockroy",
    "country": "Antártida",
    "region": "Península Antártica",
    "lat": -64.8166667,
    "lon": -63.5,
    "heading": 5.235987755982989,
    "description": "Port Lockroy · base histórica antártica representada de forma regional. Muelle y combustible ficticios; no es un puerto comercial ni una estación pública de repostaje."
  },
  {
    "id": "bahia-blanca",
    "name": "Bahía Blanca",
    "country": "Argentina",
    "region": "Patagonia atlántica",
    "lat": -38.8159341,
    "lon": -62.2471551,
    "heading": 2.356194490192345,
    "description": "Patagonia atlántica · fondeo regional exterior de Bahía Blanca. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "puerto-madryn",
    "name": "Puerto Madryn",
    "country": "Argentina",
    "region": "Patagonia atlántica",
    "lat": -42.766647,
    "lon": -64.965957,
    "heading": 1.5707963267948966,
    "description": "Patagonia atlántica · fondeo regional exterior de Puerto Madryn. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "puerto-deseado",
    "name": "Puerto Deseado",
    "country": "Argentina",
    "region": "Patagonia atlántica",
    "lat": -47.75,
    "lon": -65.9,
    "heading": 1.5707963267948966,
    "description": "Patagonia atlántica · fondeo regional exterior de Puerto Deseado. Muelle y repostaje ficticios; costa simplificada."
  },
  {
    "id": "rio-gallegos",
    "name": "Río Gallegos",
    "country": "Argentina",
    "region": "Patagonia atlántica",
    "lat": -51.6166666,
    "lon": -68.9623216,
    "heading": 1.5707963267948966,
    "description": "Patagonia atlántica · fondeo regional exterior de Río Gallegos. Muelle y repostaje ficticios; costa simplificada."
  }
];
