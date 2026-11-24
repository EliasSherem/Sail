import type { LatLon } from "../types";

// Generated offline against the exact land/canal/dock collision geometry.
// Regional corridors use >=100 m swept clearance; port approach legs use >=95 m.
// These conservative fictional routes do not model ice, traffic separation or local restrictions.
export const EXPANDED_WAYPOINTS: Array<LatLon & { id:string; approach?:boolean }> = [
  {
    "id": "norway-lindesnes",
    "lat": 57.7,
    "lon": 7,
    "approach": true
  },
  {
    "id": "oslo-mouth",
    "lat": 58.9,
    "lon": 10.6,
    "approach": true
  },
  {
    "id": "atl-cape-sable",
    "lat": 43.1,
    "lon": -65.6,
    "approach": true
  },
  {
    "id": "atl-cape-cod",
    "lat": 41.55,
    "lon": -69.7,
    "approach": true
  },
  {
    "id": "atl-hatteras",
    "lat": 34.9,
    "lon": -75.15,
    "approach": true
  },
  {
    "id": "atl-florida",
    "lat": 27.1,
    "lon": -79.6,
    "approach": true
  },
  {
    "id": "africa-liberia",
    "lat": 2,
    "lon": -14,
    "approach": true
  },
  {
    "id": "africa-angola",
    "lat": -18,
    "lon": 8,
    "approach": true
  },
  {
    "id": "pac-mex-south",
    "lat": 14,
    "lon": -97,
    "approach": true
  },
  {
    "id": "pac-guatemala",
    "lat": 12,
    "lon": -90,
    "approach": true
  },
  {
    "id": "pac-chile-south",
    "lat": -48,
    "lon": -78,
    "approach": true
  },
  {
    "id": "pac-cape-horn-west",
    "lat": -56.5,
    "lon": -73,
    "approach": true
  },
  {
    "id": "pac-cape-horn-east",
    "lat": -56.7,
    "lon": -64,
    "approach": true
  },
  {
    "id": "atl-patagonia",
    "lat": -44,
    "lon": -60,
    "approach": true
  },
  {
    "id": "med-sardinia-east",
    "lat": 39.3,
    "lon": 10.1,
    "approach": true
  },
  {
    "id": "med-sicily-south",
    "lat": 35.3,
    "lon": 14.5,
    "approach": true
  },
  {
    "id": "med-matapan",
    "lat": 35.7,
    "lon": 22.2,
    "approach": true
  },
  {
    "id": "med-peloponnese-east",
    "lat": 36.25,
    "lon": 23.65,
    "approach": true
  },
  {
    "id": "red-bab-south",
    "lat": 12.25,
    "lon": 43.75,
    "approach": true
  },
  {
    "id": "red-aden",
    "lat": 12.1,
    "lon": 45,
    "approach": true
  },
  {
    "id": "arab-socotra",
    "lat": 13,
    "lon": 55,
    "approach": true
  },
  {
    "id": "arab-oman",
    "lat": 24.7,
    "lon": 58.7,
    "approach": true
  },
  {
    "id": "arab-hormuz-east",
    "lat": 25.6,
    "lon": 57,
    "approach": true
  },
  {
    "id": "arab-hormuz-north",
    "lat": 26.6,
    "lon": 56.2,
    "approach": true
  },
  {
    "id": "india-west",
    "lat": 13,
    "lon": 72,
    "approach": true
  },
  {
    "id": "india-south",
    "lat": 6.6,
    "lon": 76.5,
    "approach": true
  },
  {
    "id": "sri-lanka-south",
    "lat": 5.6,
    "lon": 80.5,
    "approach": true
  },
  {
    "id": "malacca-west",
    "lat": 5.7,
    "lon": 94,
    "approach": true
  },
  {
    "id": "malacca-central",
    "lat": 3.4,
    "lon": 100.1,
    "approach": true
  },
  {
    "id": "china-sea-south",
    "lat": 8,
    "lon": 109,
    "approach": true
  },
  {
    "id": "taiwan-west",
    "lat": 25,
    "lon": 119.4,
    "approach": true
  },
  {
    "id": "jeju-south",
    "lat": 32.4,
    "lon": 127.2,
    "approach": true
  },
  {
    "id": "kyushu-west",
    "lat": 32.1,
    "lon": 128.3,
    "approach": true
  },
  {
    "id": "kyushu-south",
    "lat": 30.1,
    "lon": 131.5,
    "approach": true
  },
  {
    "id": "japan-south",
    "lat": 31.3,
    "lon": 136,
    "approach": true
  },
  {
    "id": "sunda-west",
    "lat": -6,
    "lon": 103.5,
    "approach": true
  },
  {
    "id": "sunda-south",
    "lat": -10,
    "lon": 107,
    "approach": true
  },
  {
    "id": "australia-southwest",
    "lat": -35.5,
    "lon": 114,
    "approach": true
  },
  {
    "id": "australia-bight",
    "lat": -38,
    "lon": 134,
    "approach": true
  },
  {
    "id": "bass-west",
    "lat": -39.5,
    "lon": 143.7,
    "approach": true
  },
  {
    "id": "bass-east",
    "lat": -39.5,
    "lon": 149,
    "approach": true
  },
  {
    "id": "nz-north",
    "lat": -34,
    "lon": 173,
    "approach": true
  },
  {
    "id": "offshore-genoa",
    "lat": 44.34352378726964,
    "lon": 8.930000000000064,
    "approach": true
  },
  {
    "id": "offshore-new-york",
    "lat": 40.423523787269644,
    "lon": -73.86500000000001,
    "approach": true
  },
  {
    "id": "offshore-cape-town",
    "lat": -33.82652378726964,
    "lon": 18.401000000000067,
    "approach": true
  },
  {
    "id": "offshore-sydney",
    "lat": -33.862476212730364,
    "lon": 151.322,
    "approach": true
  },
  {
    "id": "offshore-yokohama",
    "lat": 35.37452378726965,
    "lon": 139.75299999999993,
    "approach": true
  },
  {
    "id": "offshore-cadiz",
    "lat": 36.529993595331476,
    "lon": -6.359171669495254,
    "approach": true
  },
  {
    "id": "offshore-lisbon",
    "lat": 38.64425670776751,
    "lon": -9.344901231852873,
    "approach": true
  },
  {
    "id": "offshore-porto",
    "lat": 41.15999244170599,
    "lon": -8.751808039813568,
    "approach": true
  },
  {
    "id": "offshore-vigo",
    "lat": 42.20425601182286,
    "lon": -8.81679922708588,
    "approach": true
  },
  {
    "id": "offshore-a-coruna",
    "lat": 43.421476212730354,
    "lon": -8.370000000000005,
    "approach": true
  },
  {
    "id": "offshore-brest",
    "lat": 48.33425460568564,
    "lon": -4.651004607187474,
    "approach": true
  },
  {
    "id": "offshore-cork",
    "lat": 51.748523787269654,
    "lon": -8.240000000000009,
    "approach": true
  },
  {
    "id": "offshore-falmouth",
    "lat": 50.088523787269644,
    "lon": -5.039999999999964,
    "approach": true
  },
  {
    "id": "offshore-killybegs",
    "lat": 54.570420613219596,
    "lon": -8.468570748568936,
    "approach": true
  },
  {
    "id": "offshore-stornoway",
    "lat": 58.138523787269655,
    "lon": -6.350000000000023,
    "approach": true
  },
  {
    "id": "offshore-torshavn",
    "lat": 61.958989592100544,
    "lon": -6.694177574939772,
    "approach": true
  },
  {
    "id": "offshore-hofn",
    "lat": 64.18852378726965,
    "lon": -15.200000000000045,
    "approach": true
  },
  {
    "id": "offshore-vestmannaeyjar",
    "lat": 63.39900146097639,
    "lon": -20.262206556337446,
    "approach": true
  },
  {
    "id": "offshore-reykjavik",
    "lat": 64.16998213888893,
    "lon": -22.06224242035364,
    "approach": true
  },
  {
    "id": "offshore-isafjordur",
    "lat": 66.13147621273035,
    "lon": -23.079999999999927,
    "approach": true
  },
  {
    "id": "offshore-tasiilaq",
    "lat": 65.53852378726963,
    "lon": -37.620000000000005,
    "approach": true
  },
  {
    "id": "offshore-prins-christian-sund",
    "lat": 60.01900152966978,
    "lon": -43.11093785695937,
    "approach": true
  },
  {
    "id": "offshore-nanortalik",
    "lat": 60.08852378726965,
    "lon": -45.25999999999999,
    "approach": true
  },
  {
    "id": "offshore-qaqortoq",
    "lat": 60.7092661395317,
    "lon": -46.10115686092274,
    "approach": true
  },
  {
    "id": "offshore-paamiut",
    "lat": 61.96998375987228,
    "lon": -49.76698007458975,
    "approach": true
  },
  {
    "id": "offshore-nuuk",
    "lat": 64.14998215477534,
    "lon": -51.83219036735426,
    "approach": true
  },
  {
    "id": "offshore-sisimiut",
    "lat": 66.92997910043634,
    "lon": -53.794096235704615,
    "approach": true
  },
  {
    "id": "offshore-qikiqtarjuaq",
    "lat": 67.58053418651313,
    "lon": -64.05930953535625,
    "approach": true
  },
  {
    "id": "offshore-pangnirtung",
    "lat": 66.11291625052405,
    "lon": -65.85285290340948,
    "approach": true
  },
  {
    "id": "offshore-iqaluit",
    "lat": 63.688643430919775,
    "lon": -68.53618914728497,
    "approach": true
  },
  {
    "id": "offshore-saglek",
    "lat": 58.511920292792404,
    "lon": -62.625614917532516,
    "approach": true
  },
  {
    "id": "offshore-nain",
    "lat": 56.56099762362843,
    "lon": -61.67991887767721,
    "approach": true
  },
  {
    "id": "offshore-cartwright",
    "lat": 53.684099110589415,
    "lon": -57.05684380275011,
    "approach": true
  },
  {
    "id": "offshore-st-johns",
    "lat": 47.59099773300581,
    "lon": -52.668104444785456,
    "approach": true
  },
  {
    "id": "offshore-halifax",
    "lat": 44.578523787269646,
    "lon": -63.55000000000001,
    "approach": true
  },
  {
    "id": "offshore-boston",
    "lat": 42.3548131807449,
    "lon": -70.90223572418478,
    "approach": true
  },
  {
    "id": "offshore-funchal",
    "lat": 32.588523787269644,
    "lon": -16.920000000000073,
    "approach": true
  },
  {
    "id": "offshore-las-palmas",
    "lat": 28.160997878864876,
    "lon": -15.403140373568021,
    "approach": true
  },
  {
    "id": "offshore-ponta-delgada",
    "lat": 37.688523787269645,
    "lon": -25.670000000000073,
    "approach": true
  },
  {
    "id": "offshore-horta",
    "lat": 38.489001774279615,
    "lon": -28.61698299952377,
    "approach": true
  },
  {
    "id": "offshore-bermuda",
    "lat": 32.225847387269646,
    "lon": -64.79454420000002,
    "approach": true
  },
  {
    "id": "offshore-miami",
    "lat": 25.729001855941263,
    "lon": -80.10606731623938,
    "approach": true
  },
  {
    "id": "offshore-nassau",
    "lat": 25.131476212730362,
    "lon": -77.32999999999998,
    "approach": true
  },
  {
    "id": "offshore-havana",
    "lat": 23.191476212730358,
    "lon": -82.36000000000001,
    "approach": true
  },
  {
    "id": "offshore-cancun",
    "lat": 21.109772180924093,
    "lon": -86.74867696974559,
    "approach": true
  },
  {
    "id": "offshore-veracruz",
    "lat": 19.231476212730357,
    "lon": -96.10000000000002,
    "approach": true
  },
  {
    "id": "offshore-san-juan",
    "lat": 18.501476212730356,
    "lon": -66.12,
    "approach": true
  },
  {
    "id": "offshore-cartagena-colombia",
    "lat": 10.317463126043481,
    "lon": -75.61293143235531,
    "approach": true
  },
  {
    "id": "offshore-colon",
    "lat": 9.42147621273036,
    "lon": -79.92500000000001,
    "approach": true
  },
  {
    "id": "offshore-balboa",
    "lat": 8.88852378726964,
    "lon": -79.52999999999997,
    "approach": true
  },
  {
    "id": "offshore-acapulco",
    "lat": 16.798523787269644,
    "lon": -99.92000000000002,
    "approach": true
  },
  {
    "id": "offshore-los-cabos",
    "lat": 22.83852378726964,
    "lon": -109.89999999999998,
    "approach": true
  },
  {
    "id": "offshore-manzanillo",
    "lat": 19.00086568726964,
    "lon": -104.3340531,
    "approach": true
  },
  {
    "id": "offshore-san-diego",
    "lat": 32.62852378726964,
    "lon": -117.20000000000005,
    "approach": true
  },
  {
    "id": "offshore-los-angeles",
    "lat": 33.65852378726964,
    "lon": -118.25,
    "approach": true
  },
  {
    "id": "offshore-san-francisco",
    "lat": 37.789993295937045,
    "lon": -122.55983009673986,
    "approach": true
  },
  {
    "id": "offshore-seattle",
    "lat": 47.58999053480465,
    "lon": -122.43667074423286,
    "approach": true
  },
  {
    "id": "offshore-vancouver",
    "lat": 49.258144163003436,
    "lon": -123.28599727028222,
    "approach": true
  },
  {
    "id": "offshore-callao",
    "lat": -12.059997952783208,
    "lon": -77.21138279189404,
    "approach": true
  },
  {
    "id": "offshore-valparaiso",
    "lat": -32.978523787269644,
    "lon": -71.63,
    "approach": true
  },
  {
    "id": "offshore-rio-de-janeiro",
    "lat": -23.011476212730358,
    "lon": -43.14999999999998,
    "approach": true
  },
  {
    "id": "offshore-santos",
    "lat": -24.051476212730357,
    "lon": -46.30000000000001,
    "approach": true
  },
  {
    "id": "offshore-buenos-aires",
    "lat": -34.64099783830115,
    "lon": -58.32664347694708,
    "approach": true
  },
  {
    "id": "offshore-montevideo",
    "lat": -34.96147621273035,
    "lon": -56.22000000000003,
    "approach": true
  },
  {
    "id": "offshore-dakar",
    "lat": 14.63598848726964,
    "lon": -17.429046200000016,
    "approach": true
  },
  {
    "id": "offshore-casablanca",
    "lat": 33.65147621273035,
    "lon": -7.600000000000023,
    "approach": true
  },
  {
    "id": "offshore-rotterdam",
    "lat": 51.98998893768083,
    "lon": 3.9488855818890443,
    "approach": true
  },
  {
    "id": "offshore-hamburg",
    "lat": 53.959988117337815,
    "lon": 8.596500872617753,
    "approach": true
  },
  {
    "id": "offshore-bergen",
    "lat": 60.39459608372606,
    "lon": 5.200626839133065,
    "approach": true
  },
  {
    "id": "offshore-oslo",
    "lat": 59.85852378726964,
    "lon": 10.720000000000027,
    "approach": true
  },
  {
    "id": "offshore-piraeus",
    "lat": 37.88852378726964,
    "lon": 23.610000000000014,
    "approach": true
  },
  {
    "id": "offshore-istanbul",
    "lat": 40.92852378726965,
    "lon": 28.980000000000018,
    "approach": true
  },
  {
    "id": "offshore-port-said",
    "lat": 31.331476212730358,
    "lon": 32.34000000000003,
    "approach": true
  },
  {
    "id": "offshore-haifa",
    "lat": 32.88415241273035,
    "lon": 34.994507800000065,
    "approach": true
  },
  {
    "id": "offshore-ashdod",
    "lat": 31.83999463092909,
    "lon": 34.59294844026999,
    "approach": true
  },
  {
    "id": "offshore-suez",
    "lat": 29.878523787269646,
    "lon": 32.569999999999936,
    "approach": true
  },
  {
    "id": "offshore-eilat",
    "lat": 29.498523787269644,
    "lon": 34.960000000000036,
    "approach": true
  },
  {
    "id": "offshore-jeddah",
    "lat": 21.469996599501382,
    "lon": 39.09617677161975,
    "approach": true
  },
  {
    "id": "offshore-dubai",
    "lat": 25.27999591677388,
    "lon": 55.22519010221936,
    "approach": true
  },
  {
    "id": "offshore-mumbai",
    "lat": 18.85852378726964,
    "lon": 72.81999999999994,
    "approach": true
  },
  {
    "id": "offshore-colombo",
    "lat": 6.9699989430068,
    "lon": 79.78828944077372,
    "approach": true
  },
  {
    "id": "offshore-singapore",
    "lat": 1.198523787269641,
    "lon": 103.79999999999995,
    "approach": true
  },
  {
    "id": "offshore-hong-kong",
    "lat": 22.231471560188208,
    "lon": 114.12139952742814,
    "approach": true
  },
  {
    "id": "offshore-shanghai",
    "lat": 30.55216438726963,
    "lon": 122.08738670000002,
    "approach": true
  },
  {
    "id": "offshore-busan",
    "lat": 35.01852378726963,
    "lon": 129.05999999999995,
    "approach": true
  },
  {
    "id": "offshore-auckland",
    "lat": -36.82190122685201,
    "lon": 174.76306262318246,
    "approach": true
  },
  {
    "id": "offshore-brisbane",
    "lat": -27.37099788345604,
    "lon": 153.19384516897287,
    "approach": true
  },
  {
    "id": "offshore-fremantle",
    "lat": -32.049994586919375,
    "lon": 115.69286366656058,
    "approach": true
  },
  {
    "id": "offshore-st-anthony",
    "lat": 51.32899965582033,
    "lon": -55.54714379215204,
    "approach": true
  },
  {
    "id": "offshore-saint-pierre",
    "lat": 46.72852378726964,
    "lon": -56.129999999999995,
    "approach": true
  },
  {
    "id": "offshore-la-spezia",
    "lat": 44.084711557453936,
    "lon": 9.83333330000005,
    "approach": true
  },
  {
    "id": "offshore-livorno",
    "lat": 43.541991783254595,
    "lon": 10.246576727066213,
    "approach": true
  },
  {
    "id": "offshore-piombino",
    "lat": 42.897509902713786,
    "lon": 10.557992206646531,
    "approach": true
  },
  {
    "id": "offshore-civitavecchia",
    "lat": 42.096526636767024,
    "lon": 11.729224621321578,
    "approach": true
  },
  {
    "id": "offshore-anzio",
    "lat": 41.41992354152857,
    "lon": 12.6022293354481,
    "approach": true
  },
  {
    "id": "offshore-gaeta",
    "lat": 41.188512972468246,
    "lon": 13.55500257913684,
    "approach": true
  },
  {
    "id": "offshore-naples",
    "lat": 40.796127887269634,
    "lon": 14.274999999999977,
    "approach": true
  },
  {
    "id": "offshore-salerno",
    "lat": 40.62170068726963,
    "lon": 14.75,
    "approach": true
  },
  {
    "id": "offshore-vibo-valentia",
    "lat": 38.75101664855685,
    "lon": 16.093317732360788,
    "approach": true
  },
  {
    "id": "offshore-palermo",
    "lat": 38.15683511273037,
    "lon": 13.388083700000038,
    "approach": true
  },
  {
    "id": "offshore-messina",
    "lat": 38.16223247669558,
    "lon": 15.583371010920814,
    "approach": true
  },
  {
    "id": "offshore-catania",
    "lat": 37.46900128175012,
    "lon": 15.104449084567705,
    "approach": true
  },
  {
    "id": "offshore-crotone",
    "lat": 39.11535670643944,
    "lon": 17.137147846906487,
    "approach": true
  },
  {
    "id": "offshore-taranto",
    "lat": 40.44440597049492,
    "lon": 17.170754274238107,
    "approach": true
  },
  {
    "id": "offshore-brindisi",
    "lat": 40.69546491273036,
    "lon": 18.001776699999937,
    "approach": true
  },
  {
    "id": "offshore-corfu",
    "lat": 39.64766440238518,
    "lon": 19.929737116226306,
    "approach": true
  },
  {
    "id": "offshore-argostoli",
    "lat": 38.14122521595525,
    "lon": 20.451317946526842,
    "approach": true
  },
  {
    "id": "offshore-katakolon",
    "lat": 37.6346137135007,
    "lon": 21.26330775359861,
    "approach": true
  },
  {
    "id": "offshore-kalamata",
    "lat": 36.97619728726965,
    "lon": 22.116666699999996,
    "approach": true
  },
  {
    "id": "offshore-kissamos",
    "lat": 35.56163271273036,
    "lon": 23.633333300000004,
    "approach": true
  },
  {
    "id": "offshore-heraklion",
    "lat": 35.38147621273036,
    "lon": 25.149999999999977,
    "approach": true
  },
  {
    "id": "offshore-sitia",
    "lat": 35.24814291273035,
    "lon": 26.133333300000004,
    "approach": true
  },
  {
    "id": "offshore-rhodes",
    "lat": 36.48099782564708,
    "lon": 28.22653551513895,
    "approach": true
  },
  {
    "id": "offshore-fethiye",
    "lat": 36.618441866340426,
    "lon": 29.043195181083775,
    "approach": true
  },
  {
    "id": "offshore-antalya",
    "lat": 36.78918068726964,
    "lon": 30.622430200000053,
    "approach": true
  },
  {
    "id": "offshore-alanya",
    "lat": 36.50185708726964,
    "lon": 32,
    "approach": true
  },
  {
    "id": "offshore-limassol",
    "lat": 34.62251408726963,
    "lon": 33.05560880000007,
    "approach": true
  },
  {
    "id": "offshore-larnaca",
    "lat": 34.87663851796189,
    "lon": 33.665945057114186,
    "approach": true
  },
  {
    "id": "offshore-progreso",
    "lat": 21.341789112730353,
    "lon": -89.66666670000001,
    "approach": true
  },
  {
    "id": "offshore-lazaro-cardenas",
    "lat": 17.88207208726964,
    "lon": -102.16666670000001,
    "approach": true
  },
  {
    "id": "offshore-puerto-vallarta",
    "lat": 20.615740647492498,
    "lon": -105.30300516776254,
    "approach": true
  },
  {
    "id": "offshore-mazatlan",
    "lat": 23.158662306275733,
    "lon": -106.46162731731414,
    "approach": true
  },
  {
    "id": "offshore-la-paz",
    "lat": 24.200335440514177,
    "lon": -110.34439087897107,
    "approach": true
  },
  {
    "id": "offshore-ensenada",
    "lat": 31.830415771878986,
    "lon": -116.67600048887078,
    "approach": true
  },
  {
    "id": "offshore-rio-lagartos",
    "lat": 21.644427112730362,
    "lon": -88.1606615,
    "approach": true
  },
  {
    "id": "offshore-celestun",
    "lat": 20.8479541074312,
    "lon": -90.46182969665557,
    "approach": true
  },
  {
    "id": "offshore-campeche",
    "lat": 19.835631581193848,
    "lon": -90.63501538520097,
    "approach": true
  },
  {
    "id": "offshore-champoton",
    "lat": 19.35802946239975,
    "lon": -90.7834860280941,
    "approach": true
  },
  {
    "id": "offshore-ciudad-carmen",
    "lat": 18.64166408331778,
    "lon": -91.87488600761543,
    "approach": true
  },
  {
    "id": "offshore-dos-bocas",
    "lat": 18.48290191273036,
    "lon": -93.1927776,
    "approach": true
  },
  {
    "id": "offshore-coatzacoalcos",
    "lat": 18.19587881273036,
    "lon": -94.41677820000001,
    "approach": true
  },
  {
    "id": "offshore-alvarado",
    "lat": 18.79880501273036,
    "lon": -95.76595380000003,
    "approach": true
  },
  {
    "id": "offshore-zihuatanejo",
    "lat": 17.595139187269638,
    "lon": -101.56200639999997,
    "approach": true
  },
  {
    "id": "offshore-san-carlos",
    "lat": 24.772869999932784,
    "lon": -112.14779973890336,
    "approach": true
  },
  {
    "id": "offshore-bahia-tortugas",
    "lat": 27.65185708726964,
    "lon": -114.8833333,
    "approach": true
  },
  {
    "id": "offshore-san-quintin",
    "lat": 30.4668311650614,
    "lon": -115.98060301245448,
    "approach": true
  },
  {
    "id": "offshore-gijon",
    "lat": 43.60126121273035,
    "lon": -5.666666699999951,
    "approach": true
  },
  {
    "id": "offshore-santander",
    "lat": 43.444405561030955,
    "lon": -3.813988613502829,
    "approach": true
  },
  {
    "id": "offshore-la-rochelle",
    "lat": 46.13983408680254,
    "lon": -1.2330860972915616,
    "approach": true
  },
  {
    "id": "offshore-newlyn",
    "lat": 50.06666517013993,
    "lon": -5.539382032288017,
    "approach": true
  },
  {
    "id": "offshore-galway",
    "lat": 53.239404606011185,
    "lon": -9.076297113470218,
    "approach": true
  },
  {
    "id": "offshore-oban",
    "lat": 56.43203229485875,
    "lon": -5.543079556491193,
    "approach": true
  },
  {
    "id": "offshore-scrabster",
    "lat": 58.647664290519614,
    "lon": -3.5394949198348513,
    "approach": true
  },
  {
    "id": "offshore-stromness",
    "lat": 58.92251388726963,
    "lon": -3.3089462000000367,
    "approach": true
  },
  {
    "id": "offshore-lerwick",
    "lat": 60.21826121273037,
    "lon": -1.1499999999999773,
    "approach": true
  },
  {
    "id": "offshore-sorvagur",
    "lat": 62.07099479062129,
    "lon": -7.389374119981426,
    "approach": true
  },
  {
    "id": "offshore-budir",
    "lat": 64.92291471812858,
    "lon": -13.988553985163549,
    "approach": true
  },
  {
    "id": "offshore-seydisfjordur",
    "lat": 65.29703270545588,
    "lon": -13.888838599999985,
    "approach": true
  },
  {
    "id": "offshore-qutdleq",
    "lat": 61.485190487269634,
    "lon": -42.21666670000002,
    "approach": true
  },
  {
    "id": "offshore-north-sydney",
    "lat": 46.17730390992636,
    "lon": -60.21619545815224,
    "approach": true
  },
  {
    "id": "offshore-port-hawkesbury",
    "lat": 45.62488020850778,
    "lon": -61.382220389258805,
    "approach": true
  },
  {
    "id": "offshore-portland-maine",
    "lat": 43.64494949895207,
    "lon": -70.24195856193899,
    "approach": true
  },
  {
    "id": "offshore-newport-rhode-island",
    "lat": 41.47681633388823,
    "lon": -71.36642510329409,
    "approach": true
  },
  {
    "id": "offshore-portimao",
    "lat": 37.077825787269646,
    "lon": -8.533000000000015,
    "approach": true
  },
  {
    "id": "offshore-bayonne",
    "lat": 43.550080843251465,
    "lon": -1.5698336032661473,
    "approach": true
  },
  {
    "id": "offshore-lorient",
    "lat": 47.645738428548185,
    "lon": -3.4093602641221423,
    "approach": true
  },
  {
    "id": "offshore-dingle",
    "lat": 52.06852378726965,
    "lon": -10.269999999999982,
    "approach": true
  },
  {
    "id": "offshore-kangerlussuaq-east",
    "lat": 68.05233433460033,
    "lon": -31.65204319469933,
    "approach": true
  },
  {
    "id": "offshore-kulusuk",
    "lat": 65.54884811051794,
    "lon": -37.233135715636195,
    "approach": true
  },
  {
    "id": "offshore-skjoldungen",
    "lat": 63.4009974977838,
    "lon": -41.16779259443865,
    "approach": true
  },
  {
    "id": "offshore-timmiarmiut",
    "lat": 62.490156887269656,
    "lon": -42.28886180000001,
    "approach": true
  },
  {
    "id": "offshore-cape-dyer",
    "lat": 66.58058006407104,
    "lon": -61.7154423536162,
    "approach": true
  },
  {
    "id": "offshore-brevoort",
    "lat": 63.35055803291115,
    "lon": -64.12247586301419,
    "approach": true
  },
  {
    "id": "offshore-resolution-harbour",
    "lat": 61.26900150599353,
    "lon": -64.8386294785862,
    "approach": true
  },
  {
    "id": "offshore-hopedale",
    "lat": 55.4899976392371,
    "lon": -60.21364749055226,
    "approach": true
  },
  {
    "id": "offshore-bonavista",
    "lat": 48.699152312730355,
    "lon": -53.121986100000015,
    "approach": true
  },
  {
    "id": "offshore-yarmouth-canada",
    "lat": 43.78176261690888,
    "lon": -66.20339727032314,
    "approach": true
  },
  {
    "id": "offshore-morro-bay",
    "lat": 35.34998709269716,
    "lon": -120.88993730810694,
    "approach": true
  },
  {
    "id": "offshore-eureka",
    "lat": 40.772266462670466,
    "lon": -124.20424682115339,
    "approach": true
  },
  {
    "id": "offshore-astoria",
    "lat": 46.199990984096054,
    "lon": -123.87880944255602,
    "approach": true
  },
  {
    "id": "offshore-acajutla",
    "lat": 13.53563691471503,
    "lon": -89.88239170402642,
    "approach": true
  },
  {
    "id": "offshore-puerto-caldera",
    "lat": 9.900927760620279,
    "lon": -84.74433832118598,
    "approach": true
  },
  {
    "id": "offshore-golfito",
    "lat": 8.607274501063435,
    "lon": -83.19742147075698,
    "approach": true
  },
  {
    "id": "offshore-puerto-armuelles",
    "lat": 8.216598887269642,
    "lon": -82.84316239999998,
    "approach": true
  },
  {
    "id": "offshore-buenaventura",
    "lat": 3.886408212639237,
    "lon": -77.10668606273151,
    "approach": true
  },
  {
    "id": "offshore-tumaco",
    "lat": 1.832404900099236,
    "lon": -78.77727314601748,
    "approach": true
  },
  {
    "id": "offshore-esmeraldas",
    "lat": 1.0314762127303587,
    "lon": -79.64999999999998,
    "approach": true
  },
  {
    "id": "offshore-manta",
    "lat": -0.9082014896529542,
    "lon": -80.75091332439553,
    "approach": true
  },
  {
    "id": "offshore-cabo-blanco",
    "lat": -4.240460558942881,
    "lon": -81.274460515084,
    "approach": true
  },
  {
    "id": "offshore-salaverry",
    "lat": -8.250419167302676,
    "lon": -79.01323807346557,
    "approach": true
  },
  {
    "id": "offshore-chimbote",
    "lat": -9.105589351726918,
    "lon": -78.63920809741683,
    "approach": true
  },
  {
    "id": "offshore-san-nicolas",
    "lat": -15.26907423975284,
    "lon": -75.28573649053635,
    "approach": true
  },
  {
    "id": "offshore-matarani",
    "lat": -17.029224421437984,
    "lon": -72.16961056978016,
    "approach": true
  },
  {
    "id": "offshore-arica",
    "lat": -18.46666411270038,
    "lon": -70.36651796974547,
    "approach": true
  },
  {
    "id": "offshore-iquique",
    "lat": -20.19999681891287,
    "lon": -70.20020610102512,
    "approach": true
  },
  {
    "id": "offshore-antofagasta",
    "lat": -23.649994713692685,
    "lon": -70.47262828853911,
    "approach": true
  },
  {
    "id": "offshore-caldera-chile",
    "lat": -27.04045648697931,
    "lon": -70.87938170289061,
    "approach": true
  },
  {
    "id": "offshore-coquimbo",
    "lat": -29.913749368213534,
    "lon": -71.37515493157832,
    "approach": true
  },
  {
    "id": "offshore-talcahuano",
    "lat": -36.65929198726964,
    "lon": -73.0683833,
    "approach": true
  },
  {
    "id": "offshore-corral",
    "lat": -39.82492175046221,
    "lon": -73.45783843552482,
    "approach": true
  },
  {
    "id": "offshore-norfolk",
    "lat": 36.89428262272265,
    "lon": -76.30976221555295,
    "approach": true
  },
  {
    "id": "offshore-morehead-city",
    "lat": 34.70589621267197,
    "lon": -76.73597918583584,
    "approach": true
  },
  {
    "id": "offshore-charleston",
    "lat": 32.78332743162989,
    "lon": -79.95410640447807,
    "approach": true
  },
  {
    "id": "offshore-jacksonville",
    "lat": 30.28516322931931,
    "lon": -81.29170581328879,
    "approach": true
  },
  {
    "id": "offshore-canaveral",
    "lat": 28.669001839023995,
    "lon": -80.62289648518333,
    "approach": true
  },
  {
    "id": "offshore-key-west",
    "lat": 24.517600987269642,
    "lon": -81.8194542,
    "approach": true
  },
  {
    "id": "offshore-matthew-town",
    "lat": 20.949996689787834,
    "lon": -73.71703730959922,
    "approach": true
  },
  {
    "id": "offshore-haina",
    "lat": 18.37251448726964,
    "lon": -70.01180449999998,
    "approach": true
  },
  {
    "id": "offshore-rocky-point",
    "lat": 17.785190787269634,
    "lon": -77.14999999999998,
    "approach": true
  },
  {
    "id": "offshore-trujillo-honduras",
    "lat": 15.96673491273036,
    "lon": -85.95703730000002,
    "approach": true
  },
  {
    "id": "offshore-st-johns-antigua",
    "lat": 17.116664137407742,
    "lon": -61.89234498730457,
    "approach": true
  },
  {
    "id": "offshore-fort-de-france",
    "lat": 14.584260205274948,
    "lon": -61.094833778802354,
    "approach": true
  },
  {
    "id": "offshore-point-lisas",
    "lat": 10.399998413172753,
    "lon": -61.53200195772013,
    "approach": true
  },
  {
    "id": "offshore-rio-grande",
    "lat": -32.08147621273036,
    "lon": -52.08333300000004,
    "approach": true
  },
  {
    "id": "offshore-itajai",
    "lat": -26.947663185889315,
    "lon": -48.61727564461955,
    "approach": true
  },
  {
    "id": "offshore-vitoria",
    "lat": -20.266112187269638,
    "lon": -40.35367350000001,
    "approach": true
  },
  {
    "id": "offshore-ilheus",
    "lat": -14.81433094947482,
    "lon": -39.02232071936703,
    "approach": true
  },
  {
    "id": "offshore-salvador",
    "lat": -12.988923047430994,
    "lon": -38.53950847552426,
    "approach": true
  },
  {
    "id": "offshore-recife",
    "lat": -8.100482481320004,
    "lon": -34.87565787136725,
    "approach": true
  },
  {
    "id": "offshore-natal",
    "lat": -5.7523343553111035,
    "lon": -35.178375849332156,
    "approach": true
  },
  {
    "id": "offshore-fortaleza",
    "lat": -3.658211187269641,
    "lon": -38.483333000000016,
    "approach": true
  },
  {
    "id": "offshore-agadir",
    "lat": 30.43332782069262,
    "lon": -9.676097246542213,
    "approach": true
  },
  {
    "id": "offshore-laayoune",
    "lat": 27.08332857882135,
    "lon": -13.468685814835226,
    "approach": true
  },
  {
    "id": "offshore-dakhla",
    "lat": 23.699996204696973,
    "lon": -15.951042339070455,
    "approach": true
  },
  {
    "id": "offshore-nouadhibou",
    "lat": 20.87927799208222,
    "lon": -17.03082170307073,
    "approach": true
  },
  {
    "id": "offshore-nouakchott",
    "lat": 18.033326485201844,
    "lon": -16.104266510488515,
    "approach": true
  },
  {
    "id": "offshore-banjul",
    "lat": 13.472256008947397,
    "lon": -16.58955382317231,
    "approach": true
  },
  {
    "id": "offshore-conakry",
    "lat": 9.485416033126636,
    "lon": -13.739232568846774,
    "approach": true
  },
  {
    "id": "offshore-freetown",
    "lat": 8.499998707855351,
    "lon": -13.265158791502131,
    "approach": true
  },
  {
    "id": "offshore-monrovia",
    "lat": 6.294409478579259,
    "lon": -10.839059029731857,
    "approach": true
  },
  {
    "id": "offshore-cape-palmas",
    "lat": 4.3362590276155935,
    "lon": -7.742799636942323,
    "approach": true
  },
  {
    "id": "offshore-sekondi",
    "lat": 4.918523787269642,
    "lon": -1.7000000000000455,
    "approach": true
  },
  {
    "id": "offshore-lagos",
    "lat": 6.368523787269641,
    "lon": 3.3999999999999773,
    "approach": true
  },
  {
    "id": "offshore-malabo",
    "lat": 3.7868721127303586,
    "lon": 8.78333299999997,
    "approach": true
  },
  {
    "id": "offshore-bata",
    "lat": 1.8666666182199811,
    "lon": 9.721677075098,
    "approach": true
  },
  {
    "id": "offshore-port-gentil",
    "lat": -0.6892344084106151,
    "lon": 8.770419895147029,
    "approach": true
  },
  {
    "id": "offshore-pointe-noire",
    "lat": -4.8089628620160205,
    "lon": 11.788783002503237,
    "approach": true
  },
  {
    "id": "offshore-luanda",
    "lat": -8.808856516645005,
    "lon": 13.218138490728279,
    "approach": true
  },
  {
    "id": "offshore-lobito",
    "lat": -12.333331109610102,
    "lon": 13.53444720198388,
    "approach": true
  },
  {
    "id": "offshore-namibe",
    "lat": -15.17455945507112,
    "lon": 12.09103105156214,
    "approach": true
  },
  {
    "id": "offshore-walvis-bay",
    "lat": -22.945381939737825,
    "lon": 14.452053904591594,
    "approach": true
  },
  {
    "id": "offshore-luderitz",
    "lat": -26.61660592798935,
    "lon": 15.13368948456673,
    "approach": true
  },
  {
    "id": "offshore-saldanha",
    "lat": -33.04906688859748,
    "lon": 17.93414603251199,
    "approach": true
  },
  {
    "id": "offshore-sharm-el-sheikh",
    "lat": 27.812164487269644,
    "lon": 34.29052479999996,
    "approach": true
  },
  {
    "id": "offshore-hurghada",
    "lat": 27.18566884767086,
    "lon": 33.843855426401205,
    "approach": true
  },
  {
    "id": "offshore-al-qusayr",
    "lat": 26.130994790532373,
    "lon": 34.30728815041425,
    "approach": true
  },
  {
    "id": "offshore-duba",
    "lat": 27.316434734354807,
    "lon": 35.611524388531734,
    "approach": true
  },
  {
    "id": "offshore-al-mukha",
    "lat": 13.316664953530212,
    "lon": 43.214881567142015,
    "approach": true
  },
  {
    "id": "offshore-muscat",
    "lat": 23.678798612730358,
    "lon": 58.59860559999993,
    "approach": true
  },
  {
    "id": "offshore-sohar",
    "lat": 24.548143212730363,
    "lon": 56.63333299999999,
    "approach": true
  },
  {
    "id": "offshore-fujairah",
    "lat": 25.204050495724424,
    "lon": 56.392936601303404,
    "approach": true
  },
  {
    "id": "offshore-karachi",
    "lat": 24.751856787269645,
    "lon": 66.98333300000002,
    "approach": true
  },
  {
    "id": "offshore-okha",
    "lat": 22.49905351044301,
    "lon": 69.0856382844288,
    "approach": true
  },
  {
    "id": "offshore-veraval",
    "lat": 20.868523787269638,
    "lon": 70.366667,
    "approach": true
  },
  {
    "id": "offshore-penang",
    "lat": 5.416666180180285,
    "lon": 100.31838260128814,
    "approach": true
  },
  {
    "id": "offshore-port-klang",
    "lat": 2.977742130539387,
    "lon": 101.34169066478921,
    "approach": true
  },
  {
    "id": "offshore-sabang",
    "lat": 5.914809212730359,
    "lon": 95.31666700000005,
    "approach": true
  },
  {
    "id": "offshore-belawan",
    "lat": 3.8783984127303595,
    "lon": 98.74706809999998,
    "approach": true
  },
  {
    "id": "offshore-phuket",
    "lat": 7.799647251261519,
    "lon": 98.39400946407795,
    "approach": true
  },
  {
    "id": "offshore-salina-cruz",
    "lat": 16.11373878726964,
    "lon": -95.19299999999998,
    "approach": true
  },
  {
    "id": "offshore-puerto-quetzal",
    "lat": 13.877930587269638,
    "lon": -90.7842,
    "approach": true
  },
  {
    "id": "offshore-corinto",
    "lat": 12.461042000116542,
    "lon": -87.18949400242337,
    "approach": true
  },
  {
    "id": "offshore-belize-city",
    "lat": 17.444001899653085,
    "lon": -88.20072927377919,
    "approach": true
  },
  {
    "id": "offshore-puerto-limon",
    "lat": 9.959001935796291,
    "lon": -83.03054940653107,
    "approach": true
  },
  {
    "id": "offshore-yanbu",
    "lat": 24.062081739347487,
    "lon": 38.0016457452773,
    "approach": true
  },
  {
    "id": "offshore-jazan",
    "lat": 17.283296809853383,
    "lon": 42.28620764911307,
    "approach": true
  },
  {
    "id": "offshore-aden",
    "lat": 12.72982788726964,
    "lon": 45.033300000000054,
    "approach": true
  },
  {
    "id": "offshore-mukalla",
    "lat": 14.479827887269645,
    "lon": 49.11670000000004,
    "approach": true
  },
  {
    "id": "offshore-salalah",
    "lat": 16.908984787269638,
    "lon": 54.02667139999994,
    "approach": true
  },
  {
    "id": "offshore-duqm",
    "lat": 19.68099732517726,
    "lon": 57.708519104611696,
    "approach": true
  },
  {
    "id": "offshore-gwadar",
    "lat": 25.04925098726964,
    "lon": 62.33330000000001,
    "approach": true
  },
  {
    "id": "offshore-mormugao",
    "lat": 15.416697615799444,
    "lon": 73.75064893566105,
    "approach": true
  },
  {
    "id": "offshore-new-mangalore",
    "lat": 12.93329651452598,
    "lon": 74.75672259185126,
    "approach": true
  },
  {
    "id": "offshore-kochi",
    "lat": 9.969998480154526,
    "lon": 76.2263411622572,
    "approach": true
  },
  {
    "id": "offshore-puerto-montt",
    "lat": -41.527485612730366,
    "lon": -72.96050680000002,
    "approach": true
  },
  {
    "id": "offshore-puerto-chacabuco",
    "lat": -45.44757721791102,
    "lon": -72.90539213363115,
    "approach": true
  },
  {
    "id": "offshore-puerto-natales",
    "lat": -51.70589153118009,
    "lon": -72.61439632134847,
    "approach": true
  },
  {
    "id": "offshore-punta-arenas",
    "lat": -53.19766346996169,
    "lon": -70.89412259580308,
    "approach": true
  },
  {
    "id": "offshore-ushuaia",
    "lat": -54.84814291273036,
    "lon": -68.30000000000001,
    "approach": true
  },
  {
    "id": "offshore-puerto-williams",
    "lat": -54.89286388726964,
    "lon": -67.60000000000002,
    "approach": true
  },
  {
    "id": "offshore-cape-horn",
    "lat": -55.9739976322904,
    "lon": -67.21910114971536,
    "approach": true
  },
  {
    "id": "offshore-fildes-bay",
    "lat": -62.247309512730354,
    "lon": -58.95972219999999,
    "approach": true
  },
  {
    "id": "offshore-deception-island",
    "lat": -62.96106778533617,
    "lon": -60.615626773112695,
    "approach": true
  },
  {
    "id": "offshore-port-lockroy",
    "lat": -64.80091481170032,
    "lon": -63.56402408391904,
    "approach": true
  },
  {
    "id": "offshore-bahia-blanca",
    "lat": -38.847410312730354,
    "lon": -62.247155099999986,
    "approach": true
  },
  {
    "id": "offshore-puerto-madryn",
    "lat": -42.735648740699624,
    "lon": -64.97339858265076,
    "approach": true
  },
  {
    "id": "offshore-puerto-deseado",
    "lat": -47.77225228165165,
    "lon": -65.93311669388652,
    "approach": true
  },
  {
    "id": "offshore-rio-gallegos",
    "lat": -51.585668252812226,
    "lon": -68.97111831899326,
    "approach": true
  },
  {
    "id": "route-genoa-la-spezia-1",
    "lat": 43.98099352,
    "lon": 9.72988064,
    "approach": true
  },
  {
    "id": "route-genoa-la-spezia-2",
    "lat": 44.05135582,
    "lon": 9.93104922,
    "approach": true
  },
  {
    "id": "route-la-spezia-livorno-1",
    "lat": 43.90457517,
    "lon": 10.0829726,
    "approach": true
  },
  {
    "id": "route-livorno-piombino-1",
    "lat": 43.00239957,
    "lon": 10.24657673,
    "approach": true
  },
  {
    "id": "route-piombino-civitavecchia-1",
    "lat": 42.356881,
    "lon": 11.04478923,
    "approach": true
  },
  {
    "id": "route-anzio-gaeta-1",
    "lat": 41.05797143,
    "lon": 13.31782912,
    "approach": true
  },
  {
    "id": "route-gaeta-naples-1",
    "lat": 41.00840282,
    "lon": 13.79335511,
    "approach": true
  },
  {
    "id": "route-gaeta-naples-2",
    "lat": 40.64794413,
    "lon": 14.02911885,
    "approach": true
  },
  {
    "id": "route-naples-salerno-1",
    "lat": 40.61626381,
    "lon": 14.275,
    "approach": true
  },
  {
    "id": "route-naples-salerno-2",
    "lat": 40.43615798,
    "lon": 14.51131089,
    "approach": true
  },
  {
    "id": "route-salerno-vibo-valentia-1",
    "lat": 40.44183661,
    "lon": 14.75,
    "approach": true
  },
  {
    "id": "route-salerno-vibo-valentia-2",
    "lat": 39.17903164,
    "lon": 15.67803887,
    "approach": true
  },
  {
    "id": "route-vibo-valentia-messina-1",
    "lat": 38.57024967,
    "lon": 15.63321455,
    "approach": true
  },
  {
    "id": "route-vibo-valentia-messina-2",
    "lat": 38.57092685,
    "lon": 15.86326469,
    "approach": true
  },
  {
    "id": "route-catania-crotone-1",
    "lat": 38.00312234,
    "lon": 16.24576334,
    "approach": true
  },
  {
    "id": "route-catania-crotone-2",
    "lat": 38.88561008,
    "lon": 17.41514008,
    "approach": true
  },
  {
    "id": "route-crotone-taranto-1",
    "lat": 40.01444303,
    "lon": 17.37198403,
    "approach": true
  },
  {
    "id": "route-taranto-brindisi-1",
    "lat": 40.08443904,
    "lon": 17.40583984,
    "approach": true
  },
  {
    "id": "route-taranto-brindisi-2",
    "lat": 39.7190265,
    "lon": 18.33993908,
    "approach": true
  },
  {
    "id": "route-taranto-brindisi-3",
    "lat": 40.07608247,
    "lon": 18.58115198,
    "approach": true
  },
  {
    "id": "route-taranto-brindisi-4",
    "lat": 40.43839017,
    "lon": 18.35238955,
    "approach": true
  },
  {
    "id": "route-brindisi-corfu-1",
    "lat": 39.42129589,
    "lon": 19.86443489,
    "approach": true
  },
  {
    "id": "route-brindisi-corfu-2",
    "lat": 39.23301885,
    "lon": 20.32387168,
    "approach": true
  },
  {
    "id": "route-corfu-argostoli-1",
    "lat": 39.46756728,
    "lon": 20.16272622,
    "approach": true
  },
  {
    "id": "route-corfu-argostoli-2",
    "lat": 38.74742603,
    "lon": 20.39096174,
    "approach": true
  },
  {
    "id": "route-corfu-argostoli-3",
    "lat": 38.20852491,
    "lon": 20.15861646,
    "approach": true
  },
  {
    "id": "route-katakolon-kalamata-1",
    "lat": 36.5545779,
    "lon": 21.71110148,
    "approach": true
  },
  {
    "id": "route-katakolon-kalamata-2",
    "lat": 36.73337063,
    "lon": 21.93657458,
    "approach": true
  },
  {
    "id": "route-kalamata-kissamos-1",
    "lat": 36.79633321,
    "lon": 22.1166667,
    "approach": true
  },
  {
    "id": "route-kalamata-kissamos-2",
    "lat": 36.25590338,
    "lon": 22.56275703,
    "approach": true
  },
  {
    "id": "route-kalamata-kissamos-3",
    "lat": 35.70700213,
    "lon": 23.66713541,
    "approach": true
  },
  {
    "id": "route-kissamos-heraklion-1",
    "lat": 35.74149679,
    "lon": 23.6333333,
    "approach": true
  },
  {
    "id": "route-kissamos-heraklion-2",
    "lat": 35.55658715,
    "lon": 24.73879519,
    "approach": true
  },
  {
    "id": "route-heraklion-sitia-1",
    "lat": 35.38067424,
    "lon": 25.59121075,
    "approach": true
  },
  {
    "id": "route-sitia-rhodes-1",
    "lat": 36.14238214,
    "lon": 27.24694715,
    "approach": true
  },
  {
    "id": "route-sitia-rhodes-2",
    "lat": 36.3173314,
    "lon": 27.69589005,
    "approach": true
  },
  {
    "id": "route-fethiye-antalya-1",
    "lat": 36.43836877,
    "lon": 28.8196218,
    "approach": true
  },
  {
    "id": "route-fethiye-antalya-2",
    "lat": 36.07801975,
    "lon": 29.48827935,
    "approach": true
  },
  {
    "id": "route-fethiye-antalya-3",
    "lat": 36.07138111,
    "lon": 30.37837222,
    "approach": true
  },
  {
    "id": "route-fethiye-antalya-4",
    "lat": 36.42833664,
    "lon": 30.60807377,
    "approach": true
  },
  {
    "id": "route-alanya-limassol-1",
    "lat": 35.06274168,
    "lon": 32.21971919,
    "approach": true
  },
  {
    "id": "route-alanya-limassol-2",
    "lat": 34.70241096,
    "lon": 32.43749107,
    "approach": true
  },
  {
    "id": "route-alanya-limassol-3",
    "lat": 34.51833703,
    "lon": 33.09128549,
    "approach": true
  },
  {
    "id": "route-limassol-larnaca-1",
    "lat": 34.62173441,
    "lon": 33.49274592,
    "approach": true
  },
  {
    "id": "route-palermo-vibo-valentia-1",
    "lat": 38.67825687,
    "lon": 15.46180977,
    "approach": true
  },
  {
    "id": "route-palermo-messina-1",
    "lat": 38.3144382,
    "lon": 15.68068644,
    "approach": true
  },
  {
    "id": "route-ajaccio-piombino-1",
    "lat": 41.72188361,
    "lon": 8.47901949,
    "approach": true
  },
  {
    "id": "route-ajaccio-piombino-2",
    "lat": 42.44133583,
    "lon": 8.47627467,
    "approach": true
  },
  {
    "id": "route-ajaccio-piombino-3",
    "lat": 42.98014639,
    "lon": 9.21168105,
    "approach": true
  },
  {
    "id": "route-ajaccio-piombino-4",
    "lat": 43.15687953,
    "lon": 9.70619763,
    "approach": true
  },
  {
    "id": "route-kalamata-piraeus-1",
    "lat": 36.79633321,
    "lon": 22.1166667,
    "approach": true
  },
  {
    "id": "route-kalamata-piraeus-2",
    "lat": 36.25590338,
    "lon": 22.56275703,
    "approach": true
  },
  {
    "id": "route-kalamata-piraeus-3",
    "lat": 36.4332422,
    "lon": 23.01090139,
    "approach": true
  },
  {
    "id": "route-kalamata-piraeus-4",
    "lat": 36.25150612,
    "lon": 23.23185045,
    "approach": true
  },
  {
    "id": "route-kalamata-piraeus-5",
    "lat": 37.50525696,
    "lon": 23.70382615,
    "approach": true
  },
  {
    "id": "route-piraeus-heraklion-1",
    "lat": 35.9047479,
    "lon": 24.72008481,
    "approach": true
  },
  {
    "id": "route-piraeus-rhodes-1",
    "lat": 37.52857761,
    "lon": 23.83679926,
    "approach": true
  },
  {
    "id": "route-piraeus-rhodes-2",
    "lat": 37.52094709,
    "lon": 24.97070252,
    "approach": true
  },
  {
    "id": "route-piraeus-rhodes-3",
    "lat": 36.39506232,
    "lon": 27.18562435,
    "approach": true
  },
  {
    "id": "route-piraeus-rhodes-4",
    "lat": 36.38058308,
    "lon": 27.63207185,
    "approach": true
  },
  {
    "id": "route-rhodes-limassol-1",
    "lat": 34.40556098,
    "lon": 33.02340723,
    "approach": true
  },
  {
    "id": "route-cancun-rio-lagartos-1",
    "lat": 21.28952683,
    "lon": -86.55563983,
    "approach": true
  },
  {
    "id": "route-cancun-rio-lagartos-2",
    "lat": 21.64892327,
    "lon": -87.13570008,
    "approach": true
  },
  {
    "id": "route-progreso-celestun-1",
    "lat": 21.16093615,
    "lon": -90.24527468,
    "approach": true
  },
  {
    "id": "route-progreso-celestun-2",
    "lat": 20.9803098,
    "lon": -90.43720502,
    "approach": true
  },
  {
    "id": "route-campeche-champoton-1",
    "lat": 19.65566608,
    "lon": -90.82600814,
    "approach": true
  },
  {
    "id": "route-ciudad-carmen-dos-bocas-1",
    "lat": 18.82143252,
    "lon": -92.0649107,
    "approach": true
  },
  {
    "id": "route-dos-bocas-coatzacoalcos-1",
    "lat": 18.48252444,
    "lon": -93.57206975,
    "approach": true
  },
  {
    "id": "route-coatzacoalcos-alvarado-1",
    "lat": 18.55523263,
    "lon": -94.79622912,
    "approach": true
  },
  {
    "id": "route-coatzacoalcos-alvarado-2",
    "lat": 18.7339674,
    "lon": -95.17647472,
    "approach": true
  },
  {
    "id": "route-coatzacoalcos-alvarado-3",
    "lat": 18.910711,
    "lon": -95.747639,
    "approach": true
  },
  {
    "id": "route-coatzacoalcos-alvarado-4",
    "lat": 18.73086634,
    "lon": -95.746231,
    "approach": true
  },
  {
    "id": "route-alvarado-veracruz-1",
    "lat": 18.79880285,
    "lon": -95.73745389,
    "approach": true
  },
  {
    "id": "route-acapulco-zihuatanejo-1",
    "lat": 17.33388445,
    "lon": -101.23893972,
    "approach": true
  },
  {
    "id": "route-lazaro-cardenas-manzanillo-1",
    "lat": 18.23849317,
    "lon": -103.30293481,
    "approach": true
  },
  {
    "id": "route-lazaro-cardenas-manzanillo-2",
    "lat": 18.41576024,
    "lon": -103.68323977,
    "approach": true
  },
  {
    "id": "route-manzanillo-puerto-vallarta-1",
    "lat": 19.35902557,
    "lon": -105.09662272,
    "approach": true
  },
  {
    "id": "route-manzanillo-puerto-vallarta-2",
    "lat": 20.25351112,
    "lon": -105.86769536,
    "approach": true
  },
  {
    "id": "route-manzanillo-puerto-vallarta-3",
    "lat": 20.43485564,
    "lon": -105.67752853,
    "approach": true
  },
  {
    "id": "route-puerto-vallarta-mazatlan-1",
    "lat": 20.79517822,
    "lon": -105.68780033,
    "approach": true
  },
  {
    "id": "route-mazatlan-la-paz-1",
    "lat": 24.38188442,
    "lon": -109.81877884,
    "approach": true
  },
  {
    "id": "route-mazatlan-la-paz-2",
    "lat": 24.3681313,
    "lon": -110.41093535,
    "approach": true
  },
  {
    "id": "route-la-paz-los-cabos-1",
    "lat": 24.38019951,
    "lon": -110.34439088,
    "approach": true
  },
  {
    "id": "route-la-paz-los-cabos-2",
    "lat": 24.38007216,
    "lon": -110.14691783,
    "approach": true
  },
  {
    "id": "route-la-paz-los-cabos-3",
    "lat": 24.01933372,
    "lon": -109.75364411,
    "approach": true
  },
  {
    "id": "route-la-paz-los-cabos-4",
    "lat": 23.47775426,
    "lon": -109.36391861,
    "approach": true
  },
  {
    "id": "route-la-paz-los-cabos-5",
    "lat": 23.29790181,
    "lon": -109.36526339,
    "approach": true
  },
  {
    "id": "route-la-paz-los-cabos-6",
    "lat": 22.93930919,
    "lon": -109.5632121,
    "approach": true
  },
  {
    "id": "route-los-cabos-san-carlos-1",
    "lat": 23.01791045,
    "lon": -110.29084611,
    "approach": true
  },
  {
    "id": "route-los-cabos-san-carlos-2",
    "lat": 24.26517955,
    "lon": -111.87280242,
    "approach": true
  },
  {
    "id": "route-los-cabos-san-carlos-3",
    "lat": 24.62222018,
    "lon": -112.07612757,
    "approach": true
  },
  {
    "id": "route-san-carlos-bahia-tortugas-1",
    "lat": 24.59287612,
    "lon": -111.94999237,
    "approach": true
  },
  {
    "id": "route-san-carlos-bahia-tortugas-2",
    "lat": 24.41314185,
    "lon": -112.14779974,
    "approach": true
  },
  {
    "id": "route-bahia-tortugas-san-quintin-1",
    "lat": 27.705763,
    "lon": -115.00522727,
    "approach": true
  },
  {
    "id": "route-bahia-tortugas-san-quintin-2",
    "lat": 27.97534106,
    "lon": -115.15827587,
    "approach": true
  },
  {
    "id": "route-bahia-tortugas-san-quintin-3",
    "lat": 28.2990946,
    "lon": -115.15910357,
    "approach": true
  },
  {
    "id": "route-bahia-tortugas-san-quintin-4",
    "lat": 30.21110071,
    "lon": -115.91326353,
    "approach": true
  },
  {
    "id": "route-bahia-tortugas-san-quintin-5",
    "lat": 30.39946417,
    "lon": -115.97773085,
    "approach": true
  },
  {
    "id": "route-san-quintin-ensenada-1",
    "lat": 30.28696709,
    "lon": -115.98060301,
    "approach": true
  },
  {
    "id": "route-san-quintin-ensenada-2",
    "lat": 31.72315375,
    "lon": -116.82636685,
    "approach": true
  },
  {
    "id": "route-ensenada-san-diego-1",
    "lat": 32.01010396,
    "lon": -116.88811548,
    "approach": true
  },
  {
    "id": "route-ensenada-san-diego-2",
    "lat": 32.36929928,
    "lon": -117.10190319,
    "approach": true
  },
  {
    "id": "route-portimao-lisbon-1",
    "lat": 36.89711155,
    "lon": -8.9828214,
    "approach": true
  },
  {
    "id": "route-a-coruna-gijon-1",
    "lat": 43.60134029,
    "lon": -8.37,
    "approach": true
  },
  {
    "id": "route-a-coruna-gijon-2",
    "lat": 43.78093499,
    "lon": -8.12087877,
    "approach": true
  },
  {
    "id": "route-a-coruna-gijon-3",
    "lat": 43.95430698,
    "lon": -7.12073003,
    "approach": true
  },
  {
    "id": "route-a-coruna-gijon-4",
    "lat": 43.75427575,
    "lon": -5.8795263,
    "approach": true
  },
  {
    "id": "route-gijon-santander-1",
    "lat": 43.5121401,
    "lon": -3.68239748,
    "approach": true
  },
  {
    "id": "route-santander-bayonne-1",
    "lat": 43.47137447,
    "lon": -3.76442004,
    "approach": true
  },
  {
    "id": "route-santander-bayonne-2",
    "lat": 43.52510263,
    "lon": -3.57832806,
    "approach": true
  },
  {
    "id": "route-bayonne-la-rochelle-1",
    "lat": 46.06817786,
    "lon": -1.5698336,
    "approach": true
  },
  {
    "id": "route-la-rochelle-lorient-1",
    "lat": 46.13954031,
    "lon": -1.49266648,
    "approach": true
  },
  {
    "id": "route-lorient-brest-1",
    "lat": 47.82062617,
    "lon": -4.4808831,
    "approach": true
  },
  {
    "id": "route-lorient-brest-2",
    "lat": 47.99765686,
    "lon": -4.75337166,
    "approach": true
  },
  {
    "id": "route-brest-newlyn-1",
    "lat": 48.33393736,
    "lon": -4.92156372,
    "approach": true
  },
  {
    "id": "route-newlyn-cork-1",
    "lat": 49.8864654,
    "lon": -5.81854235,
    "approach": true
  },
  {
    "id": "route-newlyn-falmouth-1",
    "lat": 49.8864654,
    "lon": -5.26022172,
    "approach": true
  },
  {
    "id": "route-newlyn-falmouth-2",
    "lat": 50.0653162,
    "lon": -4.97897742,
    "approach": true
  },
  {
    "id": "route-cork-dingle-1",
    "lat": 51.56830333,
    "lon": -8.52936563,
    "approach": true
  },
  {
    "id": "route-cork-dingle-2",
    "lat": 51.37992951,
    "lon": -9.68094776,
    "approach": true
  },
  {
    "id": "route-cork-dingle-3",
    "lat": 51.55120093,
    "lon": -10.26505118,
    "approach": true
  },
  {
    "id": "route-cork-dingle-4",
    "lat": 51.90536604,
    "lon": -10.5726495,
    "approach": true
  },
  {
    "id": "route-dingle-galway-1",
    "lat": 52.06816155,
    "lon": -10.5625942,
    "approach": true
  },
  {
    "id": "route-dingle-galway-2",
    "lat": 52.42825193,
    "lon": -10.27,
    "approach": true
  },
  {
    "id": "route-dingle-galway-3",
    "lat": 52.96635928,
    "lon": -9.67274418,
    "approach": true
  },
  {
    "id": "route-galway-killybegs-1",
    "lat": 53.05803638,
    "lon": -9.67484668,
    "approach": true
  },
  {
    "id": "route-galway-killybegs-2",
    "lat": 53.05615626,
    "lon": -9.97409532,
    "approach": true
  },
  {
    "id": "route-galway-killybegs-3",
    "lat": 53.59302566,
    "lon": -10.28853957,
    "approach": true
  },
  {
    "id": "route-galway-killybegs-4",
    "lat": 54.13252433,
    "lon": -10.30423302,
    "approach": true
  },
  {
    "id": "route-galway-killybegs-5",
    "lat": 54.31508315,
    "lon": -10.00129355,
    "approach": true
  },
  {
    "id": "route-killybegs-oban-1",
    "lat": 54.57002379,
    "lon": -8.77883867,
    "approach": true
  },
  {
    "id": "route-killybegs-oban-2",
    "lat": 54.7486892,
    "lon": -9.09184657,
    "approach": true
  },
  {
    "id": "route-killybegs-oban-3",
    "lat": 55.64591988,
    "lon": -7.51239125,
    "approach": true
  },
  {
    "id": "route-killybegs-oban-4",
    "lat": 55.98905899,
    "lon": -6.21750068,
    "approach": true
  },
  {
    "id": "route-oban-stornoway-1",
    "lat": 56.25174508,
    "lon": -5.86684175,
    "approach": true
  },
  {
    "id": "route-oban-stornoway-2",
    "lat": 56.24836017,
    "lon": -6.51430885,
    "approach": true
  },
  {
    "id": "route-oban-stornoway-3",
    "lat": 56.78487953,
    "lon": -6.85654552,
    "approach": true
  },
  {
    "id": "route-oban-stornoway-4",
    "lat": 57.50418162,
    "lon": -6.88226308,
    "approach": true
  },
  {
    "id": "route-oban-stornoway-5",
    "lat": 58.04901997,
    "lon": -6.22276733,
    "approach": true
  },
  {
    "id": "route-stornoway-scrabster-1",
    "lat": 58.67072259,
    "lon": -4.96623453,
    "approach": true
  },
  {
    "id": "route-scrabster-stromness-1",
    "lat": 59.00739244,
    "lon": -3.53949492,
    "approach": true
  },
  {
    "id": "route-stromness-lerwick-1",
    "lat": 59.1019068,
    "lon": -3.6592094,
    "approach": true
  },
  {
    "id": "route-stromness-lerwick-2",
    "lat": 59.28224203,
    "lon": -3.3089462,
    "approach": true
  },
  {
    "id": "route-stromness-lerwick-3",
    "lat": 59.80446929,
    "lon": -1.16296106,
    "approach": true
  },
  {
    "id": "route-stromness-lerwick-4",
    "lat": 60.15764194,
    "lon": -0.77836666,
    "approach": true
  },
  {
    "id": "route-lerwick-torshavn-1",
    "lat": 60.39762895,
    "lon": -0.7858851,
    "approach": true
  },
  {
    "id": "route-lerwick-torshavn-2",
    "lat": 60.75584355,
    "lon": -0.41365073,
    "approach": true
  },
  {
    "id": "route-torshavn-sorvagur-1",
    "lat": 61.77859888,
    "lon": -6.31381716,
    "approach": true
  },
  {
    "id": "route-torshavn-sorvagur-2",
    "lat": 61.59926145,
    "lon": -6.69417757,
    "approach": true
  },
  {
    "id": "route-sorvagur-budir-1",
    "lat": 64.83265396,
    "lon": -13.31680907,
    "approach": true
  },
  {
    "id": "route-budir-hofn-1",
    "lat": 64.74065477,
    "lon": -13.14551563,
    "approach": true
  },
  {
    "id": "route-budir-hofn-2",
    "lat": 64.38273195,
    "lon": -14.40455854,
    "approach": true
  },
  {
    "id": "route-budir-seydisfjordur-1",
    "lat": 64.74065477,
    "lon": -13.14551563,
    "approach": true
  },
  {
    "id": "route-budir-seydisfjordur-2",
    "lat": 65.28203075,
    "lon": -13.55841305,
    "approach": true
  },
  {
    "id": "route-kangerlussuaq-east-kulusuk-1",
    "lat": 66.41008392,
    "lon": -34.3492164,
    "approach": true
  },
  {
    "id": "route-kangerlussuaq-east-kulusuk-2",
    "lat": 65.42827818,
    "lon": -37.28074545,
    "approach": true
  },
  {
    "id": "route-tasiilaq-skjoldungen-1",
    "lat": 63.16407434,
    "lon": -40.80782901,
    "approach": true
  },
  {
    "id": "route-skjoldungen-timmiarmiut-1",
    "lat": 63.22057344,
    "lon": -40.76858687,
    "approach": true
  },
  {
    "id": "route-skjoldungen-timmiarmiut-2",
    "lat": 62.49949613,
    "lon": -41.94682259,
    "approach": true
  },
  {
    "id": "route-timmiarmiut-qutdleq-1",
    "lat": 62.30975426,
    "lon": -41.90179872,
    "approach": true
  },
  {
    "id": "route-sisimiut-cape-dyer-1",
    "lat": 66.42386551,
    "lon": -60.55267626,
    "approach": true
  },
  {
    "id": "route-cape-dyer-brevoort-1",
    "lat": 66.3981289,
    "lon": -60.81694375,
    "approach": true
  },
  {
    "id": "route-brevoort-resolution-harbour-1",
    "lat": 62.99027486,
    "lon": -63.72642323,
    "approach": true
  },
  {
    "id": "route-brevoort-resolution-harbour-2",
    "lat": 61.73125119,
    "lon": -64.50220173,
    "approach": true
  },
  {
    "id": "route-cape-dyer-qikiqtarjuaq-1",
    "lat": 66.3981289,
    "lon": -60.81694375,
    "approach": true
  },
  {
    "id": "route-cape-dyer-qikiqtarjuaq-2",
    "lat": 67.47718904,
    "lon": -62.65455205,
    "approach": true
  },
  {
    "id": "route-cape-dyer-qikiqtarjuaq-3",
    "lat": 67.82860862,
    "lon": -63.62204907,
    "approach": true
  },
  {
    "id": "route-cape-dyer-qikiqtarjuaq-4",
    "lat": 67.64268709,
    "lon": -64.08013597,
    "approach": true
  },
  {
    "id": "route-brevoort-iqaluit-1",
    "lat": 63.17013519,
    "lon": -63.72396511,
    "approach": true
  },
  {
    "id": "route-brevoort-iqaluit-2",
    "lat": 62.62891102,
    "lon": -64.90491447,
    "approach": true
  },
  {
    "id": "route-brevoort-iqaluit-3",
    "lat": 62.4425333,
    "lon": -65.67767914,
    "approach": true
  },
  {
    "id": "route-brevoort-iqaluit-4",
    "lat": 62.96364704,
    "lon": -66.89315857,
    "approach": true
  },
  {
    "id": "route-nain-hopedale-1",
    "lat": 56.5605701,
    "lon": -61.35351824,
    "approach": true
  },
  {
    "id": "route-nain-hopedale-2",
    "lat": 56.37730691,
    "lon": -60.70540467,
    "approach": true
  },
  {
    "id": "route-nain-hopedale-3",
    "lat": 55.65127419,
    "lon": -60.08594993,
    "approach": true
  },
  {
    "id": "route-hopedale-cartwright-1",
    "lat": 54.9654086,
    "lon": -57.95742941,
    "approach": true
  },
  {
    "id": "route-hopedale-cartwright-2",
    "lat": 54.58976365,
    "lon": -57.23286126,
    "approach": true
  },
  {
    "id": "route-hopedale-cartwright-3",
    "lat": 53.86478202,
    "lon": -57.04085659,
    "approach": true
  },
  {
    "id": "route-hopedale-cartwright-4",
    "lat": 53.72106154,
    "lon": -57.05179683,
    "approach": true
  },
  {
    "id": "route-hopedale-cartwright-5",
    "lat": 53.65543378,
    "lon": -57.29974549,
    "approach": true
  },
  {
    "id": "route-hopedale-cartwright-6",
    "lat": 53.58051204,
    "lon": -57.18368869,
    "approach": true
  },
  {
    "id": "route-st-anthony-bonavista-1",
    "lat": 49.14928217,
    "lon": -53.34748701,
    "approach": true
  },
  {
    "id": "route-bonavista-st-johns-1",
    "lat": 48.87901639,
    "lon": -53.1219861,
    "approach": true
  },
  {
    "id": "route-bonavista-st-johns-2",
    "lat": 47.97843337,
    "lon": -52.58461521,
    "approach": true
  },
  {
    "id": "route-saint-pierre-north-sydney-1",
    "lat": 46.48152957,
    "lon": -60.04970686,
    "approach": true
  },
  {
    "id": "route-north-sydney-port-hawkesbury-1",
    "lat": 46.68087568,
    "lon": -60.11132913,
    "approach": true
  },
  {
    "id": "route-north-sydney-port-hawkesbury-2",
    "lat": 46.96870583,
    "lon": -60.21619546,
    "approach": true
  },
  {
    "id": "route-north-sydney-port-hawkesbury-3",
    "lat": 47.04045926,
    "lon": -60.42733242,
    "approach": true
  },
  {
    "id": "route-north-sydney-port-hawkesbury-4",
    "lat": 47.03988265,
    "lon": -60.63846636,
    "approach": true
  },
  {
    "id": "route-north-sydney-port-hawkesbury-5",
    "lat": 46.53318701,
    "lon": -61.15745067,
    "approach": true
  },
  {
    "id": "route-north-sydney-port-hawkesbury-6",
    "lat": 46.02548633,
    "lon": -61.56328634,
    "approach": true
  },
  {
    "id": "route-north-sydney-port-hawkesbury-7",
    "lat": 45.66698773,
    "lon": -61.45165145,
    "approach": true
  },
  {
    "id": "route-port-hawkesbury-halifax-1",
    "lat": 45.80445451,
    "lon": -61.64023455,
    "approach": true
  },
  {
    "id": "route-port-hawkesbury-halifax-2",
    "lat": 45.98431735,
    "lon": -61.64107029,
    "approach": true
  },
  {
    "id": "route-port-hawkesbury-halifax-3",
    "lat": 46.88273939,
    "lon": -60.85595089,
    "approach": true
  },
  {
    "id": "route-port-hawkesbury-halifax-4",
    "lat": 47.06110517,
    "lon": -60.59019095,
    "approach": true
  },
  {
    "id": "route-port-hawkesbury-halifax-5",
    "lat": 47.05901492,
    "lon": -60.32620852,
    "approach": true
  },
  {
    "id": "route-port-hawkesbury-halifax-6",
    "lat": 46.15015459,
    "lon": -59.56467885,
    "approach": true
  },
  {
    "id": "route-port-hawkesbury-halifax-7",
    "lat": 45.79431389,
    "lon": -59.83432305,
    "approach": true
  },
  {
    "id": "route-port-hawkesbury-halifax-8",
    "lat": 45.2640076,
    "lon": -60.87112747,
    "approach": true
  },
  {
    "id": "route-port-hawkesbury-halifax-9",
    "lat": 44.53556704,
    "lon": -62.89619256,
    "approach": true
  },
  {
    "id": "route-halifax-yarmouth-canada-1",
    "lat": 44.39838267,
    "lon": -63.29826317,
    "approach": true
  },
  {
    "id": "route-halifax-yarmouth-canada-2",
    "lat": 43.30217846,
    "lon": -65.52724175,
    "approach": true
  },
  {
    "id": "route-portland-maine-boston-1",
    "lat": 43.64468023,
    "lon": -69.99340145,
    "approach": true
  },
  {
    "id": "route-portland-maine-boston-2",
    "lat": 42.38485397,
    "lon": -70.72894044,
    "approach": true
  },
  {
    "id": "route-atl-cape-cod-newport-rhode-island-1",
    "lat": 41.54774815,
    "lon": -70.42099964,
    "approach": true
  },
  {
    "id": "route-atl-cape-cod-newport-rhode-island-2",
    "lat": 41.36390575,
    "lon": -70.8982872,
    "approach": true
  },
  {
    "id": "route-atl-cape-cod-newport-rhode-island-3",
    "lat": 41.35792559,
    "lon": -71.37749917,
    "approach": true
  },
  {
    "id": "route-newport-rhode-island-new-york-1",
    "lat": 40.75514904,
    "lon": -72.07874122,
    "approach": true
  },
  {
    "id": "route-north-sydney-halifax-1",
    "lat": 46.53673536,
    "lon": -59.95472431,
    "approach": true
  },
  {
    "id": "route-north-sydney-halifax-2",
    "lat": 46.17465652,
    "lon": -59.43694606,
    "approach": true
  },
  {
    "id": "route-north-sydney-halifax-3",
    "lat": 45.27683156,
    "lon": -60.72738624,
    "approach": true
  },
  {
    "id": "route-north-sydney-halifax-4",
    "lat": 44.5242685,
    "lon": -62.99144243,
    "approach": true
  },
  {
    "id": "route-los-angeles-morro-bay-1",
    "lat": 34.35890647,
    "lon": -120.42891133,
    "approach": true
  },
  {
    "id": "route-los-angeles-morro-bay-2",
    "lat": 34.53468051,
    "lon": -120.65185749,
    "approach": true
  },
  {
    "id": "route-los-angeles-morro-bay-3",
    "lat": 34.88980147,
    "lon": -120.88143399,
    "approach": true
  },
  {
    "id": "route-morro-bay-san-francisco-1",
    "lat": 35.52904715,
    "lon": -121.33196172,
    "approach": true
  },
  {
    "id": "route-morro-bay-san-francisco-2",
    "lat": 36.42405195,
    "lon": -122.00755777,
    "approach": true
  },
  {
    "id": "route-morro-bay-san-francisco-3",
    "lat": 37.49494962,
    "lon": -122.70320742,
    "approach": true
  },
  {
    "id": "route-san-francisco-eureka-1",
    "lat": 37.96897842,
    "lon": -123.01613979,
    "approach": true
  },
  {
    "id": "route-san-francisco-eureka-2",
    "lat": 38.86357861,
    "lon": -123.71477803,
    "approach": true
  },
  {
    "id": "route-san-francisco-eureka-3",
    "lat": 40.64895729,
    "lon": -124.69271873,
    "approach": true
  },
  {
    "id": "route-eureka-astoria-1",
    "lat": 40.76326778,
    "lon": -124.23986752,
    "approach": true
  },
  {
    "id": "route-eureka-astoria-2",
    "lat": 42.85811596,
    "lon": -124.5722175,
    "approach": true
  },
  {
    "id": "route-eureka-astoria-3",
    "lat": 46.23999904,
    "lon": -124.02248449,
    "approach": true
  },
  {
    "id": "route-astoria-seattle-1",
    "lat": 46.27174788,
    "lon": -124.08697395,
    "approach": true
  },
  {
    "id": "route-astoria-seattle-2",
    "lat": 48.13936286,
    "lon": -124.74116321,
    "approach": true
  },
  {
    "id": "route-astoria-seattle-3",
    "lat": 48.42712266,
    "lon": -124.74598264,
    "approach": true
  },
  {
    "id": "route-astoria-seattle-4",
    "lat": 48.13654859,
    "lon": -122.6931159,
    "approach": true
  },
  {
    "id": "route-astoria-seattle-5",
    "lat": 47.99154709,
    "lon": -122.58891986,
    "approach": true
  },
  {
    "id": "route-astoria-seattle-6",
    "lat": 47.84513199,
    "lon": -122.37812882,
    "approach": true
  },
  {
    "id": "route-astoria-seattle-7",
    "lat": 47.70259349,
    "lon": -122.4891154,
    "approach": true
  },
  {
    "id": "route-seattle-vancouver-1",
    "lat": 47.76985461,
    "lon": -122.43667074,
    "approach": true
  },
  {
    "id": "route-seattle-vancouver-2",
    "lat": 48.12926956,
    "lon": -122.70614588,
    "approach": true
  },
  {
    "id": "route-seattle-vancouver-3",
    "lat": 48.30818848,
    "lon": -122.97750503,
    "approach": true
  },
  {
    "id": "route-seattle-vancouver-4",
    "lat": 48.4889949,
    "lon": -122.70804501,
    "approach": true
  },
  {
    "id": "route-seattle-vancouver-5",
    "lat": 48.66885755,
    "lon": -122.70900739,
    "approach": true
  },
  {
    "id": "route-seattle-vancouver-6",
    "lat": 49.02602048,
    "lon": -123.25950547,
    "approach": true
  },
  {
    "id": "route-acapulco-salina-cruz-1",
    "lat": 15.88720092,
    "lon": -97.67596174,
    "approach": true
  },
  {
    "id": "route-acapulco-salina-cruz-2",
    "lat": 15.51271351,
    "lon": -96.56018026,
    "approach": true
  },
  {
    "id": "route-acapulco-salina-cruz-3",
    "lat": 15.85512843,
    "lon": -95.61939179,
    "approach": true
  },
  {
    "id": "route-salina-cruz-puerto-quetzal-1",
    "lat": 14.10724247,
    "lon": -91.66988164,
    "approach": true
  },
  {
    "id": "route-salina-cruz-puerto-quetzal-2",
    "lat": 13.92133506,
    "lon": -91.30229932,
    "approach": true
  },
  {
    "id": "route-corinto-puerto-caldera-1",
    "lat": 9.93925068,
    "lon": -85.7291218,
    "approach": true
  },
  {
    "id": "route-corinto-puerto-caldera-2",
    "lat": 9.396487,
    "lon": -85.18502224,
    "approach": true
  },
  {
    "id": "route-puerto-caldera-golfito-1",
    "lat": 9.72106369,
    "lon": -84.74433832,
    "approach": true
  },
  {
    "id": "route-puerto-caldera-golfito-2",
    "lat": 8.82098567,
    "lon": -84.01631324,
    "approach": true
  },
  {
    "id": "route-puerto-caldera-golfito-3",
    "lat": 8.46033337,
    "lon": -83.65339423,
    "approach": true
  },
  {
    "id": "route-puerto-caldera-golfito-4",
    "lat": 8.27918158,
    "lon": -83.29046196,
    "approach": true
  },
  {
    "id": "route-golfito-puerto-armuelles-1",
    "lat": 8.42741043,
    "lon": -83.19742147,
    "approach": true
  },
  {
    "id": "route-golfito-puerto-armuelles-2",
    "lat": 7.88765231,
    "lon": -82.83426695,
    "approach": true
  },
  {
    "id": "route-puerto-armuelles-balboa-1",
    "lat": 7.67557295,
    "lon": -81.75423623,
    "approach": true
  },
  {
    "id": "route-puerto-armuelles-balboa-2",
    "lat": 7.132709,
    "lon": -80.84933871,
    "approach": true
  },
  {
    "id": "route-puerto-armuelles-balboa-3",
    "lat": 7.13181468,
    "lon": -80.66808498,
    "approach": true
  },
  {
    "id": "route-puerto-armuelles-balboa-4",
    "lat": 7.48702911,
    "lon": -79.94064628,
    "approach": true
  },
  {
    "id": "route-puerto-armuelles-balboa-5",
    "lat": 8.38315677,
    "lon": -79.5706105,
    "approach": true
  },
  {
    "id": "route-balboa-buenaventura-1",
    "lat": 3.66740098,
    "lon": -77.37018793,
    "approach": true
  },
  {
    "id": "route-buenaventura-tumaco-1",
    "lat": 2.80659789,
    "lon": -78.18710279,
    "approach": true
  },
  {
    "id": "route-buenaventura-tumaco-2",
    "lat": 2.62626611,
    "lon": -78.54699593,
    "approach": true
  },
  {
    "id": "route-buenaventura-tumaco-3",
    "lat": 2.26629572,
    "lon": -78.72651462,
    "approach": true
  },
  {
    "id": "route-tumaco-esmeraldas-1",
    "lat": 1.83239587,
    "lon": -78.95722924,
    "approach": true
  },
  {
    "id": "route-esmeraldas-manta-1",
    "lat": 0.85156905,
    "lon": -80.18965094,
    "approach": true
  },
  {
    "id": "route-manta-cabo-blanco-1",
    "lat": -0.90819701,
    "lon": -80.9308,
    "approach": true
  },
  {
    "id": "route-cabo-blanco-salaverry-1",
    "lat": -4.60016717,
    "lon": -81.45490468,
    "approach": true
  },
  {
    "id": "route-cabo-blanco-salaverry-2",
    "lat": -5.85923721,
    "lon": -81.27446052,
    "approach": true
  },
  {
    "id": "route-salaverry-chimbote-1",
    "lat": -8.7899695,
    "lon": -78.8312391,
    "approach": true
  },
  {
    "id": "route-chimbote-callao-1",
    "lat": -9.64513536,
    "lon": -78.45676776,
    "approach": true
  },
  {
    "id": "route-chimbote-callao-2",
    "lat": -11.62189482,
    "lon": -77.53778744,
    "approach": true
  },
  {
    "id": "route-callao-san-nicolas-1",
    "lat": -12.95876025,
    "lon": -76.65771125,
    "approach": true
  },
  {
    "id": "route-callao-san-nicolas-2",
    "lat": -13.85761918,
    "lon": -76.4704787,
    "approach": true
  },
  {
    "id": "route-callao-san-nicolas-3",
    "lat": -14.21675658,
    "lon": -76.28386624,
    "approach": true
  },
  {
    "id": "route-callao-san-nicolas-4",
    "lat": -14.93361177,
    "lon": -75.72278735,
    "approach": true
  },
  {
    "id": "route-san-nicolas-matarani-1",
    "lat": -15.62872459,
    "lon": -75.09896831,
    "approach": true
  },
  {
    "id": "route-matarani-arica-1",
    "lat": -17.92633536,
    "lon": -71.22443801,
    "approach": true
  },
  {
    "id": "route-arica-iquique-1",
    "lat": -19.72571262,
    "lon": -70.36651797,
    "approach": true
  },
  {
    "id": "route-iquique-antofagasta-1",
    "lat": -23.25668541,
    "lon": -70.78724331,
    "approach": true
  },
  {
    "id": "route-iquique-antofagasta-2",
    "lat": -23.61696589,
    "lon": -70.59258551,
    "approach": true
  },
  {
    "id": "route-antofagasta-caldera-chile-1",
    "lat": -24.54918909,
    "lon": -70.67035891,
    "approach": true
  },
  {
    "id": "route-caldera-chile-coquimbo-1",
    "lat": -27.22017593,
    "lon": -71.08164515,
    "approach": true
  },
  {
    "id": "route-caldera-chile-coquimbo-2",
    "lat": -29.0165605,
    "lon": -71.70194997,
    "approach": true
  },
  {
    "id": "route-coquimbo-valparaiso-1",
    "lat": -30.09345042,
    "lon": -71.58303988,
    "approach": true
  },
  {
    "id": "route-coquimbo-valparaiso-2",
    "lat": -30.63254642,
    "lon": -71.79321336,
    "approach": true
  },
  {
    "id": "route-valparaiso-talcahuano-1",
    "lat": -33.158204,
    "lon": -71.84484919,
    "approach": true
  },
  {
    "id": "route-talcahuano-corral-1",
    "lat": -36.47942791,
    "lon": -73.0683833,
    "approach": true
  },
  {
    "id": "route-talcahuano-corral-2",
    "lat": -37.19697172,
    "lon": -73.74578057,
    "approach": true
  },
  {
    "id": "route-new-york-norfolk-1",
    "lat": 39.70383073,
    "lon": -74.0987791,
    "approach": true
  },
  {
    "id": "route-new-york-norfolk-2",
    "lat": 37.1715994,
    "lon": -75.66994526,
    "approach": true
  },
  {
    "id": "route-new-york-norfolk-3",
    "lat": 36.98373619,
    "lon": -76.11553481,
    "approach": true
  },
  {
    "id": "route-new-york-norfolk-4",
    "lat": 36.97903976,
    "lon": -76.34048371,
    "approach": true
  },
  {
    "id": "route-norfolk-morehead-city-1",
    "lat": 36.96619429,
    "lon": -76.39980787,
    "approach": true
  },
  {
    "id": "route-norfolk-morehead-city-2",
    "lat": 36.96592262,
    "lon": -76.03962589,
    "approach": true
  },
  {
    "id": "route-norfolk-morehead-city-3",
    "lat": 36.8937401,
    "lon": -75.94992088,
    "approach": true
  },
  {
    "id": "route-norfolk-morehead-city-4",
    "lat": 35.59596009,
    "lon": -75.42503988,
    "approach": true
  },
  {
    "id": "route-norfolk-morehead-city-5",
    "lat": 35.23687871,
    "lon": -75.51709772,
    "approach": true
  },
  {
    "id": "route-norfolk-morehead-city-6",
    "lat": 34.52004456,
    "lon": -76.39705753,
    "approach": true
  },
  {
    "id": "route-norfolk-morehead-city-7",
    "lat": 34.59173139,
    "lon": -76.57187866,
    "approach": true
  },
  {
    "id": "route-norfolk-morehead-city-8",
    "lat": 34.66344986,
    "lon": -76.65955913,
    "approach": true
  },
  {
    "id": "route-norfolk-morehead-city-9",
    "lat": 34.73539473,
    "lon": -76.65986901,
    "approach": true
  },
  {
    "id": "route-morehead-city-charleston-1",
    "lat": 34.70586493,
    "lon": -76.64846321,
    "approach": true
  },
  {
    "id": "route-morehead-city-charleston-2",
    "lat": 33.83652416,
    "lon": -77.94858214,
    "approach": true
  },
  {
    "id": "route-morehead-city-charleston-3",
    "lat": 32.72439677,
    "lon": -79.81451248,
    "approach": true
  },
  {
    "id": "route-charleston-jacksonville-1",
    "lat": 32.60273871,
    "lon": -79.52709175,
    "approach": true
  },
  {
    "id": "route-canaveral-miami-1",
    "lat": 28.30912044,
    "lon": -80.41860004,
    "approach": true
  },
  {
    "id": "route-canaveral-miami-2",
    "lat": 26.86902099,
    "lon": -80.01809803,
    "approach": true
  },
  {
    "id": "route-miami-key-west-1",
    "lat": 25.54913778,
    "lon": -80.10606732,
    "approach": true
  },
  {
    "id": "route-miami-key-west-2",
    "lat": 25.18927509,
    "lon": -80.30482977,
    "approach": true
  },
  {
    "id": "route-miami-key-west-3",
    "lat": 24.82847938,
    "lon": -80.70059164,
    "approach": true
  },
  {
    "id": "route-miami-key-west-4",
    "lat": 24.64649051,
    "lon": -81.09547969,
    "approach": true
  },
  {
    "id": "route-miami-nassau-1",
    "lat": 25.17003786,
    "lon": -77.72117063,
    "approach": true
  },
  {
    "id": "route-nassau-matthew-town-1",
    "lat": 22.77506691,
    "lon": -74.98966891,
    "approach": true
  },
  {
    "id": "route-matthew-town-haina-1",
    "lat": 18.60919632,
    "lon": -74.66571157,
    "approach": true
  },
  {
    "id": "route-matthew-town-haina-2",
    "lat": 18.25040531,
    "lon": -74.47432363,
    "approach": true
  },
  {
    "id": "route-matthew-town-haina-3",
    "lat": 17.89220636,
    "lon": -73.5281219,
    "approach": true
  },
  {
    "id": "route-matthew-town-haina-4",
    "lat": 17.51813803,
    "lon": -71.4549879,
    "approach": true
  },
  {
    "id": "route-matthew-town-haina-5",
    "lat": 18.03929924,
    "lon": -70.31335376,
    "approach": true
  },
  {
    "id": "route-haina-san-juan-1",
    "lat": 18.0052556,
    "lon": -68.30965852,
    "approach": true
  },
  {
    "id": "route-haina-san-juan-2",
    "lat": 18.5311983,
    "lon": -67.16619284,
    "approach": true
  },
  {
    "id": "route-san-juan-st-johns-antigua-1",
    "lat": 18.50109833,
    "lon": -65.74066673,
    "approach": true
  },
  {
    "id": "route-st-johns-antigua-fort-de-france-1",
    "lat": 16.21734377,
    "lon": -61.89234499,
    "approach": true
  },
  {
    "id": "route-st-johns-antigua-fort-de-france-2",
    "lat": 14.59725912,
    "lon": -61.14912891,
    "approach": true
  },
  {
    "id": "route-fort-de-france-point-lisas-1",
    "lat": 10.98591404,
    "lon": -61.82724021,
    "approach": true
  },
  {
    "id": "route-haina-rocky-point-1",
    "lat": 18.19255704,
    "lon": -70.20113231,
    "approach": true
  },
  {
    "id": "route-haina-rocky-point-2",
    "lat": 17.46731833,
    "lon": -71.52022895,
    "approach": true
  },
  {
    "id": "route-cancun-belize-city-1",
    "lat": 18.04841235,
    "lon": -87.88317901,
    "approach": true
  },
  {
    "id": "route-cancun-belize-city-2",
    "lat": 17.32770843,
    "lon": -88.06663651,
    "approach": true
  },
  {
    "id": "route-belize-city-trujillo-honduras-1",
    "lat": 16.17798293,
    "lon": -86.51532415,
    "approach": true
  },
  {
    "id": "route-trujillo-honduras-puerto-limon-1",
    "lat": 15.96665414,
    "lon": -86.14411863,
    "approach": true
  },
  {
    "id": "route-trujillo-honduras-puerto-limon-2",
    "lat": 16.14651784,
    "lon": -85.76978717,
    "approach": true
  },
  {
    "id": "route-trujillo-honduras-puerto-limon-3",
    "lat": 15.96156561,
    "lon": -84.46041202,
    "approach": true
  },
  {
    "id": "route-trujillo-honduras-puerto-limon-4",
    "lat": 15.23173634,
    "lon": -83.34726809,
    "approach": true
  },
  {
    "id": "route-trujillo-honduras-puerto-limon-5",
    "lat": 14.86743695,
    "lon": -82.97961929,
    "approach": true
  },
  {
    "id": "route-colon-cartagena-colombia-1",
    "lat": 9.78077698,
    "lon": -79.37745246,
    "approach": true
  },
  {
    "id": "route-montevideo-rio-grande-1",
    "lat": -34.98203925,
    "lon": -54.96867305,
    "approach": true
  },
  {
    "id": "route-montevideo-rio-grande-2",
    "lat": -34.66478956,
    "lon": -54.13145128,
    "approach": true
  },
  {
    "id": "route-montevideo-rio-grande-3",
    "lat": -34.39718125,
    "lon": -53.76752523,
    "approach": true
  },
  {
    "id": "route-montevideo-rio-grande-4",
    "lat": -33.10946523,
    "lon": -52.62315607,
    "approach": true
  },
  {
    "id": "route-montevideo-rio-grande-5",
    "lat": -32.16589982,
    "lon": -52.08786273,
    "approach": true
  },
  {
    "id": "route-rio-grande-itajai-1",
    "lat": -32.26134029,
    "lon": -52.083333,
    "approach": true
  },
  {
    "id": "route-rio-grande-itajai-2",
    "lat": -31.53750781,
    "lon": -51.02816093,
    "approach": true
  },
  {
    "id": "route-rio-grande-itajai-3",
    "lat": -28.43659242,
    "lon": -48.60789935,
    "approach": true
  },
  {
    "id": "route-rio-grande-itajai-4",
    "lat": -27.52644482,
    "lon": -48.23301251,
    "approach": true
  },
  {
    "id": "route-rio-grande-itajai-5",
    "lat": -27.1730637,
    "lon": -48.44797656,
    "approach": true
  },
  {
    "id": "route-santos-rio-de-janeiro-1",
    "lat": -24.04832633,
    "lon": -45.31519308,
    "approach": true
  },
  {
    "id": "route-rio-de-janeiro-vitoria-1",
    "lat": -23.0071599,
    "lon": -41.97754209,
    "approach": true
  },
  {
    "id": "route-rio-de-janeiro-vitoria-2",
    "lat": -22.09792219,
    "lon": -41.01465397,
    "approach": true
  },
  {
    "id": "route-rio-de-janeiro-vitoria-3",
    "lat": -20.64403066,
    "lon": -40.07537761,
    "approach": true
  },
  {
    "id": "route-rio-de-janeiro-vitoria-4",
    "lat": -20.28803195,
    "lon": -40.27450899,
    "approach": true
  },
  {
    "id": "route-vitoria-ilheus-1",
    "lat": -20.26609551,
    "lon": -40.27698009,
    "approach": true
  },
  {
    "id": "route-vitoria-ilheus-2",
    "lat": -20.33799099,
    "lon": -40.20021548,
    "approach": true
  },
  {
    "id": "route-vitoria-ilheus-3",
    "lat": -19.40143933,
    "lon": -39.66720399,
    "approach": true
  },
  {
    "id": "route-vitoria-ilheus-4",
    "lat": -17.52764249,
    "lon": -39.0715248,
    "approach": true
  },
  {
    "id": "route-vitoria-ilheus-5",
    "lat": -15.87137852,
    "lon": -38.85918279,
    "approach": true
  },
  {
    "id": "route-vitoria-ilheus-6",
    "lat": -15.29589091,
    "lon": -38.86377196,
    "approach": true
  },
  {
    "id": "route-ilheus-salvador-1",
    "lat": -13.55499368,
    "lon": -38.65231503,
    "approach": true
  },
  {
    "id": "route-salvador-recife-1",
    "lat": -13.16878712,
    "lon": -38.53950848,
    "approach": true
  },
  {
    "id": "route-salvador-recife-2",
    "lat": -12.62861497,
    "lon": -37.98654186,
    "approach": true
  },
  {
    "id": "route-salvador-recife-3",
    "lat": -9.19295388,
    "lon": -35.26216311,
    "approach": true
  },
  {
    "id": "route-salvador-recife-4",
    "lat": -8.46960174,
    "lon": -34.90624829,
    "approach": true
  },
  {
    "id": "route-recife-natal-1",
    "lat": -7.92057854,
    "lon": -34.69406167,
    "approach": true
  },
  {
    "id": "route-recife-natal-2",
    "lat": -6.48170583,
    "lon": -34.87565787,
    "approach": true
  },
  {
    "id": "route-natal-fortaleza-1",
    "lat": -5.21271461,
    "lon": -35.35898421,
    "approach": true
  },
  {
    "id": "route-casablanca-agadir-1",
    "lat": 33.28708408,
    "lon": -8.6758427,
    "approach": true
  },
  {
    "id": "route-casablanca-agadir-2",
    "lat": 32.56052485,
    "lon": -9.307225,
    "approach": true
  },
  {
    "id": "route-casablanca-agadir-3",
    "lat": 31.2915498,
    "lon": -9.91482574,
    "approach": true
  },
  {
    "id": "route-casablanca-agadir-4",
    "lat": 30.57239865,
    "lon": -9.89701741,
    "approach": true
  },
  {
    "id": "route-agadir-laayoune-1",
    "lat": 27.86966239,
    "lon": -13.13431449,
    "approach": true
  },
  {
    "id": "route-laayoune-dakhla-1",
    "lat": 26.36031549,
    "lon": -14.47235346,
    "approach": true
  },
  {
    "id": "route-laayoune-dakhla-2",
    "lat": 23.64313532,
    "lon": -16.01979319,
    "approach": true
  },
  {
    "id": "route-dakhla-nouadhibou-1",
    "lat": 21.71721037,
    "lon": -17.11245798,
    "approach": true
  },
  {
    "id": "route-dakhla-nouadhibou-2",
    "lat": 20.63812066,
    "lon": -17.10369476,
    "approach": true
  },
  {
    "id": "route-dakhla-nouadhibou-3",
    "lat": 20.819253,
    "lon": -16.9127857,
    "approach": true
  },
  {
    "id": "route-nouakchott-dakar-1",
    "lat": 14.79032599,
    "lon": -17.59170796,
    "approach": true
  },
  {
    "id": "route-banjul-conakry-1",
    "lat": 13.65212008,
    "lon": -16.58955382,
    "approach": true
  },
  {
    "id": "route-banjul-conakry-2",
    "lat": 13.47218838,
    "lon": -16.77450725,
    "approach": true
  },
  {
    "id": "route-banjul-conakry-3",
    "lat": 13.11226009,
    "lon": -16.95890979,
    "approach": true
  },
  {
    "id": "route-banjul-conakry-4",
    "lat": 12.57267199,
    "lon": -16.95810491,
    "approach": true
  },
  {
    "id": "route-banjul-conakry-5",
    "lat": 11.13301172,
    "lon": -15.85650161,
    "approach": true
  },
  {
    "id": "route-freetown-monrovia-1",
    "lat": 8.67986278,
    "lon": -13.26515879,
    "approach": true
  },
  {
    "id": "route-freetown-monrovia-2",
    "lat": 8.32009276,
    "lon": -13.44693576,
    "approach": true
  },
  {
    "id": "route-freetown-monrovia-3",
    "lat": 7.60063772,
    "lon": -13.08370788,
    "approach": true
  },
  {
    "id": "route-monrovia-cape-palmas-1",
    "lat": 5.03301161,
    "lon": -9.21414587,
    "approach": true
  },
  {
    "id": "route-cape-palmas-sekondi-1",
    "lat": 4.32590215,
    "lon": -3.77446676,
    "approach": true
  },
  {
    "id": "route-cape-palmas-sekondi-2",
    "lat": 4.6734693,
    "lon": -1.96792213,
    "approach": true
  },
  {
    "id": "route-lagos-malabo-1",
    "lat": 4.20388754,
    "lon": 6.10460458,
    "approach": true
  },
  {
    "id": "route-malabo-bata-1",
    "lat": 3.78685343,
    "lon": 8.96359064,
    "approach": true
  },
  {
    "id": "route-bata-port-gentil-1",
    "lat": 0.96727677,
    "lon": 9.18203011,
    "approach": true
  },
  {
    "id": "route-port-gentil-pointe-noire-1",
    "lat": -0.50937034,
    "lon": 8.7704199,
    "approach": true
  },
  {
    "id": "route-port-gentil-pointe-noire-2",
    "lat": -0.68923101,
    "lon": 8.59054281,
    "approach": true
  },
  {
    "id": "route-port-gentil-pointe-noire-3",
    "lat": -1.94823372,
    "lon": 9.31028076,
    "approach": true
  },
  {
    "id": "route-port-gentil-pointe-noire-4",
    "lat": -2.48771626,
    "lon": 9.67044084,
    "approach": true
  },
  {
    "id": "route-pointe-noire-luanda-1",
    "lat": -7.97337796,
    "lon": 12.95056026,
    "approach": true
  },
  {
    "id": "route-pointe-noire-luanda-2",
    "lat": -8.69188518,
    "lon": 13.31602741,
    "approach": true
  },
  {
    "id": "route-luanda-lobito-1",
    "lat": -8.73690391,
    "lon": 13.29092874,
    "approach": true
  },
  {
    "id": "route-luanda-lobito-2",
    "lat": -8.80884952,
    "lon": 13.14533411,
    "approach": true
  },
  {
    "id": "route-luanda-lobito-3",
    "lat": -9.09652574,
    "lon": 12.92669174,
    "approach": true
  },
  {
    "id": "route-lobito-namibe-1",
    "lat": -12.69249762,
    "lon": 12.98134207,
    "approach": true
  },
  {
    "id": "route-lobito-namibe-2",
    "lat": -13.23106584,
    "lon": 12.6106392,
    "approach": true
  },
  {
    "id": "route-lobito-namibe-3",
    "lat": -13.59007162,
    "lon": 12.42426266,
    "approach": true
  },
  {
    "id": "route-namibe-walvis-bay-1",
    "lat": -15.71384105,
    "lon": 11.71734191,
    "approach": true
  },
  {
    "id": "route-namibe-walvis-bay-2",
    "lat": -16.43289588,
    "lon": 11.52850327,
    "approach": true
  },
  {
    "id": "route-namibe-walvis-bay-3",
    "lat": -17.87219211,
    "lon": 11.71320291,
    "approach": true
  },
  {
    "id": "route-namibe-walvis-bay-4",
    "lat": -19.13148426,
    "lon": 12.28125868,
    "approach": true
  },
  {
    "id": "route-namibe-walvis-bay-5",
    "lat": -22.71548227,
    "lon": 14.4242133,
    "approach": true
  },
  {
    "id": "route-walvis-bay-luderitz-1",
    "lat": -22.76551787,
    "lon": 14.4520539,
    "approach": true
  },
  {
    "id": "route-walvis-bay-luderitz-2",
    "lat": -23.66471688,
    "lon": 14.25568154,
    "approach": true
  },
  {
    "id": "route-walvis-bay-luderitz-3",
    "lat": -26.18242311,
    "lon": 14.8527,
    "approach": true
  },
  {
    "id": "route-luderitz-saldanha-1",
    "lat": -26.61646445,
    "lon": 14.93250491,
    "approach": true
  },
  {
    "id": "route-luderitz-saldanha-2",
    "lat": -32.88861863,
    "lon": 17.69909089,
    "approach": true
  },
  {
    "id": "route-luderitz-saldanha-3",
    "lat": -33.06434523,
    "lon": 17.91813652,
    "approach": true
  },
  {
    "id": "route-saldanha-cape-town-1",
    "lat": -33.22893096,
    "lon": 17.93414603,
    "approach": true
  },
  {
    "id": "route-suez-hurghada-1",
    "lat": 29.69865971,
    "lon": 32.57,
    "approach": true
  },
  {
    "id": "route-suez-hurghada-2",
    "lat": 27.53471786,
    "lon": 33.78671888,
    "approach": true
  },
  {
    "id": "route-suez-hurghada-3",
    "lat": 27.35286829,
    "lon": 33.98711243,
    "approach": true
  },
  {
    "id": "route-hurghada-al-qusayr-1",
    "lat": 26.46564094,
    "lon": 34.24568582,
    "approach": true
  },
  {
    "id": "route-al-qusayr-yanbu-1",
    "lat": 24.11405523,
    "lon": 37.65697382,
    "approach": true
  },
  {
    "id": "route-jeddah-jazan-1",
    "lat": 21.11015828,
    "lon": 38.90337484,
    "approach": true
  },
  {
    "id": "route-jeddah-jazan-2",
    "lat": 17.6698335,
    "lon": 41.92578008,
    "approach": true
  },
  {
    "id": "route-jazan-al-mukha-1",
    "lat": 15.84438423,
    "lon": 42.28620765,
    "approach": true
  },
  {
    "id": "route-al-mukha-aden-1",
    "lat": 12.59714321,
    "lon": 43.39917736,
    "approach": true
  },
  {
    "id": "route-al-mukha-aden-2",
    "lat": 12.59302007,
    "lon": 44.68923184,
    "approach": true
  },
  {
    "id": "route-aden-mukalla-1",
    "lat": 13.96499205,
    "lon": 48.5546466,
    "approach": true
  },
  {
    "id": "route-aden-mukalla-2",
    "lat": 14.13941218,
    "lon": 48.92822142,
    "approach": true
  },
  {
    "id": "route-mukalla-salalah-1",
    "lat": 15.18858181,
    "lon": 51.3531726,
    "approach": true
  },
  {
    "id": "route-mukalla-salalah-2",
    "lat": 15.71445014,
    "lon": 52.47983114,
    "approach": true
  },
  {
    "id": "route-salalah-duqm-1",
    "lat": 16.90683928,
    "lon": 54.96662085,
    "approach": true
  },
  {
    "id": "route-salalah-duqm-2",
    "lat": 18.85148366,
    "lon": 57.82738565,
    "approach": true
  },
  {
    "id": "route-salalah-duqm-3",
    "lat": 19.20717603,
    "lon": 58.02570467,
    "approach": true
  },
  {
    "id": "route-duqm-muscat-1",
    "lat": 20.21895418,
    "lon": 58.4752119,
    "approach": true
  },
  {
    "id": "route-duqm-muscat-2",
    "lat": 21.82876724,
    "lon": 59.64567738,
    "approach": true
  },
  {
    "id": "route-duqm-muscat-3",
    "lat": 22.18616574,
    "lon": 59.84460401,
    "approach": true
  },
  {
    "id": "route-duqm-muscat-4",
    "lat": 22.54578883,
    "lon": 59.84991936,
    "approach": true
  },
  {
    "id": "route-duqm-muscat-5",
    "lat": 23.45418535,
    "lon": 58.8840586,
    "approach": true
  },
  {
    "id": "route-fujairah-dubai-1",
    "lat": 26.28309907,
    "lon": 56.59352782,
    "approach": true
  },
  {
    "id": "route-fujairah-dubai-2",
    "lat": 26.463099,
    "lon": 56.3929366,
    "approach": true
  },
  {
    "id": "route-suez-sharm-el-sheikh-1",
    "lat": 29.69865971,
    "lon": 32.57,
    "approach": true
  },
  {
    "id": "route-suez-sharm-el-sheikh-2",
    "lat": 28.25723468,
    "lon": 33.38669022,
    "approach": true
  },
  {
    "id": "route-suez-sharm-el-sheikh-3",
    "lat": 27.7102126,
    "lon": 34.19498185,
    "approach": true
  },
  {
    "id": "route-suez-sharm-el-sheikh-4",
    "lat": 27.707572,
    "lon": 34.39807437,
    "approach": true
  },
  {
    "id": "route-sharm-el-sheikh-eilat-1",
    "lat": 27.81156879,
    "lon": 34.69723387,
    "approach": true
  },
  {
    "id": "route-sharm-el-sheikh-eilat-2",
    "lat": 28.17174262,
    "lon": 34.49455832,
    "approach": true
  },
  {
    "id": "route-sharm-el-sheikh-hurghada-1",
    "lat": 27.63230041,
    "lon": 34.2905248,
    "approach": true
  },
  {
    "id": "route-duba-yanbu-1",
    "lat": 25.33288574,
    "lon": 36.80530613,
    "approach": true
  },
  {
    "id": "route-duba-yanbu-2",
    "lat": 24.24763808,
    "lon": 37.38613406,
    "approach": true
  },
  {
    "id": "route-karachi-okha-1",
    "lat": 23.85202535,
    "lon": 67.37663788,
    "approach": true
  },
  {
    "id": "route-okha-veraval-1",
    "lat": 22.31907295,
    "lon": 68.89120842,
    "approach": true
  },
  {
    "id": "route-okha-veraval-2",
    "lat": 21.41884054,
    "lon": 69.66522879,
    "approach": true
  },
  {
    "id": "route-mumbai-mormugao-1",
    "lat": 16.51992538,
    "lon": 73.19511283,
    "approach": true
  },
  {
    "id": "route-new-mangalore-kochi-1",
    "lat": 10.23240548,
    "lon": 76.03565004,
    "approach": true
  },
  {
    "id": "route-kochi-colombo-1",
    "lat": 9.43040626,
    "lon": 76.22634116,
    "approach": true
  },
  {
    "id": "route-kochi-colombo-2",
    "lat": 8.53066231,
    "lon": 76.7719127,
    "approach": true
  },
  {
    "id": "route-kochi-colombo-3",
    "lat": 8.17019697,
    "lon": 77.1347345,
    "approach": true
  },
  {
    "id": "route-sabang-belawan-1",
    "lat": 5.37178878,
    "lon": 97.30387347,
    "approach": true
  },
  {
    "id": "route-sabang-belawan-2",
    "lat": 5.19061626,
    "lon": 97.66447163,
    "approach": true
  },
  {
    "id": "route-belawan-penang-1",
    "lat": 5.31556603,
    "lon": 100.37266719,
    "approach": true
  },
  {
    "id": "route-penang-port-klang-1",
    "lat": 5.05693803,
    "lon": 100.3183826,
    "approach": true
  },
  {
    "id": "route-penang-port-klang-2",
    "lat": 4.15759302,
    "lon": 100.49870674,
    "approach": true
  },
  {
    "id": "route-penang-port-klang-3",
    "lat": 2.89820831,
    "lon": 101.03852845,
    "approach": true
  },
  {
    "id": "route-port-klang-singapore-1",
    "lat": 2.79786367,
    "lon": 101.16161223,
    "approach": true
  },
  {
    "id": "route-port-klang-singapore-2",
    "lat": 1.35751215,
    "lon": 103.32048774,
    "approach": true
  },
  {
    "id": "route-port-klang-singapore-3",
    "lat": 1.17712171,
    "lon": 103.68003307,
    "approach": true
  },
  {
    "id": "route-phuket-penang-1",
    "lat": 5.45722145,
    "lon": 100.38097441,
    "approach": true
  },
  {
    "id": "route-corral-puerto-montt-1",
    "lat": -39.95955949,
    "lon": -73.70422832,
    "approach": true
  },
  {
    "id": "route-corral-puerto-montt-2",
    "lat": -39.98645922,
    "lon": -73.73953772,
    "approach": true
  },
  {
    "id": "route-corral-puerto-montt-3",
    "lat": -41.01095926,
    "lon": -73.95836529,
    "approach": true
  },
  {
    "id": "route-corral-puerto-montt-4",
    "lat": -41.74002669,
    "lon": -73.78319429,
    "approach": true
  },
  {
    "id": "route-corral-puerto-montt-5",
    "lat": -41.76709999,
    "lon": -73.74716398,
    "approach": true
  },
  {
    "id": "route-corral-puerto-montt-6",
    "lat": -41.82140742,
    "lon": -73.49403433,
    "approach": true
  },
  {
    "id": "route-corral-puerto-montt-7",
    "lat": -41.76709999,
    "lon": -73.16851289,
    "approach": true
  },
  {
    "id": "route-corral-puerto-montt-8",
    "lat": -41.73992174,
    "lon": -73.09633232,
    "approach": true
  },
  {
    "id": "route-corral-puerto-montt-9",
    "lat": -41.71282653,
    "lon": -73.06034706,
    "approach": true
  },
  {
    "id": "route-puerto-montt-puerto-chacabuco-1",
    "lat": -43.82936658,
    "lon": -73.25961641,
    "approach": true
  },
  {
    "id": "route-puerto-montt-puerto-chacabuco-2",
    "lat": -44.54765993,
    "lon": -73.5659474,
    "approach": true
  },
  {
    "id": "route-puerto-montt-puerto-chacabuco-3",
    "lat": -45.26756917,
    "lon": -73.47127201,
    "approach": true
  },
  {
    "id": "route-puerto-montt-puerto-chacabuco-4",
    "lat": -45.3399057,
    "lon": -73.36962841,
    "approach": true
  },
  {
    "id": "route-puerto-montt-puerto-chacabuco-5",
    "lat": -45.26826623,
    "lon": -73.26696838,
    "approach": true
  },
  {
    "id": "route-puerto-chacabuco-pac-chile-south-1",
    "lat": -45.28517891,
    "lon": -73.25050913,
    "approach": true
  },
  {
    "id": "route-puerto-chacabuco-pac-chile-south-2",
    "lat": -45.44473192,
    "lon": -73.71295174,
    "approach": true
  },
  {
    "id": "route-puerto-chacabuco-pac-chile-south-3",
    "lat": -45.71264003,
    "lon": -73.94865706,
    "approach": true
  },
  {
    "id": "route-puerto-chacabuco-pac-chile-south-4",
    "lat": -45.78940688,
    "lon": -74.33705158,
    "approach": true
  },
  {
    "id": "route-puerto-chacabuco-pac-chile-south-5",
    "lat": -45.78841824,
    "lon": -74.41442076,
    "approach": true
  },
  {
    "id": "route-puerto-chacabuco-pac-chile-south-6",
    "lat": -45.8121115,
    "lon": -74.64735239,
    "approach": true
  },
  {
    "id": "route-puerto-chacabuco-pac-chile-south-7",
    "lat": -45.83788453,
    "lon": -74.72562679,
    "approach": true
  },
  {
    "id": "route-puerto-chacabuco-pac-chile-south-8",
    "lat": -45.99908594,
    "lon": -74.76975763,
    "approach": true
  },
  {
    "id": "route-puerto-chacabuco-pac-chile-south-9",
    "lat": -46.05239099,
    "lon": -74.81043648,
    "approach": true
  },
  {
    "id": "route-puerto-chacabuco-pac-chile-south-10",
    "lat": -46.23560275,
    "lon": -75.12889968,
    "approach": true
  },
  {
    "id": "route-pac-chile-south-puerto-natales-1",
    "lat": -50.7525536,
    "lon": -75.48450614,
    "approach": true
  },
  {
    "id": "route-pac-chile-south-puerto-natales-2",
    "lat": -51.36948877,
    "lon": -74.28404305,
    "approach": true
  },
  {
    "id": "route-pac-chile-south-puerto-natales-3",
    "lat": -51.42203369,
    "lon": -74.23654126,
    "approach": true
  },
  {
    "id": "route-pac-chile-south-puerto-natales-4",
    "lat": -51.73099007,
    "lon": -73.77534212,
    "approach": true
  },
  {
    "id": "route-pac-chile-south-puerto-natales-5",
    "lat": -52.04789999,
    "lon": -73.57030961,
    "approach": true
  },
  {
    "id": "route-pac-chile-south-puerto-natales-6",
    "lat": -52.17436976,
    "lon": -73.33775797,
    "approach": true
  },
  {
    "id": "route-pac-chile-south-puerto-natales-7",
    "lat": -52.17269585,
    "lon": -73.29389046,
    "approach": true
  },
  {
    "id": "route-pac-chile-south-puerto-natales-8",
    "lat": -51.94530011,
    "lon": -73.01060858,
    "approach": true
  },
  {
    "id": "route-pac-chile-south-puerto-natales-9",
    "lat": -51.76147625,
    "lon": -72.50664268,
    "approach": true
  },
  {
    "id": "route-puerto-natales-punta-arenas-1",
    "lat": -51.74184198,
    "lon": -72.54177745,
    "approach": true
  },
  {
    "id": "route-puerto-natales-punta-arenas-2",
    "lat": -52.14472691,
    "lon": -73.27386539,
    "approach": true
  },
  {
    "id": "route-puerto-natales-punta-arenas-3",
    "lat": -52.17145266,
    "lon": -73.31825297,
    "approach": true
  },
  {
    "id": "route-puerto-natales-punta-arenas-4",
    "lat": -52.02430126,
    "lon": -73.73981491,
    "approach": true
  },
  {
    "id": "route-puerto-natales-punta-arenas-5",
    "lat": -52.32171101,
    "lon": -73.67377512,
    "approach": true
  },
  {
    "id": "route-puerto-natales-punta-arenas-6",
    "lat": -52.5646271,
    "lon": -73.66481807,
    "approach": true
  },
  {
    "id": "route-puerto-natales-punta-arenas-7",
    "lat": -52.60033166,
    "lon": -73.69528629,
    "approach": true
  },
  {
    "id": "route-puerto-natales-punta-arenas-8",
    "lat": -52.70810067,
    "lon": -73.7127872,
    "approach": true
  },
  {
    "id": "route-puerto-natales-punta-arenas-9",
    "lat": -52.79929087,
    "lon": -73.56632837,
    "approach": true
  },
  {
    "id": "route-puerto-natales-punta-arenas-10",
    "lat": -52.8995861,
    "lon": -73.37470498,
    "approach": true
  },
  {
    "id": "route-puerto-natales-punta-arenas-11",
    "lat": -52.96224303,
    "lon": -73.42059078,
    "approach": true
  },
  {
    "id": "route-puerto-natales-punta-arenas-12",
    "lat": -52.98891242,
    "lon": -73.46590382,
    "approach": true
  },
  {
    "id": "route-puerto-natales-punta-arenas-13",
    "lat": -53.16082268,
    "lon": -73.30430495,
    "approach": true
  },
  {
    "id": "route-puerto-natales-punta-arenas-14",
    "lat": -53.44144487,
    "lon": -72.79554824,
    "approach": true
  },
  {
    "id": "route-puerto-natales-punta-arenas-15",
    "lat": -53.5584313,
    "lon": -72.49329733,
    "approach": true
  },
  {
    "id": "route-puerto-natales-punta-arenas-16",
    "lat": -53.72777411,
    "lon": -71.99128028,
    "approach": true
  },
  {
    "id": "route-puerto-natales-punta-arenas-17",
    "lat": -53.83327692,
    "lon": -71.62404579,
    "approach": true
  },
  {
    "id": "route-puerto-natales-punta-arenas-18",
    "lat": -53.89321214,
    "lon": -71.30219377,
    "approach": true
  },
  {
    "id": "route-puerto-natales-punta-arenas-19",
    "lat": -53.85605832,
    "lon": -71.19662199,
    "approach": true
  },
  {
    "id": "route-puerto-natales-punta-arenas-20",
    "lat": -53.76329553,
    "lon": -70.97151926,
    "approach": true
  },
  {
    "id": "route-puerto-natales-punta-arenas-21",
    "lat": -53.57387856,
    "lon": -70.93338728,
    "approach": true
  },
  {
    "id": "route-punta-arenas-ushuaia-1",
    "lat": -53.91711976,
    "lon": -70.8941226,
    "approach": true
  },
  {
    "id": "route-punta-arenas-ushuaia-2",
    "lat": -54.06094917,
    "lon": -71.01669878,
    "approach": true
  },
  {
    "id": "route-punta-arenas-ushuaia-3",
    "lat": -54.20490228,
    "lon": -70.8941226,
    "approach": true
  },
  {
    "id": "route-punta-arenas-ushuaia-4",
    "lat": -54.42048921,
    "lon": -71.14141148,
    "approach": true
  },
  {
    "id": "route-punta-arenas-ushuaia-5",
    "lat": -54.34779577,
    "lon": -71.38783248,
    "approach": true
  },
  {
    "id": "route-punta-arenas-ushuaia-6",
    "lat": -54.3465486,
    "lon": -71.63467251,
    "approach": true
  },
  {
    "id": "route-punta-arenas-ushuaia-7",
    "lat": -54.48642351,
    "lon": -72.13260993,
    "approach": true
  },
  {
    "id": "route-punta-arenas-ushuaia-8",
    "lat": -54.63148333,
    "lon": -72.01270039,
    "approach": true
  },
  {
    "id": "route-punta-arenas-ushuaia-9",
    "lat": -54.92277354,
    "lon": -71.5199987,
    "approach": true
  },
  {
    "id": "route-punta-arenas-ushuaia-10",
    "lat": -55.42386033,
    "lon": -69.88013294,
    "approach": true
  },
  {
    "id": "route-punta-arenas-ushuaia-11",
    "lat": -55.75904012,
    "lon": -68.20922844,
    "approach": true
  },
  {
    "id": "route-punta-arenas-ushuaia-12",
    "lat": -55.68145048,
    "lon": -67.95916416,
    "approach": true
  },
  {
    "id": "route-punta-arenas-ushuaia-13",
    "lat": -55.53467113,
    "lon": -67.8428183,
    "approach": true
  },
  {
    "id": "route-punta-arenas-ushuaia-14",
    "lat": -54.97089951,
    "lon": -68.38714844,
    "approach": true
  },
  {
    "id": "route-punta-arenas-ushuaia-15",
    "lat": -54.89900684,
    "lon": -68.39159667,
    "approach": true
  },
  {
    "id": "route-puerto-williams-cape-horn-1",
    "lat": -54.8924623,
    "lon": -67.28725327,
    "approach": true
  },
  {
    "id": "route-puerto-williams-cape-horn-2",
    "lat": -55.07111324,
    "lon": -66.97171154,
    "approach": true
  },
  {
    "id": "route-puerto-williams-cape-horn-3",
    "lat": -55.43204816,
    "lon": -67.28299727,
    "approach": true
  },
  {
    "id": "route-puerto-williams-cape-horn-4",
    "lat": -55.61067975,
    "lon": -66.96311025,
    "approach": true
  },
  {
    "id": "route-puerto-williams-cape-horn-5",
    "lat": -55.97163381,
    "lon": -67.2786043,
    "approach": true
  },
  {
    "id": "route-cape-horn-fildes-bay-1",
    "lat": -62.06430548,
    "lon": -59.53797309,
    "approach": true
  },
  {
    "id": "route-fildes-bay-deception-island-1",
    "lat": -62.31916907,
    "lon": -58.80484903,
    "approach": true
  },
  {
    "id": "route-fildes-bay-deception-island-2",
    "lat": -63.03155368,
    "lon": -60.38760244,
    "approach": true
  },
  {
    "id": "route-deception-island-port-lockroy-1",
    "lat": -63.01500484,
    "lon": -60.53634908,
    "approach": true
  },
  {
    "id": "route-deception-island-port-lockroy-2",
    "lat": -64.3737831,
    "lon": -62.17514447,
    "approach": true
  },
  {
    "id": "route-deception-island-port-lockroy-3",
    "lat": -64.52244999,
    "lon": -62.53910254,
    "approach": true
  },
  {
    "id": "route-deception-island-port-lockroy-4",
    "lat": -64.76201363,
    "lon": -63.33687629,
    "approach": true
  },
  {
    "id": "route-deception-island-port-lockroy-5",
    "lat": -64.794793,
    "lon": -63.50924572,
    "approach": true
  },
  {
    "id": "route-montevideo-bahia-blanca-1",
    "lat": -36.93915824,
    "lon": -56.66998078,
    "approach": true
  },
  {
    "id": "route-montevideo-bahia-blanca-2",
    "lat": -38.19142374,
    "lon": -57.59241599,
    "approach": true
  },
  {
    "id": "route-montevideo-bahia-blanca-3",
    "lat": -38.71276327,
    "lon": -58.75408452,
    "approach": true
  },
  {
    "id": "route-montevideo-bahia-blanca-4",
    "lat": -39.16393678,
    "lon": -61.55356732,
    "approach": true
  },
  {
    "id": "route-bahia-blanca-puerto-madryn-1",
    "lat": -39.38677252,
    "lon": -62.01443903,
    "approach": true
  },
  {
    "id": "route-bahia-blanca-puerto-madryn-2",
    "lat": -40.46595152,
    "lon": -62.01076932,
    "approach": true
  },
  {
    "id": "route-bahia-blanca-puerto-madryn-3",
    "lat": -42.79821868,
    "lon": -63.47187188,
    "approach": true
  },
  {
    "id": "route-bahia-blanca-puerto-madryn-4",
    "lat": -42.97208039,
    "lon": -63.96652993,
    "approach": true
  },
  {
    "id": "route-puerto-madryn-puerto-deseado-1",
    "lat": -42.91315582,
    "lon": -64.23663163,
    "approach": true
  },
  {
    "id": "route-puerto-madryn-puerto-deseado-2",
    "lat": -47.59168629,
    "lon": -65.23977848,
    "approach": true
  },
  {
    "id": "route-puerto-deseado-rio-gallegos-1",
    "lat": -47.74527267,
    "lon": -65.93311669,
    "approach": true
  },
  {
    "id": "route-puerto-deseado-rio-gallegos-2",
    "lat": -47.77224528,
    "lon": -65.8929732,
    "approach": true
  },
  {
    "id": "route-puerto-deseado-rio-gallegos-3",
    "lat": -47.96093378,
    "lon": -65.73166735,
    "approach": true
  },
  {
    "id": "route-rio-gallegos-punta-arenas-1",
    "lat": -52.23109239,
    "lon": -68.26632359,
    "approach": true
  },
  {
    "id": "route-rio-gallegos-punta-arenas-2",
    "lat": -52.37561552,
    "lon": -68.38187816,
    "approach": true
  },
  {
    "id": "route-rio-gallegos-punta-arenas-3",
    "lat": -52.4484911,
    "lon": -68.61699421,
    "approach": true
  },
  {
    "id": "route-rio-gallegos-punta-arenas-4",
    "lat": -52.44755831,
    "lon": -69.56131687,
    "approach": true
  },
  {
    "id": "route-rio-gallegos-punta-arenas-5",
    "lat": -52.59080004,
    "lon": -69.68166336,
    "approach": true
  },
  {
    "id": "route-rio-gallegos-punta-arenas-6",
    "lat": -52.72833771,
    "lon": -70.39673449,
    "approach": true
  },
  {
    "id": "route-buenos-aires-bahia-blanca-1",
    "lat": -34.99758207,
    "lon": -57.44836993,
    "approach": true
  },
  {
    "id": "route-buenos-aires-bahia-blanca-2",
    "lat": -35.5331654,
    "lon": -57.00051889,
    "approach": true
  },
  {
    "id": "route-buenos-aires-bahia-blanca-3",
    "lat": -36.78631206,
    "lon": -56.5302861,
    "approach": true
  },
  {
    "id": "route-buenos-aires-bahia-blanca-4",
    "lat": -38.23638603,
    "lon": -57.64011588,
    "approach": true
  },
  {
    "id": "route-buenos-aires-bahia-blanca-5",
    "lat": -38.77595599,
    "lon": -59.01818791,
    "approach": true
  },
  {
    "id": "route-buenos-aires-bahia-blanca-6",
    "lat": -39.08935883,
    "lon": -61.7999411,
    "approach": true
  },
  {
    "id": "route-cadiz-lisbon-1",
    "lat": 36.86865582,
    "lon": -8.60762908,
    "approach": true
  },
  {
    "id": "route-cadiz-lisbon-2",
    "lat": 37.03913952,
    "lon": -9.06345934,
    "approach": true
  },
  {
    "id": "route-lisbon-porto-1",
    "lat": 38.64403098,
    "lon": -9.57518915,
    "approach": true
  },
  {
    "id": "route-lisbon-porto-2",
    "lat": 39.72344114,
    "lon": -9.34490123,
    "approach": true
  },
  {
    "id": "route-porto-vigo-1",
    "lat": 42.05906105,
    "lon": -8.99405438,
    "approach": true
  },
  {
    "id": "route-vigo-a-coruna-1",
    "lat": 42.38386303,
    "lon": -9.06030452,
    "approach": true
  },
  {
    "id": "route-vigo-a-coruna-2",
    "lat": 42.92267157,
    "lon": -9.30803746,
    "approach": true
  },
  {
    "id": "route-vigo-a-coruna-3",
    "lat": 43.10253141,
    "lon": -9.30947096,
    "approach": true
  },
  {
    "id": "route-vigo-a-coruna-4",
    "lat": 43.28317814,
    "lon": -9.06385981,
    "approach": true
  },
  {
    "id": "route-vigo-a-coruna-5",
    "lat": 43.46304114,
    "lon": -8.56901011,
    "approach": true
  },
  {
    "id": "route-a-coruna-brest-1",
    "lat": 43.60134029,
    "lon": -8.37,
    "approach": true
  },
  {
    "id": "route-brest-cork-1",
    "lat": 48.33393736,
    "lon": -4.92156372,
    "approach": true
  },
  {
    "id": "route-brest-cork-2",
    "lat": 50.82495846,
    "lon": -7.21329853,
    "approach": true
  },
  {
    "id": "route-cork-killybegs-1",
    "lat": 51.56830333,
    "lon": -8.52936563,
    "approach": true
  },
  {
    "id": "route-cork-killybegs-2",
    "lat": 51.37992951,
    "lon": -9.68094776,
    "approach": true
  },
  {
    "id": "route-cork-killybegs-3",
    "lat": 51.55120093,
    "lon": -10.26505118,
    "approach": true
  },
  {
    "id": "route-cork-killybegs-4",
    "lat": 52.08511849,
    "lon": -10.58202723,
    "approach": true
  },
  {
    "id": "route-cork-killybegs-5",
    "lat": 54.24781567,
    "lon": -10.39451029,
    "approach": true
  },
  {
    "id": "route-killybegs-stornoway-1",
    "lat": 54.57002379,
    "lon": -8.77883867,
    "approach": true
  },
  {
    "id": "route-killybegs-stornoway-2",
    "lat": 54.92854496,
    "lon": -9.0946273,
    "approach": true
  },
  {
    "id": "route-killybegs-stornoway-3",
    "lat": 57.43743646,
    "lon": -6.79818998,
    "approach": true
  },
  {
    "id": "route-killybegs-stornoway-4",
    "lat": 57.61723967,
    "lon": -6.79002145,
    "approach": true
  },
  {
    "id": "route-killybegs-stornoway-5",
    "lat": 57.96629346,
    "lon": -6.09579989,
    "approach": true
  },
  {
    "id": "route-stornoway-torshavn-1",
    "lat": 58.13806955,
    "lon": -6.00926567,
    "approach": true
  },
  {
    "id": "route-stornoway-torshavn-2",
    "lat": 61.55594117,
    "lon": -6.35,
    "approach": true
  },
  {
    "id": "route-torshavn-hofn-1",
    "lat": 61.95845955,
    "lon": -6.31157668,
    "approach": true
  },
  {
    "id": "route-torshavn-hofn-2",
    "lat": 62.67790181,
    "lon": -7.08603703,
    "approach": true
  },
  {
    "id": "route-hofn-vestmannaeyjar-1",
    "lat": 63.63464296,
    "lon": -17.22537847,
    "approach": true
  },
  {
    "id": "route-hofn-vestmannaeyjar-2",
    "lat": 63.23286626,
    "lon": -19.19615519,
    "approach": true
  },
  {
    "id": "route-vestmannaeyjar-reykjavik-1",
    "lat": 63.73816327,
    "lon": -22.70176175,
    "approach": true
  },
  {
    "id": "route-vestmannaeyjar-reykjavik-2",
    "lat": 63.91041076,
    "lon": -23.12605762,
    "approach": true
  },
  {
    "id": "route-vestmannaeyjar-reykjavik-3",
    "lat": 64.09760451,
    "lon": -22.73319899,
    "approach": true
  },
  {
    "id": "route-reykjavik-isafjordur-1",
    "lat": 64.52024821,
    "lon": -23.73483207,
    "approach": true
  },
  {
    "id": "route-reykjavik-isafjordur-2",
    "lat": 65.40696452,
    "lon": -24.65589812,
    "approach": true
  },
  {
    "id": "route-reykjavik-isafjordur-3",
    "lat": 66.13838044,
    "lon": -23.84063111,
    "approach": true
  },
  {
    "id": "route-reykjavik-isafjordur-4",
    "lat": 66.32262224,
    "lon": -23.40568014,
    "approach": true
  },
  {
    "id": "route-isafjordur-tasiilaq-1",
    "lat": 66.31069741,
    "lon": -23.5276747,
    "approach": true
  },
  {
    "id": "route-isafjordur-tasiilaq-2",
    "lat": 65.48686464,
    "lon": -37.06752449,
    "approach": true
  },
  {
    "id": "route-prins-christian-sund-nanortalik-1",
    "lat": 59.65733939,
    "lon": -43.8230396,
    "approach": true
  },
  {
    "id": "route-nanortalik-qaqortoq-1",
    "lat": 60.66016566,
    "lon": -46.28784316,
    "approach": true
  },
  {
    "id": "route-qaqortoq-paamiut-1",
    "lat": 60.52740142,
    "lon": -46.83231468,
    "approach": true
  },
  {
    "id": "route-qaqortoq-paamiut-2",
    "lat": 60.69115396,
    "lon": -48.30616068,
    "approach": true
  },
  {
    "id": "route-qaqortoq-paamiut-3",
    "lat": 61.56655261,
    "lon": -49.50237044,
    "approach": true
  },
  {
    "id": "route-paamiut-nuuk-1",
    "lat": 63.75445695,
    "lon": -51.80064375,
    "approach": true
  },
  {
    "id": "route-nuuk-sisimiut-1",
    "lat": 63.97011808,
    "lon": -51.83219037,
    "approach": true
  },
  {
    "id": "route-nuuk-sisimiut-2",
    "lat": 64.14939946,
    "lon": -52.24470089,
    "approach": true
  },
  {
    "id": "route-nuuk-sisimiut-3",
    "lat": 66.47219858,
    "lon": -54.0848933,
    "approach": true
  },
  {
    "id": "route-sisimiut-qikiqtarjuaq-1",
    "lat": 67.8819645,
    "lon": -63.86970977,
    "approach": true
  },
  {
    "id": "route-qikiqtarjuaq-pangnirtung-1",
    "lat": 67.76039826,
    "lon": -64.05930954,
    "approach": true
  },
  {
    "id": "route-qikiqtarjuaq-pangnirtung-2",
    "lat": 66.83722343,
    "lon": -61.31488451,
    "approach": true
  },
  {
    "id": "route-qikiqtarjuaq-pangnirtung-3",
    "lat": 66.46938468,
    "lon": -60.90453517,
    "approach": true
  },
  {
    "id": "route-qikiqtarjuaq-pangnirtung-4",
    "lat": 64.88013074,
    "lon": -63.21220805,
    "approach": true
  },
  {
    "id": "route-qikiqtarjuaq-pangnirtung-5",
    "lat": 64.88196248,
    "lon": -63.6357394,
    "approach": true
  },
  {
    "id": "route-qikiqtarjuaq-pangnirtung-6",
    "lat": 65.23672624,
    "lon": -65.34725033,
    "approach": true
  },
  {
    "id": "route-qikiqtarjuaq-pangnirtung-7",
    "lat": 65.94581023,
    "lon": -66.26584789,
    "approach": true
  },
  {
    "id": "route-pangnirtung-iqaluit-1",
    "lat": 65.93241949,
    "lon": -66.29390031,
    "approach": true
  },
  {
    "id": "route-pangnirtung-iqaluit-2",
    "lat": 63.58041077,
    "lon": -63.83195666,
    "approach": true
  },
  {
    "id": "route-pangnirtung-iqaluit-3",
    "lat": 62.50179377,
    "lon": -63.90607989,
    "approach": true
  },
  {
    "id": "route-pangnirtung-iqaluit-4",
    "lat": 62.33081966,
    "lon": -64.69163367,
    "approach": true
  },
  {
    "id": "route-pangnirtung-iqaluit-5",
    "lat": 63.40064446,
    "lon": -67.86097608,
    "approach": true
  },
  {
    "id": "route-iqaluit-saglek-1",
    "lat": 62.9602978,
    "lon": -66.95348428,
    "approach": true
  },
  {
    "id": "route-iqaluit-saglek-2",
    "lat": 61.855832,
    "lon": -65.48503307,
    "approach": true
  },
  {
    "id": "route-iqaluit-saglek-3",
    "lat": 61.49653722,
    "lon": -65.52057813,
    "approach": true
  },
  {
    "id": "route-iqaluit-saglek-4",
    "lat": 60.93896873,
    "lon": -64.83270676,
    "approach": true
  },
  {
    "id": "route-saglek-nain-1",
    "lat": 58.51145938,
    "lon": -62.28126261,
    "approach": true
  },
  {
    "id": "route-saglek-nain-2",
    "lat": 57.78840958,
    "lon": -61.61332578,
    "approach": true
  },
  {
    "id": "route-saglek-nain-3",
    "lat": 57.06595921,
    "lon": -61.30234622,
    "approach": true
  },
  {
    "id": "route-saglek-nain-4",
    "lat": 56.52648178,
    "lon": -61.32137311,
    "approach": true
  },
  {
    "id": "route-saglek-nain-5",
    "lat": 56.70935788,
    "lon": -61.64267531,
    "approach": true
  },
  {
    "id": "route-nain-cartwright-1",
    "lat": 56.56072401,
    "lon": -61.41879766,
    "approach": true
  },
  {
    "id": "route-nain-cartwright-2",
    "lat": 55.96822567,
    "lon": -59.62278441,
    "approach": true
  },
  {
    "id": "route-nain-cartwright-3",
    "lat": 54.53013862,
    "lon": -57.09007749,
    "approach": true
  },
  {
    "id": "route-nain-cartwright-4",
    "lat": 53.80772688,
    "lon": -57.04841091,
    "approach": true
  },
  {
    "id": "route-nain-cartwright-5",
    "lat": 53.66891857,
    "lon": -57.18553867,
    "approach": true
  },
  {
    "id": "route-nain-cartwright-6",
    "lat": 53.5971457,
    "lon": -57.19328676,
    "approach": true
  },
  {
    "id": "route-nain-cartwright-7",
    "lat": 53.66420217,
    "lon": -57.06441786,
    "approach": true
  },
  {
    "id": "route-cartwright-st-anthony-1",
    "lat": 53.63013126,
    "lon": -57.10234096,
    "approach": true
  },
  {
    "id": "route-cartwright-st-anthony-2",
    "lat": 53.65704178,
    "lon": -57.19342247,
    "approach": true
  },
  {
    "id": "route-cartwright-st-anthony-3",
    "lat": 53.71107007,
    "lon": -57.10242845,
    "approach": true
  },
  {
    "id": "route-cartwright-st-anthony-4",
    "lat": 53.81794749,
    "lon": -56.55413103,
    "approach": true
  },
  {
    "id": "route-cartwright-st-anthony-5",
    "lat": 53.7905526,
    "lon": -56.46311461,
    "approach": true
  },
  {
    "id": "route-cartwright-st-anthony-6",
    "lat": 53.51547709,
    "lon": -55.78630734,
    "approach": true
  },
  {
    "id": "route-cartwright-st-anthony-7",
    "lat": 53.4065841,
    "lon": -55.69903489,
    "approach": true
  },
  {
    "id": "route-cartwright-st-anthony-8",
    "lat": 51.59425019,
    "lon": -55.36330936,
    "approach": true
  },
  {
    "id": "route-st-anthony-st-johns-1",
    "lat": 49.14928217,
    "lon": -53.34748701,
    "approach": true
  },
  {
    "id": "route-st-anthony-st-johns-2",
    "lat": 48.05215892,
    "lon": -52.58816874,
    "approach": true
  },
  {
    "id": "route-st-johns-saint-pierre-1",
    "lat": 47.41082593,
    "lon": -52.40232297,
    "approach": true
  },
  {
    "id": "route-st-johns-saint-pierre-2",
    "lat": 46.69137494,
    "lon": -52.93031425,
    "approach": true
  },
  {
    "id": "route-st-johns-saint-pierre-3",
    "lat": 46.5091032,
    "lon": -53.45208926,
    "approach": true
  },
  {
    "id": "route-saint-pierre-halifax-1",
    "lat": 44.54184257,
    "lon": -62.95020849,
    "approach": true
  },
  {
    "id": "route-halifax-atl-cape-sable-1",
    "lat": 44.39838267,
    "lon": -63.29826317,
    "approach": true
  },
  {
    "id": "route-boston-atl-cape-cod-1",
    "lat": 42.17264198,
    "lon": -70.17415653,
    "approach": true
  },
  {
    "id": "route-boston-atl-cape-cod-2",
    "lat": 41.99099989,
    "lon": -69.93423444,
    "approach": true
  },
  {
    "id": "route-atl-cape-cod-new-york-1",
    "lat": 40.8007508,
    "lon": -72.31397794,
    "approach": true
  },
  {
    "id": "route-brest-falmouth-1",
    "lat": 48.33393736,
    "lon": -4.92156372,
    "approach": true
  },
  {
    "id": "route-falmouth-rotterdam-1",
    "lat": 50.08312401,
    "lon": -3.91874286,
    "approach": true
  },
  {
    "id": "route-falmouth-rotterdam-2",
    "lat": 50.83578352,
    "lon": 0.94711326,
    "approach": true
  },
  {
    "id": "route-rotterdam-hamburg-1",
    "lat": 53.24567288,
    "lon": 4.8505843,
    "approach": true
  },
  {
    "id": "route-rotterdam-hamburg-2",
    "lat": 53.42289028,
    "lon": 5.15615199,
    "approach": true
  },
  {
    "id": "route-hamburg-bergen-1",
    "lat": 59.23836417,
    "lon": 5.08330845,
    "approach": true
  },
  {
    "id": "route-hamburg-bergen-2",
    "lat": 60.02854634,
    "lon": 5.00117568,
    "approach": true
  },
  {
    "id": "route-hamburg-bergen-3",
    "lat": 60.17589483,
    "lon": 5.12994539,
    "approach": true
  },
  {
    "id": "route-hamburg-bergen-4",
    "lat": 60.39141169,
    "lon": 5.10748418,
    "approach": true
  },
  {
    "id": "route-bergen-norway-lindesnes-1",
    "lat": 60.39451659,
    "lon": 5.05499519,
    "approach": true
  },
  {
    "id": "route-bergen-norway-lindesnes-2",
    "lat": 60.46622295,
    "lon": 4.90871972,
    "approach": true
  },
  {
    "id": "route-bergen-norway-lindesnes-3",
    "lat": 59.31533497,
    "lon": 5.05965167,
    "approach": true
  },
  {
    "id": "route-bergen-norway-lindesnes-4",
    "lat": 58.52333709,
    "lon": 5.61391689,
    "approach": true
  },
  {
    "id": "route-oslo-mouth-oslo-1",
    "lat": 59.56549587,
    "lon": 10.58224668,
    "approach": true
  },
  {
    "id": "route-oslo-mouth-oslo-2",
    "lat": 59.60146869,
    "lon": 10.61777228,
    "approach": true
  },
  {
    "id": "route-oslo-mouth-oslo-3",
    "lat": 59.61046189,
    "lon": 10.61777702,
    "approach": true
  },
  {
    "id": "route-oslo-mouth-oslo-4",
    "lat": 59.71837071,
    "lon": 10.54649746,
    "approach": true
  },
  {
    "id": "route-oslo-mouth-oslo-5",
    "lat": 59.85327476,
    "lon": 10.63581243,
    "approach": true
  },
  {
    "id": "route-oslo-mouth-oslo-6",
    "lat": 59.86225347,
    "lon": 10.67164414,
    "approach": true
  },
  {
    "id": "route-stornoway-bergen-1",
    "lat": 58.56548198,
    "lon": -5.24633887,
    "approach": true
  },
  {
    "id": "route-stornoway-bergen-2",
    "lat": 59.11267266,
    "lon": -3.40607108,
    "approach": true
  },
  {
    "id": "route-stornoway-bergen-3",
    "lat": 59.24254685,
    "lon": -2.83154503,
    "approach": true
  },
  {
    "id": "route-stornoway-bergen-4",
    "lat": 59.49955963,
    "lon": -1.8108796,
    "approach": true
  },
  {
    "id": "route-stornoway-bergen-5",
    "lat": 59.49462305,
    "lon": -1.66948671,
    "approach": true
  },
  {
    "id": "route-stornoway-bergen-6",
    "lat": 60.47529585,
    "lon": 4.94250422,
    "approach": true
  },
  {
    "id": "route-stornoway-bergen-7",
    "lat": 60.39236679,
    "lon": 5.06134493,
    "approach": true
  },
  {
    "id": "route-lisbon-funchal-1",
    "lat": 32.84948654,
    "lon": -16.40424421,
    "approach": true
  },
  {
    "id": "route-funchal-las-palmas-1",
    "lat": 28.62333838,
    "lon": -15.48676337,
    "approach": true
  },
  {
    "id": "route-las-palmas-dakar-1",
    "lat": 27.62125617,
    "lon": -15.20014368,
    "approach": true
  },
  {
    "id": "route-las-palmas-dakar-2",
    "lat": 21.31546533,
    "lon": -17.13669916,
    "approach": true
  },
  {
    "id": "route-las-palmas-dakar-3",
    "lat": 14.83424356,
    "lon": -17.61592393,
    "approach": true
  },
  {
    "id": "route-casablanca-las-palmas-1",
    "lat": 33.28708408,
    "lon": -8.6758427,
    "approach": true
  },
  {
    "id": "route-lisbon-ponta-delgada-1",
    "lat": 37.58158154,
    "lon": -25.08015474,
    "approach": true
  },
  {
    "id": "route-ponta-delgada-horta-1",
    "lat": 38.37610203,
    "lon": -28.42352477,
    "approach": true
  },
  {
    "id": "route-bermuda-new-york-1",
    "lat": 32.22566943,
    "lon": -65.0071611,
    "approach": true
  },
  {
    "id": "route-nassau-havana-1",
    "lat": 25.30921349,
    "lon": -78.12584994,
    "approach": true
  },
  {
    "id": "route-havana-cancun-1",
    "lat": 23.00859988,
    "lon": -83.3370539,
    "approach": true
  },
  {
    "id": "route-havana-cancun-2",
    "lat": 22.45486759,
    "lon": -84.69547335,
    "approach": true
  },
  {
    "id": "route-cancun-veracruz-1",
    "lat": 21.28952683,
    "lon": -86.55563983,
    "approach": true
  },
  {
    "id": "route-cancun-veracruz-2",
    "lat": 21.64892327,
    "lon": -87.13570008,
    "approach": true
  },
  {
    "id": "route-cancun-veracruz-3",
    "lat": 21.59106189,
    "lon": -91.1982638,
    "approach": true
  },
  {
    "id": "route-veracruz-havana-1",
    "lat": 22.81495201,
    "lon": -84.58475084,
    "approach": true
  },
  {
    "id": "route-nassau-san-juan-1",
    "lat": 23.48388263,
    "lon": -74.38857834,
    "approach": true
  },
  {
    "id": "route-nassau-san-juan-2",
    "lat": 22.55253616,
    "lon": -73.04612816,
    "approach": true
  },
  {
    "id": "route-nassau-san-juan-3",
    "lat": 20.40147448,
    "lon": -68.89133139,
    "approach": true
  },
  {
    "id": "route-san-juan-cartagena-colombia-1",
    "lat": 18.67982247,
    "lon": -66.87946343,
    "approach": true
  },
  {
    "id": "route-san-juan-cartagena-colombia-2",
    "lat": 18.31700267,
    "lon": -67.44625594,
    "approach": true
  },
  {
    "id": "route-san-juan-cartagena-colombia-3",
    "lat": 10.55515712,
    "lon": -75.60621014,
    "approach": true
  },
  {
    "id": "route-cartagena-colombia-colon-1",
    "lat": 9.75564309,
    "lon": -79.44552373,
    "approach": true
  },
  {
    "id": "route-miami-bermuda-1",
    "lat": 26.80317905,
    "lon": -78.8970327,
    "approach": true
  },
  {
    "id": "route-balboa-pac-guatemala-1",
    "lat": 8.1690675,
    "lon": -79.53,
    "approach": true
  },
  {
    "id": "route-balboa-pac-guatemala-2",
    "lat": 7.44944467,
    "lon": -79.89275213,
    "approach": true
  },
  {
    "id": "route-balboa-pac-guatemala-3",
    "lat": 7.08787369,
    "lon": -80.79853732,
    "approach": true
  },
  {
    "id": "route-balboa-pac-guatemala-4",
    "lat": 7.62343579,
    "lon": -81.70744992,
    "approach": true
  },
  {
    "id": "route-balboa-pac-guatemala-5",
    "lat": 7.97830707,
    "lon": -82.43585736,
    "approach": true
  },
  {
    "id": "route-balboa-pac-guatemala-6",
    "lat": 7.97541356,
    "lon": -82.79907353,
    "approach": true
  },
  {
    "id": "route-acapulco-manzanillo-1",
    "lat": 17.33388445,
    "lon": -101.23893972,
    "approach": true
  },
  {
    "id": "route-acapulco-manzanillo-2",
    "lat": 18.38184872,
    "lon": -103.71046848,
    "approach": true
  },
  {
    "id": "route-manzanillo-los-cabos-1",
    "lat": 19.35902557,
    "lon": -105.09662272,
    "approach": true
  },
  {
    "id": "route-los-cabos-san-diego-1",
    "lat": 23.01791045,
    "lon": -110.29084611,
    "approach": true
  },
  {
    "id": "route-los-cabos-san-diego-2",
    "lat": 25.67541116,
    "lon": -113.49116995,
    "approach": true
  },
  {
    "id": "route-los-cabos-san-diego-3",
    "lat": 27.78528895,
    "lon": -115.18073665,
    "approach": true
  },
  {
    "id": "route-los-cabos-san-diego-4",
    "lat": 28.48884385,
    "lon": -115.62255415,
    "approach": true
  },
  {
    "id": "route-los-angeles-san-francisco-1",
    "lat": 34.35890647,
    "lon": -120.42891133,
    "approach": true
  },
  {
    "id": "route-los-angeles-san-francisco-2",
    "lat": 34.53468051,
    "lon": -120.65185749,
    "approach": true
  },
  {
    "id": "route-los-angeles-san-francisco-3",
    "lat": 36.47871228,
    "lon": -122.05211489,
    "approach": true
  },
  {
    "id": "route-los-angeles-san-francisco-4",
    "lat": 37.36229351,
    "lon": -122.54801164,
    "approach": true
  },
  {
    "id": "route-san-francisco-seattle-1",
    "lat": 38.00456354,
    "lon": -123.10766794,
    "approach": true
  },
  {
    "id": "route-san-francisco-seattle-2",
    "lat": 38.93505804,
    "lon": -123.76217865,
    "approach": true
  },
  {
    "id": "route-san-francisco-seattle-3",
    "lat": 40.43714889,
    "lon": -124.44981924,
    "approach": true
  },
  {
    "id": "route-san-francisco-seattle-4",
    "lat": 45.39790265,
    "lon": -124.7054056,
    "approach": true
  },
  {
    "id": "route-san-francisco-seattle-5",
    "lat": 48.27437438,
    "lon": -124.81749862,
    "approach": true
  },
  {
    "id": "route-san-francisco-seattle-6",
    "lat": 48.42002921,
    "lon": -124.71578472,
    "approach": true
  },
  {
    "id": "route-san-francisco-seattle-7",
    "lat": 48.14998598,
    "lon": -122.77432692,
    "approach": true
  },
  {
    "id": "route-san-francisco-seattle-8",
    "lat": 48.07817386,
    "lon": -122.66693672,
    "approach": true
  },
  {
    "id": "route-san-francisco-seattle-9",
    "lat": 47.79039167,
    "lon": -122.45328628,
    "approach": true
  },
  {
    "id": "route-balboa-callao-1",
    "lat": 0.0744547,
    "lon": -80.42577847,
    "approach": true
  },
  {
    "id": "route-balboa-callao-2",
    "lat": -1.00575397,
    "lon": -80.96199299,
    "approach": true
  },
  {
    "id": "route-balboa-callao-3",
    "lat": -4.42405661,
    "lon": -81.49661149,
    "approach": true
  },
  {
    "id": "route-balboa-callao-4",
    "lat": -6.04174726,
    "lon": -81.1394589,
    "approach": true
  },
  {
    "id": "route-balboa-callao-5",
    "lat": -11.07727445,
    "lon": -77.91367211,
    "approach": true
  },
  {
    "id": "route-callao-valparaiso-1",
    "lat": -12.23980137,
    "lon": -77.02733539,
    "approach": true
  },
  {
    "id": "route-valparaiso-pac-chile-south-1",
    "lat": -33.158204,
    "lon": -71.84484919,
    "approach": true
  },
  {
    "id": "route-valparaiso-pac-chile-south-2",
    "lat": -37.63479203,
    "lon": -73.89894261,
    "approach": true
  },
  {
    "id": "route-atl-patagonia-montevideo-1",
    "lat": -36.93255774,
    "lon": -56.63251064,
    "approach": true
  },
  {
    "id": "route-montevideo-santos-1",
    "lat": -35.13817034,
    "lon": -55.3402079,
    "approach": true
  },
  {
    "id": "route-montevideo-santos-2",
    "lat": -34.76568439,
    "lon": -54.2493417,
    "approach": true
  },
  {
    "id": "route-montevideo-santos-3",
    "lat": -34.20915735,
    "lon": -53.39231207,
    "approach": true
  },
  {
    "id": "route-montevideo-santos-4",
    "lat": -28.42808343,
    "lon": -48.66281278,
    "approach": true
  },
  {
    "id": "route-rio-de-janeiro-dakar-1",
    "lat": -23.0071599,
    "lon": -41.97754209,
    "approach": true
  },
  {
    "id": "route-rio-de-janeiro-dakar-2",
    "lat": -22.09792219,
    "lon": -41.01465397,
    "approach": true
  },
  {
    "id": "route-genoa-med-sardinia-east-1",
    "lat": 42.5424988,
    "lon": 9.66225824,
    "approach": true
  },
  {
    "id": "route-piraeus-istanbul-1",
    "lat": 37.67219485,
    "lon": 23.95085809,
    "approach": true
  },
  {
    "id": "route-piraeus-istanbul-2",
    "lat": 37.64499913,
    "lon": 24.01888004,
    "approach": true
  },
  {
    "id": "route-piraeus-istanbul-3",
    "lat": 37.65391132,
    "lon": 24.04164764,
    "approach": true
  },
  {
    "id": "route-piraeus-istanbul-4",
    "lat": 37.7524669,
    "lon": 24.13321789,
    "approach": true
  },
  {
    "id": "route-piraeus-istanbul-5",
    "lat": 37.96576353,
    "lon": 24.54540711,
    "approach": true
  },
  {
    "id": "route-piraeus-istanbul-6",
    "lat": 39.83466662,
    "lon": 25.97552981,
    "approach": true
  },
  {
    "id": "route-piraeus-istanbul-7",
    "lat": 40.15865726,
    "lon": 26.38675918,
    "approach": true
  },
  {
    "id": "route-piraeus-istanbul-8",
    "lat": 40.18534502,
    "lon": 26.39960888,
    "approach": true
  },
  {
    "id": "route-piraeus-istanbul-9",
    "lat": 40.20304452,
    "lon": 26.41210314,
    "approach": true
  },
  {
    "id": "route-piraeus-istanbul-10",
    "lat": 40.40217278,
    "lon": 26.72735855,
    "approach": true
  },
  {
    "id": "route-piraeus-istanbul-11",
    "lat": 40.72867819,
    "lon": 27.82272434,
    "approach": true
  },
  {
    "id": "route-piraeus-port-said-1",
    "lat": 36.80396987,
    "lon": 24.7331413,
    "approach": true
  },
  {
    "id": "route-piraeus-port-said-2",
    "lat": 33.82444339,
    "lon": 28.58768113,
    "approach": true
  },
  {
    "id": "route-ashdod-haifa-1",
    "lat": 32.73913645,
    "lon": 34.8067731,
    "approach": true
  },
  {
    "id": "route-suez-jeddah-1",
    "lat": 29.69865971,
    "lon": 32.57,
    "approach": true
  },
  {
    "id": "route-suez-jeddah-2",
    "lat": 28.25723468,
    "lon": 33.38669022,
    "approach": true
  },
  {
    "id": "route-jeddah-red-bab-south-1",
    "lat": 21.11015828,
    "lon": 38.90337484,
    "approach": true
  },
  {
    "id": "route-jeddah-red-bab-south-2",
    "lat": 14.06141656,
    "lon": 42.60955488,
    "approach": true
  },
  {
    "id": "route-jeddah-red-bab-south-3",
    "lat": 12.60386164,
    "lon": 43.5022526,
    "approach": true
  },
  {
    "id": "route-arab-socotra-arab-oman-1",
    "lat": 20.51879884,
    "lon": 59.02172245,
    "approach": true
  },
  {
    "id": "route-arab-socotra-arab-oman-2",
    "lat": 22.30015211,
    "lon": 59.83931624,
    "approach": true
  },
  {
    "id": "route-arab-socotra-arab-oman-3",
    "lat": 22.47976213,
    "lon": 59.84474538,
    "approach": true
  },
  {
    "id": "route-arab-hormuz-east-arab-hormuz-north-1",
    "lat": 26.31890718,
    "lon": 56.59867996,
    "approach": true
  },
  {
    "id": "route-suez-eilat-1",
    "lat": 29.69865971,
    "lon": 32.57,
    "approach": true
  },
  {
    "id": "route-suez-eilat-2",
    "lat": 28.25723468,
    "lon": 33.38669022,
    "approach": true
  },
  {
    "id": "route-suez-eilat-3",
    "lat": 27.7102126,
    "lon": 34.19498185,
    "approach": true
  },
  {
    "id": "route-suez-eilat-4",
    "lat": 27.707572,
    "lon": 34.39807437,
    "approach": true
  },
  {
    "id": "route-eilat-jeddah-1",
    "lat": 28.05899048,
    "lon": 34.55240139,
    "approach": true
  },
  {
    "id": "route-colombo-sri-lanka-south-1",
    "lat": 6.25050937,
    "lon": 79.96922438,
    "approach": true
  },
  {
    "id": "route-malacca-west-malacca-central-1",
    "lat": 5.51913246,
    "lon": 95.08420951,
    "approach": true
  },
  {
    "id": "route-malacca-west-malacca-central-2",
    "lat": 5.69819665,
    "lon": 95.44605951,
    "approach": true
  },
  {
    "id": "route-malacca-west-malacca-central-3",
    "lat": 5.33032172,
    "lon": 97.43225475,
    "approach": true
  },
  {
    "id": "route-malacca-central-singapore-1",
    "lat": 1.23686604,
    "lon": 103.51740522,
    "approach": true
  },
  {
    "id": "route-singapore-china-sea-south-1",
    "lat": 1.37833204,
    "lon": 104.33974751,
    "approach": true
  },
  {
    "id": "route-china-sea-south-hong-kong-1",
    "lat": 21.97357296,
    "lon": 114.56966332,
    "approach": true
  },
  {
    "id": "route-hong-kong-taiwan-west-1",
    "lat": 22.3033987,
    "lon": 114.04363622,
    "approach": true
  },
  {
    "id": "route-hong-kong-taiwan-west-2",
    "lat": 22.3033987,
    "lon": 114.19916283,
    "approach": true
  },
  {
    "id": "route-hong-kong-taiwan-west-3",
    "lat": 22.23139771,
    "lon": 114.27684619,
    "approach": true
  },
  {
    "id": "route-hong-kong-taiwan-west-4",
    "lat": 22.2313054,
    "lon": 114.35456942,
    "approach": true
  },
  {
    "id": "route-hong-kong-taiwan-west-5",
    "lat": 22.9329135,
    "lon": 116.54316874,
    "approach": true
  },
  {
    "id": "route-hong-kong-taiwan-west-6",
    "lat": 23.56491514,
    "lon": 117.41800741,
    "approach": true
  },
  {
    "id": "route-taiwan-west-shanghai-1",
    "lat": 25.35919764,
    "lon": 119.79808564,
    "approach": true
  },
  {
    "id": "route-taiwan-west-shanghai-2",
    "lat": 28.57685264,
    "lon": 121.85634234,
    "approach": true
  },
  {
    "id": "route-taiwan-west-shanghai-3",
    "lat": 30.00328894,
    "lon": 122.51180954,
    "approach": true
  },
  {
    "id": "route-taiwan-west-shanghai-4",
    "lat": 30.18302645,
    "lon": 122.5171851,
    "approach": true
  },
  {
    "id": "route-shanghai-jeju-south-1",
    "lat": 31.59797549,
    "lon": 125.04396846,
    "approach": true
  },
  {
    "id": "route-kyushu-west-kyushu-south-1",
    "lat": 30.46048279,
    "lon": 130.59515741,
    "approach": true
  },
  {
    "id": "route-kyushu-west-kyushu-south-2",
    "lat": 30.27249654,
    "lon": 131.00723483,
    "approach": true
  },
  {
    "id": "route-japan-south-uraga-sur-1",
    "lat": 34.67029501,
    "lon": 139.49776203,
    "approach": true
  },
  {
    "id": "route-singapore-sunda-west-1",
    "lat": 0.83879033,
    "lon": 103.62011783,
    "approach": true
  },
  {
    "id": "route-singapore-sunda-west-2",
    "lat": 0.65892655,
    "lon": 103.62012669,
    "approach": true
  },
  {
    "id": "route-singapore-sunda-west-3",
    "lat": -1.85919724,
    "lon": 104.87924039,
    "approach": true
  },
  {
    "id": "route-singapore-sunda-west-4",
    "lat": -2.03905831,
    "lon": 105.05917591,
    "approach": true
  },
  {
    "id": "route-singapore-sunda-west-5",
    "lat": -2.21891724,
    "lon": 105.419031,
    "approach": true
  },
  {
    "id": "route-singapore-sunda-west-6",
    "lat": -2.21892279,
    "lon": 105.59892334,
    "approach": true
  },
  {
    "id": "route-singapore-sunda-west-7",
    "lat": -3.11801337,
    "lon": 106.13948526,
    "approach": true
  },
  {
    "id": "route-singapore-sunda-west-8",
    "lat": -5.81536288,
    "lon": 105.96412064,
    "approach": true
  },
  {
    "id": "route-singapore-sunda-west-9",
    "lat": -5.99544529,
    "lon": 105.60378549,
    "approach": true
  },
  {
    "id": "route-fremantle-australia-southwest-1",
    "lat": -35.0984607,
    "lon": 114.15466467,
    "approach": true
  },
  {
    "id": "route-bass-east-sydney-exterior-1",
    "lat": -36.43161502,
    "lon": 150.56420434,
    "approach": true
  },
  {
    "id": "route-sydney-brisbane-1",
    "lat": -32.41693954,
    "lon": 152.60029393,
    "approach": true
  },
  {
    "id": "route-sydney-brisbane-2",
    "lat": -30.79035442,
    "lon": 153.20558292,
    "approach": true
  },
  {
    "id": "route-sydney-brisbane-3",
    "lat": -28.26225468,
    "lon": 153.7687921,
    "approach": true
  },
  {
    "id": "route-sydney-brisbane-4",
    "lat": -27.36718413,
    "lon": 153.54522469,
    "approach": true
  },
  {
    "id": "route-nz-north-auckland-1",
    "lat": -35.07217596,
    "lon": 174.31856552,
    "approach": true
  },
  {
    "id": "route-nz-north-auckland-2",
    "lat": -36.67782512,
    "lon": 175.24205014,
    "approach": true
  },
  {
    "id": "route-nz-north-auckland-3",
    "lat": -36.85761231,
    "lon": 175.24720139,
    "approach": true
  }
];
export const EXPANDED_CHAINS: string[][] = [
  [
    "genoa",
    "offshore-genoa"
  ],
  [
    "new-york",
    "offshore-new-york"
  ],
  [
    "cape-town",
    "offshore-cape-town"
  ],
  [
    "sydney",
    "offshore-sydney"
  ],
  [
    "yokohama",
    "offshore-yokohama"
  ],
  [
    "cadiz",
    "offshore-cadiz"
  ],
  [
    "lisbon",
    "offshore-lisbon"
  ],
  [
    "porto",
    "offshore-porto"
  ],
  [
    "vigo",
    "offshore-vigo"
  ],
  [
    "a-coruna",
    "offshore-a-coruna"
  ],
  [
    "brest",
    "offshore-brest"
  ],
  [
    "cork",
    "offshore-cork"
  ],
  [
    "falmouth",
    "offshore-falmouth"
  ],
  [
    "killybegs",
    "offshore-killybegs"
  ],
  [
    "stornoway",
    "offshore-stornoway"
  ],
  [
    "torshavn",
    "offshore-torshavn"
  ],
  [
    "hofn",
    "offshore-hofn"
  ],
  [
    "vestmannaeyjar",
    "offshore-vestmannaeyjar"
  ],
  [
    "reykjavik",
    "offshore-reykjavik"
  ],
  [
    "isafjordur",
    "offshore-isafjordur"
  ],
  [
    "tasiilaq",
    "offshore-tasiilaq"
  ],
  [
    "prins-christian-sund",
    "offshore-prins-christian-sund"
  ],
  [
    "nanortalik",
    "offshore-nanortalik"
  ],
  [
    "qaqortoq",
    "offshore-qaqortoq"
  ],
  [
    "paamiut",
    "offshore-paamiut"
  ],
  [
    "nuuk",
    "offshore-nuuk"
  ],
  [
    "sisimiut",
    "offshore-sisimiut"
  ],
  [
    "qikiqtarjuaq",
    "offshore-qikiqtarjuaq"
  ],
  [
    "pangnirtung",
    "offshore-pangnirtung"
  ],
  [
    "iqaluit",
    "offshore-iqaluit"
  ],
  [
    "saglek",
    "offshore-saglek"
  ],
  [
    "nain",
    "offshore-nain"
  ],
  [
    "cartwright",
    "offshore-cartwright"
  ],
  [
    "st-johns",
    "offshore-st-johns"
  ],
  [
    "halifax",
    "offshore-halifax"
  ],
  [
    "boston",
    "offshore-boston"
  ],
  [
    "funchal",
    "offshore-funchal"
  ],
  [
    "las-palmas",
    "offshore-las-palmas"
  ],
  [
    "ponta-delgada",
    "offshore-ponta-delgada"
  ],
  [
    "horta",
    "offshore-horta"
  ],
  [
    "bermuda",
    "offshore-bermuda"
  ],
  [
    "miami",
    "offshore-miami"
  ],
  [
    "nassau",
    "offshore-nassau"
  ],
  [
    "havana",
    "offshore-havana"
  ],
  [
    "cancun",
    "offshore-cancun"
  ],
  [
    "veracruz",
    "offshore-veracruz"
  ],
  [
    "san-juan",
    "offshore-san-juan"
  ],
  [
    "cartagena-colombia",
    "offshore-cartagena-colombia"
  ],
  [
    "colon",
    "offshore-colon"
  ],
  [
    "balboa",
    "offshore-balboa"
  ],
  [
    "acapulco",
    "offshore-acapulco"
  ],
  [
    "los-cabos",
    "offshore-los-cabos"
  ],
  [
    "manzanillo",
    "offshore-manzanillo"
  ],
  [
    "san-diego",
    "offshore-san-diego"
  ],
  [
    "los-angeles",
    "offshore-los-angeles"
  ],
  [
    "san-francisco",
    "offshore-san-francisco"
  ],
  [
    "seattle",
    "offshore-seattle"
  ],
  [
    "vancouver",
    "offshore-vancouver"
  ],
  [
    "callao",
    "offshore-callao"
  ],
  [
    "valparaiso",
    "offshore-valparaiso"
  ],
  [
    "rio-de-janeiro",
    "offshore-rio-de-janeiro"
  ],
  [
    "santos",
    "offshore-santos"
  ],
  [
    "buenos-aires",
    "offshore-buenos-aires"
  ],
  [
    "montevideo",
    "offshore-montevideo"
  ],
  [
    "dakar",
    "offshore-dakar"
  ],
  [
    "casablanca",
    "offshore-casablanca"
  ],
  [
    "rotterdam",
    "offshore-rotterdam"
  ],
  [
    "hamburg",
    "offshore-hamburg"
  ],
  [
    "bergen",
    "offshore-bergen"
  ],
  [
    "oslo",
    "offshore-oslo"
  ],
  [
    "piraeus",
    "offshore-piraeus"
  ],
  [
    "istanbul",
    "offshore-istanbul"
  ],
  [
    "port-said",
    "offshore-port-said"
  ],
  [
    "haifa",
    "offshore-haifa"
  ],
  [
    "ashdod",
    "offshore-ashdod"
  ],
  [
    "suez",
    "offshore-suez"
  ],
  [
    "eilat",
    "offshore-eilat"
  ],
  [
    "jeddah",
    "offshore-jeddah"
  ],
  [
    "dubai",
    "offshore-dubai"
  ],
  [
    "mumbai",
    "offshore-mumbai"
  ],
  [
    "colombo",
    "offshore-colombo"
  ],
  [
    "singapore",
    "offshore-singapore"
  ],
  [
    "hong-kong",
    "offshore-hong-kong"
  ],
  [
    "shanghai",
    "offshore-shanghai"
  ],
  [
    "busan",
    "offshore-busan"
  ],
  [
    "auckland",
    "offshore-auckland"
  ],
  [
    "brisbane",
    "offshore-brisbane"
  ],
  [
    "fremantle",
    "offshore-fremantle"
  ],
  [
    "st-anthony",
    "offshore-st-anthony"
  ],
  [
    "saint-pierre",
    "offshore-saint-pierre"
  ],
  [
    "la-spezia",
    "offshore-la-spezia"
  ],
  [
    "livorno",
    "offshore-livorno"
  ],
  [
    "piombino",
    "offshore-piombino"
  ],
  [
    "civitavecchia",
    "offshore-civitavecchia"
  ],
  [
    "anzio",
    "offshore-anzio"
  ],
  [
    "gaeta",
    "offshore-gaeta"
  ],
  [
    "naples",
    "offshore-naples"
  ],
  [
    "salerno",
    "offshore-salerno"
  ],
  [
    "vibo-valentia",
    "offshore-vibo-valentia"
  ],
  [
    "palermo",
    "offshore-palermo"
  ],
  [
    "messina",
    "offshore-messina"
  ],
  [
    "catania",
    "offshore-catania"
  ],
  [
    "crotone",
    "offshore-crotone"
  ],
  [
    "taranto",
    "offshore-taranto"
  ],
  [
    "brindisi",
    "offshore-brindisi"
  ],
  [
    "corfu",
    "offshore-corfu"
  ],
  [
    "argostoli",
    "offshore-argostoli"
  ],
  [
    "katakolon",
    "offshore-katakolon"
  ],
  [
    "kalamata",
    "offshore-kalamata"
  ],
  [
    "kissamos",
    "offshore-kissamos"
  ],
  [
    "heraklion",
    "offshore-heraklion"
  ],
  [
    "sitia",
    "offshore-sitia"
  ],
  [
    "rhodes",
    "offshore-rhodes"
  ],
  [
    "fethiye",
    "offshore-fethiye"
  ],
  [
    "antalya",
    "offshore-antalya"
  ],
  [
    "alanya",
    "offshore-alanya"
  ],
  [
    "limassol",
    "offshore-limassol"
  ],
  [
    "larnaca",
    "offshore-larnaca"
  ],
  [
    "progreso",
    "offshore-progreso"
  ],
  [
    "lazaro-cardenas",
    "offshore-lazaro-cardenas"
  ],
  [
    "puerto-vallarta",
    "offshore-puerto-vallarta"
  ],
  [
    "mazatlan",
    "offshore-mazatlan"
  ],
  [
    "la-paz",
    "offshore-la-paz"
  ],
  [
    "ensenada",
    "offshore-ensenada"
  ],
  [
    "rio-lagartos",
    "offshore-rio-lagartos"
  ],
  [
    "celestun",
    "offshore-celestun"
  ],
  [
    "campeche",
    "offshore-campeche"
  ],
  [
    "champoton",
    "offshore-champoton"
  ],
  [
    "ciudad-carmen",
    "offshore-ciudad-carmen"
  ],
  [
    "dos-bocas",
    "offshore-dos-bocas"
  ],
  [
    "coatzacoalcos",
    "offshore-coatzacoalcos"
  ],
  [
    "alvarado",
    "offshore-alvarado"
  ],
  [
    "zihuatanejo",
    "offshore-zihuatanejo"
  ],
  [
    "san-carlos",
    "offshore-san-carlos"
  ],
  [
    "bahia-tortugas",
    "offshore-bahia-tortugas"
  ],
  [
    "san-quintin",
    "offshore-san-quintin"
  ],
  [
    "gijon",
    "offshore-gijon"
  ],
  [
    "santander",
    "offshore-santander"
  ],
  [
    "la-rochelle",
    "offshore-la-rochelle"
  ],
  [
    "newlyn",
    "offshore-newlyn"
  ],
  [
    "galway",
    "offshore-galway"
  ],
  [
    "oban",
    "offshore-oban"
  ],
  [
    "scrabster",
    "offshore-scrabster"
  ],
  [
    "stromness",
    "offshore-stromness"
  ],
  [
    "lerwick",
    "offshore-lerwick"
  ],
  [
    "sorvagur",
    "offshore-sorvagur"
  ],
  [
    "budir",
    "offshore-budir"
  ],
  [
    "seydisfjordur",
    "offshore-seydisfjordur"
  ],
  [
    "qutdleq",
    "offshore-qutdleq"
  ],
  [
    "north-sydney",
    "offshore-north-sydney"
  ],
  [
    "port-hawkesbury",
    "offshore-port-hawkesbury"
  ],
  [
    "portland-maine",
    "offshore-portland-maine"
  ],
  [
    "newport-rhode-island",
    "offshore-newport-rhode-island"
  ],
  [
    "portimao",
    "offshore-portimao"
  ],
  [
    "bayonne",
    "offshore-bayonne"
  ],
  [
    "lorient",
    "offshore-lorient"
  ],
  [
    "dingle",
    "offshore-dingle"
  ],
  [
    "kangerlussuaq-east",
    "offshore-kangerlussuaq-east"
  ],
  [
    "kulusuk",
    "offshore-kulusuk"
  ],
  [
    "skjoldungen",
    "offshore-skjoldungen"
  ],
  [
    "timmiarmiut",
    "offshore-timmiarmiut"
  ],
  [
    "cape-dyer",
    "offshore-cape-dyer"
  ],
  [
    "brevoort",
    "offshore-brevoort"
  ],
  [
    "resolution-harbour",
    "offshore-resolution-harbour"
  ],
  [
    "hopedale",
    "offshore-hopedale"
  ],
  [
    "bonavista",
    "offshore-bonavista"
  ],
  [
    "yarmouth-canada",
    "offshore-yarmouth-canada"
  ],
  [
    "morro-bay",
    "offshore-morro-bay"
  ],
  [
    "eureka",
    "offshore-eureka"
  ],
  [
    "astoria",
    "offshore-astoria"
  ],
  [
    "acajutla",
    "offshore-acajutla"
  ],
  [
    "puerto-caldera",
    "offshore-puerto-caldera"
  ],
  [
    "golfito",
    "offshore-golfito"
  ],
  [
    "puerto-armuelles",
    "offshore-puerto-armuelles"
  ],
  [
    "buenaventura",
    "offshore-buenaventura"
  ],
  [
    "tumaco",
    "offshore-tumaco"
  ],
  [
    "esmeraldas",
    "offshore-esmeraldas"
  ],
  [
    "manta",
    "offshore-manta"
  ],
  [
    "cabo-blanco",
    "offshore-cabo-blanco"
  ],
  [
    "salaverry",
    "offshore-salaverry"
  ],
  [
    "chimbote",
    "offshore-chimbote"
  ],
  [
    "san-nicolas",
    "offshore-san-nicolas"
  ],
  [
    "matarani",
    "offshore-matarani"
  ],
  [
    "arica",
    "offshore-arica"
  ],
  [
    "iquique",
    "offshore-iquique"
  ],
  [
    "antofagasta",
    "offshore-antofagasta"
  ],
  [
    "caldera-chile",
    "offshore-caldera-chile"
  ],
  [
    "coquimbo",
    "offshore-coquimbo"
  ],
  [
    "talcahuano",
    "offshore-talcahuano"
  ],
  [
    "corral",
    "offshore-corral"
  ],
  [
    "norfolk",
    "offshore-norfolk"
  ],
  [
    "morehead-city",
    "offshore-morehead-city"
  ],
  [
    "charleston",
    "offshore-charleston"
  ],
  [
    "jacksonville",
    "offshore-jacksonville"
  ],
  [
    "canaveral",
    "offshore-canaveral"
  ],
  [
    "key-west",
    "offshore-key-west"
  ],
  [
    "matthew-town",
    "offshore-matthew-town"
  ],
  [
    "haina",
    "offshore-haina"
  ],
  [
    "rocky-point",
    "offshore-rocky-point"
  ],
  [
    "trujillo-honduras",
    "offshore-trujillo-honduras"
  ],
  [
    "st-johns-antigua",
    "offshore-st-johns-antigua"
  ],
  [
    "fort-de-france",
    "offshore-fort-de-france"
  ],
  [
    "point-lisas",
    "offshore-point-lisas"
  ],
  [
    "rio-grande",
    "offshore-rio-grande"
  ],
  [
    "itajai",
    "offshore-itajai"
  ],
  [
    "vitoria",
    "offshore-vitoria"
  ],
  [
    "ilheus",
    "offshore-ilheus"
  ],
  [
    "salvador",
    "offshore-salvador"
  ],
  [
    "recife",
    "offshore-recife"
  ],
  [
    "natal",
    "offshore-natal"
  ],
  [
    "fortaleza",
    "offshore-fortaleza"
  ],
  [
    "agadir",
    "offshore-agadir"
  ],
  [
    "laayoune",
    "offshore-laayoune"
  ],
  [
    "dakhla",
    "offshore-dakhla"
  ],
  [
    "nouadhibou",
    "offshore-nouadhibou"
  ],
  [
    "nouakchott",
    "offshore-nouakchott"
  ],
  [
    "banjul",
    "offshore-banjul"
  ],
  [
    "conakry",
    "offshore-conakry"
  ],
  [
    "freetown",
    "offshore-freetown"
  ],
  [
    "monrovia",
    "offshore-monrovia"
  ],
  [
    "cape-palmas",
    "offshore-cape-palmas"
  ],
  [
    "sekondi",
    "offshore-sekondi"
  ],
  [
    "lagos",
    "offshore-lagos"
  ],
  [
    "malabo",
    "offshore-malabo"
  ],
  [
    "bata",
    "offshore-bata"
  ],
  [
    "port-gentil",
    "offshore-port-gentil"
  ],
  [
    "pointe-noire",
    "offshore-pointe-noire"
  ],
  [
    "luanda",
    "offshore-luanda"
  ],
  [
    "lobito",
    "offshore-lobito"
  ],
  [
    "namibe",
    "offshore-namibe"
  ],
  [
    "walvis-bay",
    "offshore-walvis-bay"
  ],
  [
    "luderitz",
    "offshore-luderitz"
  ],
  [
    "saldanha",
    "offshore-saldanha"
  ],
  [
    "sharm-el-sheikh",
    "offshore-sharm-el-sheikh"
  ],
  [
    "hurghada",
    "offshore-hurghada"
  ],
  [
    "al-qusayr",
    "offshore-al-qusayr"
  ],
  [
    "duba",
    "offshore-duba"
  ],
  [
    "al-mukha",
    "offshore-al-mukha"
  ],
  [
    "muscat",
    "offshore-muscat"
  ],
  [
    "sohar",
    "offshore-sohar"
  ],
  [
    "fujairah",
    "offshore-fujairah"
  ],
  [
    "karachi",
    "offshore-karachi"
  ],
  [
    "okha",
    "offshore-okha"
  ],
  [
    "veraval",
    "offshore-veraval"
  ],
  [
    "penang",
    "offshore-penang"
  ],
  [
    "port-klang",
    "offshore-port-klang"
  ],
  [
    "sabang",
    "offshore-sabang"
  ],
  [
    "belawan",
    "offshore-belawan"
  ],
  [
    "phuket",
    "offshore-phuket"
  ],
  [
    "salina-cruz",
    "offshore-salina-cruz"
  ],
  [
    "puerto-quetzal",
    "offshore-puerto-quetzal"
  ],
  [
    "corinto",
    "offshore-corinto"
  ],
  [
    "belize-city",
    "offshore-belize-city"
  ],
  [
    "puerto-limon",
    "offshore-puerto-limon"
  ],
  [
    "yanbu",
    "offshore-yanbu"
  ],
  [
    "jazan",
    "offshore-jazan"
  ],
  [
    "aden",
    "offshore-aden"
  ],
  [
    "mukalla",
    "offshore-mukalla"
  ],
  [
    "salalah",
    "offshore-salalah"
  ],
  [
    "duqm",
    "offshore-duqm"
  ],
  [
    "gwadar",
    "offshore-gwadar"
  ],
  [
    "mormugao",
    "offshore-mormugao"
  ],
  [
    "new-mangalore",
    "offshore-new-mangalore"
  ],
  [
    "kochi",
    "offshore-kochi"
  ],
  [
    "puerto-montt",
    "offshore-puerto-montt"
  ],
  [
    "puerto-chacabuco",
    "offshore-puerto-chacabuco"
  ],
  [
    "puerto-natales",
    "offshore-puerto-natales"
  ],
  [
    "punta-arenas",
    "offshore-punta-arenas"
  ],
  [
    "ushuaia",
    "offshore-ushuaia"
  ],
  [
    "puerto-williams",
    "offshore-puerto-williams"
  ],
  [
    "cape-horn",
    "offshore-cape-horn"
  ],
  [
    "fildes-bay",
    "offshore-fildes-bay"
  ],
  [
    "deception-island",
    "offshore-deception-island"
  ],
  [
    "port-lockroy",
    "offshore-port-lockroy"
  ],
  [
    "bahia-blanca",
    "offshore-bahia-blanca"
  ],
  [
    "puerto-madryn",
    "offshore-puerto-madryn"
  ],
  [
    "puerto-deseado",
    "offshore-puerto-deseado"
  ],
  [
    "rio-gallegos",
    "offshore-rio-gallegos"
  ],
  [
    "offshore-genoa",
    "route-genoa-la-spezia-1",
    "route-genoa-la-spezia-2",
    "offshore-la-spezia"
  ],
  [
    "offshore-la-spezia",
    "route-la-spezia-livorno-1",
    "offshore-livorno"
  ],
  [
    "offshore-livorno",
    "route-livorno-piombino-1",
    "offshore-piombino"
  ],
  [
    "offshore-piombino",
    "route-piombino-civitavecchia-1",
    "offshore-civitavecchia"
  ],
  [
    "offshore-civitavecchia",
    "offshore-anzio"
  ],
  [
    "offshore-anzio",
    "route-anzio-gaeta-1",
    "offshore-gaeta"
  ],
  [
    "offshore-gaeta",
    "route-gaeta-naples-1",
    "route-gaeta-naples-2",
    "offshore-naples"
  ],
  [
    "offshore-naples",
    "route-naples-salerno-1",
    "route-naples-salerno-2",
    "offshore-salerno"
  ],
  [
    "offshore-salerno",
    "route-salerno-vibo-valentia-1",
    "route-salerno-vibo-valentia-2",
    "offshore-vibo-valentia"
  ],
  [
    "offshore-vibo-valentia",
    "route-vibo-valentia-messina-1",
    "route-vibo-valentia-messina-2",
    "offshore-messina"
  ],
  [
    "offshore-messina",
    "offshore-catania"
  ],
  [
    "offshore-catania",
    "route-catania-crotone-1",
    "route-catania-crotone-2",
    "offshore-crotone"
  ],
  [
    "offshore-crotone",
    "route-crotone-taranto-1",
    "offshore-taranto"
  ],
  [
    "offshore-taranto",
    "route-taranto-brindisi-1",
    "route-taranto-brindisi-2",
    "route-taranto-brindisi-3",
    "route-taranto-brindisi-4",
    "offshore-brindisi"
  ],
  [
    "offshore-brindisi",
    "route-brindisi-corfu-1",
    "route-brindisi-corfu-2",
    "offshore-corfu"
  ],
  [
    "offshore-corfu",
    "route-corfu-argostoli-1",
    "route-corfu-argostoli-2",
    "route-corfu-argostoli-3",
    "offshore-argostoli"
  ],
  [
    "offshore-argostoli",
    "offshore-katakolon"
  ],
  [
    "offshore-katakolon",
    "route-katakolon-kalamata-1",
    "route-katakolon-kalamata-2",
    "offshore-kalamata"
  ],
  [
    "offshore-kalamata",
    "route-kalamata-kissamos-1",
    "route-kalamata-kissamos-2",
    "route-kalamata-kissamos-3",
    "offshore-kissamos"
  ],
  [
    "offshore-kissamos",
    "route-kissamos-heraklion-1",
    "route-kissamos-heraklion-2",
    "offshore-heraklion"
  ],
  [
    "offshore-heraklion",
    "route-heraklion-sitia-1",
    "offshore-sitia"
  ],
  [
    "offshore-sitia",
    "route-sitia-rhodes-1",
    "route-sitia-rhodes-2",
    "offshore-rhodes"
  ],
  [
    "offshore-rhodes",
    "offshore-fethiye"
  ],
  [
    "offshore-fethiye",
    "route-fethiye-antalya-1",
    "route-fethiye-antalya-2",
    "route-fethiye-antalya-3",
    "route-fethiye-antalya-4",
    "offshore-antalya"
  ],
  [
    "offshore-antalya",
    "offshore-alanya"
  ],
  [
    "offshore-alanya",
    "route-alanya-limassol-1",
    "route-alanya-limassol-2",
    "route-alanya-limassol-3",
    "offshore-limassol"
  ],
  [
    "offshore-limassol",
    "route-limassol-larnaca-1",
    "offshore-larnaca"
  ],
  [
    "offshore-larnaca",
    "offshore-haifa"
  ],
  [
    "offshore-palermo",
    "route-palermo-vibo-valentia-1",
    "offshore-vibo-valentia"
  ],
  [
    "offshore-palermo",
    "route-palermo-messina-1",
    "offshore-messina"
  ],
  [
    "ajaccio",
    "route-ajaccio-piombino-1",
    "route-ajaccio-piombino-2",
    "route-ajaccio-piombino-3",
    "route-ajaccio-piombino-4",
    "offshore-piombino"
  ],
  [
    "offshore-kalamata",
    "route-kalamata-piraeus-1",
    "route-kalamata-piraeus-2",
    "route-kalamata-piraeus-3",
    "route-kalamata-piraeus-4",
    "route-kalamata-piraeus-5",
    "offshore-piraeus"
  ],
  [
    "offshore-piraeus",
    "route-piraeus-heraklion-1",
    "offshore-heraklion"
  ],
  [
    "offshore-piraeus",
    "route-piraeus-rhodes-1",
    "route-piraeus-rhodes-2",
    "route-piraeus-rhodes-3",
    "route-piraeus-rhodes-4",
    "offshore-rhodes"
  ],
  [
    "offshore-rhodes",
    "route-rhodes-limassol-1",
    "offshore-limassol"
  ],
  [
    "offshore-limassol",
    "offshore-haifa"
  ],
  [
    "offshore-cancun",
    "route-cancun-rio-lagartos-1",
    "route-cancun-rio-lagartos-2",
    "offshore-rio-lagartos"
  ],
  [
    "offshore-rio-lagartos",
    "offshore-progreso"
  ],
  [
    "offshore-progreso",
    "route-progreso-celestun-1",
    "route-progreso-celestun-2",
    "offshore-celestun"
  ],
  [
    "offshore-celestun",
    "offshore-campeche"
  ],
  [
    "offshore-campeche",
    "route-campeche-champoton-1",
    "offshore-champoton"
  ],
  [
    "offshore-champoton",
    "offshore-ciudad-carmen"
  ],
  [
    "offshore-ciudad-carmen",
    "route-ciudad-carmen-dos-bocas-1",
    "offshore-dos-bocas"
  ],
  [
    "offshore-dos-bocas",
    "route-dos-bocas-coatzacoalcos-1",
    "offshore-coatzacoalcos"
  ],
  [
    "offshore-coatzacoalcos",
    "route-coatzacoalcos-alvarado-1",
    "route-coatzacoalcos-alvarado-2",
    "route-coatzacoalcos-alvarado-3",
    "route-coatzacoalcos-alvarado-4",
    "offshore-alvarado"
  ],
  [
    "offshore-alvarado",
    "route-alvarado-veracruz-1",
    "offshore-veracruz"
  ],
  [
    "offshore-acapulco",
    "route-acapulco-zihuatanejo-1",
    "offshore-zihuatanejo"
  ],
  [
    "offshore-zihuatanejo",
    "offshore-lazaro-cardenas"
  ],
  [
    "offshore-lazaro-cardenas",
    "route-lazaro-cardenas-manzanillo-1",
    "route-lazaro-cardenas-manzanillo-2",
    "offshore-manzanillo"
  ],
  [
    "offshore-manzanillo",
    "route-manzanillo-puerto-vallarta-1",
    "route-manzanillo-puerto-vallarta-2",
    "route-manzanillo-puerto-vallarta-3",
    "offshore-puerto-vallarta"
  ],
  [
    "offshore-puerto-vallarta",
    "route-puerto-vallarta-mazatlan-1",
    "offshore-mazatlan"
  ],
  [
    "offshore-mazatlan",
    "route-mazatlan-la-paz-1",
    "route-mazatlan-la-paz-2",
    "offshore-la-paz"
  ],
  [
    "offshore-la-paz",
    "route-la-paz-los-cabos-1",
    "route-la-paz-los-cabos-2",
    "route-la-paz-los-cabos-3",
    "route-la-paz-los-cabos-4",
    "route-la-paz-los-cabos-5",
    "route-la-paz-los-cabos-6",
    "offshore-los-cabos"
  ],
  [
    "offshore-mazatlan",
    "offshore-los-cabos"
  ],
  [
    "offshore-los-cabos",
    "route-los-cabos-san-carlos-1",
    "route-los-cabos-san-carlos-2",
    "route-los-cabos-san-carlos-3",
    "offshore-san-carlos"
  ],
  [
    "offshore-san-carlos",
    "route-san-carlos-bahia-tortugas-1",
    "route-san-carlos-bahia-tortugas-2",
    "offshore-bahia-tortugas"
  ],
  [
    "offshore-bahia-tortugas",
    "route-bahia-tortugas-san-quintin-1",
    "route-bahia-tortugas-san-quintin-2",
    "route-bahia-tortugas-san-quintin-3",
    "route-bahia-tortugas-san-quintin-4",
    "route-bahia-tortugas-san-quintin-5",
    "offshore-san-quintin"
  ],
  [
    "offshore-san-quintin",
    "route-san-quintin-ensenada-1",
    "route-san-quintin-ensenada-2",
    "offshore-ensenada"
  ],
  [
    "offshore-ensenada",
    "route-ensenada-san-diego-1",
    "route-ensenada-san-diego-2",
    "offshore-san-diego"
  ],
  [
    "offshore-cadiz",
    "offshore-portimao"
  ],
  [
    "offshore-portimao",
    "route-portimao-lisbon-1",
    "offshore-lisbon"
  ],
  [
    "offshore-a-coruna",
    "route-a-coruna-gijon-1",
    "route-a-coruna-gijon-2",
    "route-a-coruna-gijon-3",
    "route-a-coruna-gijon-4",
    "offshore-gijon"
  ],
  [
    "offshore-gijon",
    "route-gijon-santander-1",
    "offshore-santander"
  ],
  [
    "offshore-santander",
    "route-santander-bayonne-1",
    "route-santander-bayonne-2",
    "offshore-bayonne"
  ],
  [
    "offshore-bayonne",
    "route-bayonne-la-rochelle-1",
    "offshore-la-rochelle"
  ],
  [
    "offshore-la-rochelle",
    "route-la-rochelle-lorient-1",
    "offshore-lorient"
  ],
  [
    "offshore-lorient",
    "route-lorient-brest-1",
    "route-lorient-brest-2",
    "offshore-brest"
  ],
  [
    "offshore-brest",
    "route-brest-newlyn-1",
    "offshore-newlyn"
  ],
  [
    "offshore-newlyn",
    "route-newlyn-cork-1",
    "offshore-cork"
  ],
  [
    "offshore-newlyn",
    "route-newlyn-falmouth-1",
    "route-newlyn-falmouth-2",
    "offshore-falmouth"
  ],
  [
    "offshore-cork",
    "route-cork-dingle-1",
    "route-cork-dingle-2",
    "route-cork-dingle-3",
    "route-cork-dingle-4",
    "offshore-dingle"
  ],
  [
    "offshore-dingle",
    "route-dingle-galway-1",
    "route-dingle-galway-2",
    "route-dingle-galway-3",
    "offshore-galway"
  ],
  [
    "offshore-galway",
    "route-galway-killybegs-1",
    "route-galway-killybegs-2",
    "route-galway-killybegs-3",
    "route-galway-killybegs-4",
    "route-galway-killybegs-5",
    "offshore-killybegs"
  ],
  [
    "offshore-killybegs",
    "route-killybegs-oban-1",
    "route-killybegs-oban-2",
    "route-killybegs-oban-3",
    "route-killybegs-oban-4",
    "offshore-oban"
  ],
  [
    "offshore-oban",
    "route-oban-stornoway-1",
    "route-oban-stornoway-2",
    "route-oban-stornoway-3",
    "route-oban-stornoway-4",
    "route-oban-stornoway-5",
    "offshore-stornoway"
  ],
  [
    "offshore-stornoway",
    "route-stornoway-scrabster-1",
    "offshore-scrabster"
  ],
  [
    "offshore-scrabster",
    "route-scrabster-stromness-1",
    "offshore-stromness"
  ],
  [
    "offshore-stromness",
    "route-stromness-lerwick-1",
    "route-stromness-lerwick-2",
    "route-stromness-lerwick-3",
    "route-stromness-lerwick-4",
    "offshore-lerwick"
  ],
  [
    "offshore-lerwick",
    "route-lerwick-torshavn-1",
    "route-lerwick-torshavn-2",
    "offshore-torshavn"
  ],
  [
    "offshore-torshavn",
    "route-torshavn-sorvagur-1",
    "route-torshavn-sorvagur-2",
    "offshore-sorvagur"
  ],
  [
    "offshore-sorvagur",
    "route-sorvagur-budir-1",
    "offshore-budir"
  ],
  [
    "offshore-budir",
    "route-budir-hofn-1",
    "route-budir-hofn-2",
    "offshore-hofn"
  ],
  [
    "offshore-budir",
    "route-budir-seydisfjordur-1",
    "route-budir-seydisfjordur-2",
    "offshore-seydisfjordur"
  ],
  [
    "offshore-isafjordur",
    "offshore-kangerlussuaq-east"
  ],
  [
    "offshore-kangerlussuaq-east",
    "route-kangerlussuaq-east-kulusuk-1",
    "route-kangerlussuaq-east-kulusuk-2",
    "offshore-kulusuk"
  ],
  [
    "offshore-kulusuk",
    "offshore-tasiilaq"
  ],
  [
    "offshore-tasiilaq",
    "route-tasiilaq-skjoldungen-1",
    "offshore-skjoldungen"
  ],
  [
    "offshore-skjoldungen",
    "route-skjoldungen-timmiarmiut-1",
    "route-skjoldungen-timmiarmiut-2",
    "offshore-timmiarmiut"
  ],
  [
    "offshore-timmiarmiut",
    "route-timmiarmiut-qutdleq-1",
    "offshore-qutdleq"
  ],
  [
    "offshore-qutdleq",
    "offshore-prins-christian-sund"
  ],
  [
    "offshore-sisimiut",
    "route-sisimiut-cape-dyer-1",
    "offshore-cape-dyer"
  ],
  [
    "offshore-cape-dyer",
    "route-cape-dyer-brevoort-1",
    "offshore-brevoort"
  ],
  [
    "offshore-brevoort",
    "route-brevoort-resolution-harbour-1",
    "route-brevoort-resolution-harbour-2",
    "offshore-resolution-harbour"
  ],
  [
    "offshore-resolution-harbour",
    "offshore-saglek"
  ],
  [
    "offshore-cape-dyer",
    "route-cape-dyer-qikiqtarjuaq-1",
    "route-cape-dyer-qikiqtarjuaq-2",
    "route-cape-dyer-qikiqtarjuaq-3",
    "route-cape-dyer-qikiqtarjuaq-4",
    "offshore-qikiqtarjuaq"
  ],
  [
    "offshore-brevoort",
    "route-brevoort-iqaluit-1",
    "route-brevoort-iqaluit-2",
    "route-brevoort-iqaluit-3",
    "route-brevoort-iqaluit-4",
    "offshore-iqaluit"
  ],
  [
    "offshore-nain",
    "route-nain-hopedale-1",
    "route-nain-hopedale-2",
    "route-nain-hopedale-3",
    "offshore-hopedale"
  ],
  [
    "offshore-hopedale",
    "route-hopedale-cartwright-1",
    "route-hopedale-cartwright-2",
    "route-hopedale-cartwright-3",
    "route-hopedale-cartwright-4",
    "route-hopedale-cartwright-5",
    "route-hopedale-cartwright-6",
    "offshore-cartwright"
  ],
  [
    "offshore-st-anthony",
    "route-st-anthony-bonavista-1",
    "offshore-bonavista"
  ],
  [
    "offshore-bonavista",
    "route-bonavista-st-johns-1",
    "route-bonavista-st-johns-2",
    "offshore-st-johns"
  ],
  [
    "offshore-saint-pierre",
    "route-saint-pierre-north-sydney-1",
    "offshore-north-sydney"
  ],
  [
    "offshore-north-sydney",
    "route-north-sydney-port-hawkesbury-1",
    "route-north-sydney-port-hawkesbury-2",
    "route-north-sydney-port-hawkesbury-3",
    "route-north-sydney-port-hawkesbury-4",
    "route-north-sydney-port-hawkesbury-5",
    "route-north-sydney-port-hawkesbury-6",
    "route-north-sydney-port-hawkesbury-7",
    "offshore-port-hawkesbury"
  ],
  [
    "offshore-port-hawkesbury",
    "route-port-hawkesbury-halifax-1",
    "route-port-hawkesbury-halifax-2",
    "route-port-hawkesbury-halifax-3",
    "route-port-hawkesbury-halifax-4",
    "route-port-hawkesbury-halifax-5",
    "route-port-hawkesbury-halifax-6",
    "route-port-hawkesbury-halifax-7",
    "route-port-hawkesbury-halifax-8",
    "route-port-hawkesbury-halifax-9",
    "offshore-halifax"
  ],
  [
    "offshore-halifax",
    "route-halifax-yarmouth-canada-1",
    "route-halifax-yarmouth-canada-2",
    "offshore-yarmouth-canada"
  ],
  [
    "offshore-yarmouth-canada",
    "offshore-portland-maine"
  ],
  [
    "offshore-portland-maine",
    "route-portland-maine-boston-1",
    "route-portland-maine-boston-2",
    "offshore-boston"
  ],
  [
    "atl-cape-cod",
    "route-atl-cape-cod-newport-rhode-island-1",
    "route-atl-cape-cod-newport-rhode-island-2",
    "route-atl-cape-cod-newport-rhode-island-3",
    "offshore-newport-rhode-island"
  ],
  [
    "offshore-newport-rhode-island",
    "route-newport-rhode-island-new-york-1",
    "offshore-new-york"
  ],
  [
    "offshore-north-sydney",
    "route-north-sydney-halifax-1",
    "route-north-sydney-halifax-2",
    "route-north-sydney-halifax-3",
    "route-north-sydney-halifax-4",
    "offshore-halifax"
  ],
  [
    "offshore-san-diego",
    "offshore-los-angeles"
  ],
  [
    "offshore-los-angeles",
    "route-los-angeles-morro-bay-1",
    "route-los-angeles-morro-bay-2",
    "route-los-angeles-morro-bay-3",
    "offshore-morro-bay"
  ],
  [
    "offshore-morro-bay",
    "route-morro-bay-san-francisco-1",
    "route-morro-bay-san-francisco-2",
    "route-morro-bay-san-francisco-3",
    "offshore-san-francisco"
  ],
  [
    "offshore-san-francisco",
    "route-san-francisco-eureka-1",
    "route-san-francisco-eureka-2",
    "route-san-francisco-eureka-3",
    "offshore-eureka"
  ],
  [
    "offshore-eureka",
    "route-eureka-astoria-1",
    "route-eureka-astoria-2",
    "route-eureka-astoria-3",
    "offshore-astoria"
  ],
  [
    "offshore-astoria",
    "route-astoria-seattle-1",
    "route-astoria-seattle-2",
    "route-astoria-seattle-3",
    "route-astoria-seattle-4",
    "route-astoria-seattle-5",
    "route-astoria-seattle-6",
    "route-astoria-seattle-7",
    "offshore-seattle"
  ],
  [
    "offshore-seattle",
    "route-seattle-vancouver-1",
    "route-seattle-vancouver-2",
    "route-seattle-vancouver-3",
    "route-seattle-vancouver-4",
    "route-seattle-vancouver-5",
    "route-seattle-vancouver-6",
    "offshore-vancouver"
  ],
  [
    "offshore-acapulco",
    "route-acapulco-salina-cruz-1",
    "route-acapulco-salina-cruz-2",
    "route-acapulco-salina-cruz-3",
    "offshore-salina-cruz"
  ],
  [
    "offshore-salina-cruz",
    "route-salina-cruz-puerto-quetzal-1",
    "route-salina-cruz-puerto-quetzal-2",
    "offshore-puerto-quetzal"
  ],
  [
    "offshore-puerto-quetzal",
    "offshore-acajutla"
  ],
  [
    "offshore-acajutla",
    "offshore-corinto"
  ],
  [
    "offshore-corinto",
    "route-corinto-puerto-caldera-1",
    "route-corinto-puerto-caldera-2",
    "offshore-puerto-caldera"
  ],
  [
    "offshore-puerto-caldera",
    "route-puerto-caldera-golfito-1",
    "route-puerto-caldera-golfito-2",
    "route-puerto-caldera-golfito-3",
    "route-puerto-caldera-golfito-4",
    "offshore-golfito"
  ],
  [
    "offshore-golfito",
    "route-golfito-puerto-armuelles-1",
    "route-golfito-puerto-armuelles-2",
    "offshore-puerto-armuelles"
  ],
  [
    "offshore-puerto-armuelles",
    "route-puerto-armuelles-balboa-1",
    "route-puerto-armuelles-balboa-2",
    "route-puerto-armuelles-balboa-3",
    "route-puerto-armuelles-balboa-4",
    "route-puerto-armuelles-balboa-5",
    "offshore-balboa"
  ],
  [
    "offshore-balboa",
    "route-balboa-buenaventura-1",
    "offshore-buenaventura"
  ],
  [
    "offshore-buenaventura",
    "route-buenaventura-tumaco-1",
    "route-buenaventura-tumaco-2",
    "route-buenaventura-tumaco-3",
    "offshore-tumaco"
  ],
  [
    "offshore-tumaco",
    "route-tumaco-esmeraldas-1",
    "offshore-esmeraldas"
  ],
  [
    "offshore-esmeraldas",
    "route-esmeraldas-manta-1",
    "offshore-manta"
  ],
  [
    "offshore-manta",
    "route-manta-cabo-blanco-1",
    "offshore-cabo-blanco"
  ],
  [
    "offshore-cabo-blanco",
    "route-cabo-blanco-salaverry-1",
    "route-cabo-blanco-salaverry-2",
    "offshore-salaverry"
  ],
  [
    "offshore-salaverry",
    "route-salaverry-chimbote-1",
    "offshore-chimbote"
  ],
  [
    "offshore-chimbote",
    "route-chimbote-callao-1",
    "route-chimbote-callao-2",
    "offshore-callao"
  ],
  [
    "offshore-callao",
    "route-callao-san-nicolas-1",
    "route-callao-san-nicolas-2",
    "route-callao-san-nicolas-3",
    "route-callao-san-nicolas-4",
    "offshore-san-nicolas"
  ],
  [
    "offshore-san-nicolas",
    "route-san-nicolas-matarani-1",
    "offshore-matarani"
  ],
  [
    "offshore-matarani",
    "route-matarani-arica-1",
    "offshore-arica"
  ],
  [
    "offshore-arica",
    "route-arica-iquique-1",
    "offshore-iquique"
  ],
  [
    "offshore-iquique",
    "route-iquique-antofagasta-1",
    "route-iquique-antofagasta-2",
    "offshore-antofagasta"
  ],
  [
    "offshore-antofagasta",
    "route-antofagasta-caldera-chile-1",
    "offshore-caldera-chile"
  ],
  [
    "offshore-caldera-chile",
    "route-caldera-chile-coquimbo-1",
    "route-caldera-chile-coquimbo-2",
    "offshore-coquimbo"
  ],
  [
    "offshore-coquimbo",
    "route-coquimbo-valparaiso-1",
    "route-coquimbo-valparaiso-2",
    "offshore-valparaiso"
  ],
  [
    "offshore-valparaiso",
    "route-valparaiso-talcahuano-1",
    "offshore-talcahuano"
  ],
  [
    "offshore-talcahuano",
    "route-talcahuano-corral-1",
    "route-talcahuano-corral-2",
    "offshore-corral"
  ],
  [
    "offshore-new-york",
    "route-new-york-norfolk-1",
    "route-new-york-norfolk-2",
    "route-new-york-norfolk-3",
    "route-new-york-norfolk-4",
    "offshore-norfolk"
  ],
  [
    "offshore-norfolk",
    "route-norfolk-morehead-city-1",
    "route-norfolk-morehead-city-2",
    "route-norfolk-morehead-city-3",
    "route-norfolk-morehead-city-4",
    "route-norfolk-morehead-city-5",
    "route-norfolk-morehead-city-6",
    "route-norfolk-morehead-city-7",
    "route-norfolk-morehead-city-8",
    "route-norfolk-morehead-city-9",
    "offshore-morehead-city"
  ],
  [
    "offshore-morehead-city",
    "route-morehead-city-charleston-1",
    "route-morehead-city-charleston-2",
    "route-morehead-city-charleston-3",
    "offshore-charleston"
  ],
  [
    "offshore-charleston",
    "route-charleston-jacksonville-1",
    "offshore-jacksonville"
  ],
  [
    "offshore-jacksonville",
    "offshore-canaveral"
  ],
  [
    "offshore-canaveral",
    "route-canaveral-miami-1",
    "route-canaveral-miami-2",
    "offshore-miami"
  ],
  [
    "offshore-miami",
    "route-miami-key-west-1",
    "route-miami-key-west-2",
    "route-miami-key-west-3",
    "route-miami-key-west-4",
    "offshore-key-west"
  ],
  [
    "offshore-key-west",
    "offshore-havana"
  ],
  [
    "offshore-miami",
    "route-miami-nassau-1",
    "offshore-nassau"
  ],
  [
    "offshore-nassau",
    "route-nassau-matthew-town-1",
    "offshore-matthew-town"
  ],
  [
    "offshore-matthew-town",
    "route-matthew-town-haina-1",
    "route-matthew-town-haina-2",
    "route-matthew-town-haina-3",
    "route-matthew-town-haina-4",
    "route-matthew-town-haina-5",
    "offshore-haina"
  ],
  [
    "offshore-haina",
    "route-haina-san-juan-1",
    "route-haina-san-juan-2",
    "offshore-san-juan"
  ],
  [
    "offshore-san-juan",
    "route-san-juan-st-johns-antigua-1",
    "offshore-st-johns-antigua"
  ],
  [
    "offshore-st-johns-antigua",
    "route-st-johns-antigua-fort-de-france-1",
    "route-st-johns-antigua-fort-de-france-2",
    "offshore-fort-de-france"
  ],
  [
    "offshore-fort-de-france",
    "route-fort-de-france-point-lisas-1",
    "offshore-point-lisas"
  ],
  [
    "offshore-haina",
    "route-haina-rocky-point-1",
    "route-haina-rocky-point-2",
    "offshore-rocky-point"
  ],
  [
    "offshore-cancun",
    "route-cancun-belize-city-1",
    "route-cancun-belize-city-2",
    "offshore-belize-city"
  ],
  [
    "offshore-belize-city",
    "route-belize-city-trujillo-honduras-1",
    "offshore-trujillo-honduras"
  ],
  [
    "offshore-trujillo-honduras",
    "route-trujillo-honduras-puerto-limon-1",
    "route-trujillo-honduras-puerto-limon-2",
    "route-trujillo-honduras-puerto-limon-3",
    "route-trujillo-honduras-puerto-limon-4",
    "route-trujillo-honduras-puerto-limon-5",
    "offshore-puerto-limon"
  ],
  [
    "offshore-puerto-limon",
    "offshore-colon"
  ],
  [
    "offshore-colon",
    "route-colon-cartagena-colombia-1",
    "offshore-cartagena-colombia"
  ],
  [
    "offshore-montevideo",
    "route-montevideo-rio-grande-1",
    "route-montevideo-rio-grande-2",
    "route-montevideo-rio-grande-3",
    "route-montevideo-rio-grande-4",
    "route-montevideo-rio-grande-5",
    "offshore-rio-grande"
  ],
  [
    "offshore-rio-grande",
    "route-rio-grande-itajai-1",
    "route-rio-grande-itajai-2",
    "route-rio-grande-itajai-3",
    "route-rio-grande-itajai-4",
    "route-rio-grande-itajai-5",
    "offshore-itajai"
  ],
  [
    "offshore-itajai",
    "offshore-santos"
  ],
  [
    "offshore-santos",
    "route-santos-rio-de-janeiro-1",
    "offshore-rio-de-janeiro"
  ],
  [
    "offshore-rio-de-janeiro",
    "route-rio-de-janeiro-vitoria-1",
    "route-rio-de-janeiro-vitoria-2",
    "route-rio-de-janeiro-vitoria-3",
    "route-rio-de-janeiro-vitoria-4",
    "offshore-vitoria"
  ],
  [
    "offshore-vitoria",
    "route-vitoria-ilheus-1",
    "route-vitoria-ilheus-2",
    "route-vitoria-ilheus-3",
    "route-vitoria-ilheus-4",
    "route-vitoria-ilheus-5",
    "route-vitoria-ilheus-6",
    "offshore-ilheus"
  ],
  [
    "offshore-ilheus",
    "route-ilheus-salvador-1",
    "offshore-salvador"
  ],
  [
    "offshore-salvador",
    "route-salvador-recife-1",
    "route-salvador-recife-2",
    "route-salvador-recife-3",
    "route-salvador-recife-4",
    "offshore-recife"
  ],
  [
    "offshore-recife",
    "route-recife-natal-1",
    "route-recife-natal-2",
    "offshore-natal"
  ],
  [
    "offshore-natal",
    "route-natal-fortaleza-1",
    "offshore-fortaleza"
  ],
  [
    "offshore-casablanca",
    "route-casablanca-agadir-1",
    "route-casablanca-agadir-2",
    "route-casablanca-agadir-3",
    "route-casablanca-agadir-4",
    "offshore-agadir"
  ],
  [
    "offshore-agadir",
    "route-agadir-laayoune-1",
    "offshore-laayoune"
  ],
  [
    "offshore-laayoune",
    "route-laayoune-dakhla-1",
    "route-laayoune-dakhla-2",
    "offshore-dakhla"
  ],
  [
    "offshore-dakhla",
    "route-dakhla-nouadhibou-1",
    "route-dakhla-nouadhibou-2",
    "route-dakhla-nouadhibou-3",
    "offshore-nouadhibou"
  ],
  [
    "offshore-nouadhibou",
    "offshore-nouakchott"
  ],
  [
    "offshore-nouakchott",
    "route-nouakchott-dakar-1",
    "offshore-dakar"
  ],
  [
    "offshore-dakar",
    "offshore-banjul"
  ],
  [
    "offshore-banjul",
    "route-banjul-conakry-1",
    "route-banjul-conakry-2",
    "route-banjul-conakry-3",
    "route-banjul-conakry-4",
    "route-banjul-conakry-5",
    "offshore-conakry"
  ],
  [
    "offshore-conakry",
    "offshore-freetown"
  ],
  [
    "offshore-freetown",
    "route-freetown-monrovia-1",
    "route-freetown-monrovia-2",
    "route-freetown-monrovia-3",
    "offshore-monrovia"
  ],
  [
    "offshore-monrovia",
    "route-monrovia-cape-palmas-1",
    "offshore-cape-palmas"
  ],
  [
    "offshore-cape-palmas",
    "route-cape-palmas-sekondi-1",
    "route-cape-palmas-sekondi-2",
    "offshore-sekondi"
  ],
  [
    "offshore-sekondi",
    "offshore-lagos"
  ],
  [
    "offshore-lagos",
    "route-lagos-malabo-1",
    "offshore-malabo"
  ],
  [
    "offshore-malabo",
    "route-malabo-bata-1",
    "offshore-bata"
  ],
  [
    "offshore-bata",
    "route-bata-port-gentil-1",
    "offshore-port-gentil"
  ],
  [
    "offshore-port-gentil",
    "route-port-gentil-pointe-noire-1",
    "route-port-gentil-pointe-noire-2",
    "route-port-gentil-pointe-noire-3",
    "route-port-gentil-pointe-noire-4",
    "offshore-pointe-noire"
  ],
  [
    "offshore-pointe-noire",
    "route-pointe-noire-luanda-1",
    "route-pointe-noire-luanda-2",
    "offshore-luanda"
  ],
  [
    "offshore-luanda",
    "route-luanda-lobito-1",
    "route-luanda-lobito-2",
    "route-luanda-lobito-3",
    "offshore-lobito"
  ],
  [
    "offshore-lobito",
    "route-lobito-namibe-1",
    "route-lobito-namibe-2",
    "route-lobito-namibe-3",
    "offshore-namibe"
  ],
  [
    "offshore-namibe",
    "route-namibe-walvis-bay-1",
    "route-namibe-walvis-bay-2",
    "route-namibe-walvis-bay-3",
    "route-namibe-walvis-bay-4",
    "route-namibe-walvis-bay-5",
    "offshore-walvis-bay"
  ],
  [
    "offshore-walvis-bay",
    "route-walvis-bay-luderitz-1",
    "route-walvis-bay-luderitz-2",
    "route-walvis-bay-luderitz-3",
    "offshore-luderitz"
  ],
  [
    "offshore-luderitz",
    "route-luderitz-saldanha-1",
    "route-luderitz-saldanha-2",
    "route-luderitz-saldanha-3",
    "offshore-saldanha"
  ],
  [
    "offshore-saldanha",
    "route-saldanha-cape-town-1",
    "offshore-cape-town"
  ],
  [
    "offshore-las-palmas",
    "offshore-laayoune"
  ],
  [
    "offshore-suez",
    "route-suez-hurghada-1",
    "route-suez-hurghada-2",
    "route-suez-hurghada-3",
    "offshore-hurghada"
  ],
  [
    "offshore-hurghada",
    "route-hurghada-al-qusayr-1",
    "offshore-al-qusayr"
  ],
  [
    "offshore-al-qusayr",
    "route-al-qusayr-yanbu-1",
    "offshore-yanbu"
  ],
  [
    "offshore-yanbu",
    "offshore-jeddah"
  ],
  [
    "offshore-jeddah",
    "route-jeddah-jazan-1",
    "route-jeddah-jazan-2",
    "offshore-jazan"
  ],
  [
    "offshore-jazan",
    "route-jazan-al-mukha-1",
    "offshore-al-mukha"
  ],
  [
    "offshore-al-mukha",
    "route-al-mukha-aden-1",
    "route-al-mukha-aden-2",
    "offshore-aden"
  ],
  [
    "offshore-aden",
    "route-aden-mukalla-1",
    "route-aden-mukalla-2",
    "offshore-mukalla"
  ],
  [
    "offshore-mukalla",
    "route-mukalla-salalah-1",
    "route-mukalla-salalah-2",
    "offshore-salalah"
  ],
  [
    "offshore-salalah",
    "route-salalah-duqm-1",
    "route-salalah-duqm-2",
    "route-salalah-duqm-3",
    "offshore-duqm"
  ],
  [
    "offshore-duqm",
    "route-duqm-muscat-1",
    "route-duqm-muscat-2",
    "route-duqm-muscat-3",
    "route-duqm-muscat-4",
    "route-duqm-muscat-5",
    "offshore-muscat"
  ],
  [
    "offshore-muscat",
    "offshore-sohar"
  ],
  [
    "offshore-sohar",
    "offshore-fujairah"
  ],
  [
    "offshore-fujairah",
    "route-fujairah-dubai-1",
    "route-fujairah-dubai-2",
    "offshore-dubai"
  ],
  [
    "offshore-suez",
    "route-suez-sharm-el-sheikh-1",
    "route-suez-sharm-el-sheikh-2",
    "route-suez-sharm-el-sheikh-3",
    "route-suez-sharm-el-sheikh-4",
    "offshore-sharm-el-sheikh"
  ],
  [
    "offshore-sharm-el-sheikh",
    "route-sharm-el-sheikh-eilat-1",
    "route-sharm-el-sheikh-eilat-2",
    "offshore-eilat"
  ],
  [
    "offshore-sharm-el-sheikh",
    "route-sharm-el-sheikh-hurghada-1",
    "offshore-hurghada"
  ],
  [
    "offshore-sharm-el-sheikh",
    "offshore-duba"
  ],
  [
    "offshore-duba",
    "route-duba-yanbu-1",
    "route-duba-yanbu-2",
    "offshore-yanbu"
  ],
  [
    "offshore-muscat",
    "offshore-gwadar"
  ],
  [
    "offshore-gwadar",
    "offshore-karachi"
  ],
  [
    "offshore-karachi",
    "route-karachi-okha-1",
    "offshore-okha"
  ],
  [
    "offshore-okha",
    "route-okha-veraval-1",
    "route-okha-veraval-2",
    "offshore-veraval"
  ],
  [
    "offshore-veraval",
    "offshore-mumbai"
  ],
  [
    "offshore-mumbai",
    "route-mumbai-mormugao-1",
    "offshore-mormugao"
  ],
  [
    "offshore-mormugao",
    "offshore-new-mangalore"
  ],
  [
    "offshore-new-mangalore",
    "route-new-mangalore-kochi-1",
    "offshore-kochi"
  ],
  [
    "offshore-kochi",
    "route-kochi-colombo-1",
    "route-kochi-colombo-2",
    "route-kochi-colombo-3",
    "offshore-colombo"
  ],
  [
    "offshore-sabang",
    "route-sabang-belawan-1",
    "route-sabang-belawan-2",
    "offshore-belawan"
  ],
  [
    "offshore-belawan",
    "route-belawan-penang-1",
    "offshore-penang"
  ],
  [
    "offshore-penang",
    "route-penang-port-klang-1",
    "route-penang-port-klang-2",
    "route-penang-port-klang-3",
    "offshore-port-klang"
  ],
  [
    "offshore-port-klang",
    "route-port-klang-singapore-1",
    "route-port-klang-singapore-2",
    "route-port-klang-singapore-3",
    "offshore-singapore"
  ],
  [
    "offshore-phuket",
    "route-phuket-penang-1",
    "offshore-penang"
  ],
  [
    "offshore-corral",
    "route-corral-puerto-montt-1",
    "route-corral-puerto-montt-2",
    "route-corral-puerto-montt-3",
    "route-corral-puerto-montt-4",
    "route-corral-puerto-montt-5",
    "route-corral-puerto-montt-6",
    "route-corral-puerto-montt-7",
    "route-corral-puerto-montt-8",
    "route-corral-puerto-montt-9",
    "offshore-puerto-montt"
  ],
  [
    "offshore-puerto-montt",
    "route-puerto-montt-puerto-chacabuco-1",
    "route-puerto-montt-puerto-chacabuco-2",
    "route-puerto-montt-puerto-chacabuco-3",
    "route-puerto-montt-puerto-chacabuco-4",
    "route-puerto-montt-puerto-chacabuco-5",
    "offshore-puerto-chacabuco"
  ],
  [
    "offshore-puerto-chacabuco",
    "route-puerto-chacabuco-pac-chile-south-1",
    "route-puerto-chacabuco-pac-chile-south-2",
    "route-puerto-chacabuco-pac-chile-south-3",
    "route-puerto-chacabuco-pac-chile-south-4",
    "route-puerto-chacabuco-pac-chile-south-5",
    "route-puerto-chacabuco-pac-chile-south-6",
    "route-puerto-chacabuco-pac-chile-south-7",
    "route-puerto-chacabuco-pac-chile-south-8",
    "route-puerto-chacabuco-pac-chile-south-9",
    "route-puerto-chacabuco-pac-chile-south-10",
    "pac-chile-south"
  ],
  [
    "pac-chile-south",
    "route-pac-chile-south-puerto-natales-1",
    "route-pac-chile-south-puerto-natales-2",
    "route-pac-chile-south-puerto-natales-3",
    "route-pac-chile-south-puerto-natales-4",
    "route-pac-chile-south-puerto-natales-5",
    "route-pac-chile-south-puerto-natales-6",
    "route-pac-chile-south-puerto-natales-7",
    "route-pac-chile-south-puerto-natales-8",
    "route-pac-chile-south-puerto-natales-9",
    "offshore-puerto-natales"
  ],
  [
    "offshore-puerto-natales",
    "route-puerto-natales-punta-arenas-1",
    "route-puerto-natales-punta-arenas-2",
    "route-puerto-natales-punta-arenas-3",
    "route-puerto-natales-punta-arenas-4",
    "route-puerto-natales-punta-arenas-5",
    "route-puerto-natales-punta-arenas-6",
    "route-puerto-natales-punta-arenas-7",
    "route-puerto-natales-punta-arenas-8",
    "route-puerto-natales-punta-arenas-9",
    "route-puerto-natales-punta-arenas-10",
    "route-puerto-natales-punta-arenas-11",
    "route-puerto-natales-punta-arenas-12",
    "route-puerto-natales-punta-arenas-13",
    "route-puerto-natales-punta-arenas-14",
    "route-puerto-natales-punta-arenas-15",
    "route-puerto-natales-punta-arenas-16",
    "route-puerto-natales-punta-arenas-17",
    "route-puerto-natales-punta-arenas-18",
    "route-puerto-natales-punta-arenas-19",
    "route-puerto-natales-punta-arenas-20",
    "route-puerto-natales-punta-arenas-21",
    "offshore-punta-arenas"
  ],
  [
    "offshore-punta-arenas",
    "route-punta-arenas-ushuaia-1",
    "route-punta-arenas-ushuaia-2",
    "route-punta-arenas-ushuaia-3",
    "route-punta-arenas-ushuaia-4",
    "route-punta-arenas-ushuaia-5",
    "route-punta-arenas-ushuaia-6",
    "route-punta-arenas-ushuaia-7",
    "route-punta-arenas-ushuaia-8",
    "route-punta-arenas-ushuaia-9",
    "route-punta-arenas-ushuaia-10",
    "route-punta-arenas-ushuaia-11",
    "route-punta-arenas-ushuaia-12",
    "route-punta-arenas-ushuaia-13",
    "route-punta-arenas-ushuaia-14",
    "route-punta-arenas-ushuaia-15",
    "offshore-ushuaia"
  ],
  [
    "offshore-ushuaia",
    "offshore-puerto-williams"
  ],
  [
    "offshore-puerto-williams",
    "route-puerto-williams-cape-horn-1",
    "route-puerto-williams-cape-horn-2",
    "route-puerto-williams-cape-horn-3",
    "route-puerto-williams-cape-horn-4",
    "route-puerto-williams-cape-horn-5",
    "offshore-cape-horn"
  ],
  [
    "offshore-cape-horn",
    "route-cape-horn-fildes-bay-1",
    "offshore-fildes-bay"
  ],
  [
    "offshore-fildes-bay",
    "route-fildes-bay-deception-island-1",
    "route-fildes-bay-deception-island-2",
    "offshore-deception-island"
  ],
  [
    "offshore-deception-island",
    "route-deception-island-port-lockroy-1",
    "route-deception-island-port-lockroy-2",
    "route-deception-island-port-lockroy-3",
    "route-deception-island-port-lockroy-4",
    "route-deception-island-port-lockroy-5",
    "offshore-port-lockroy"
  ],
  [
    "offshore-montevideo",
    "route-montevideo-bahia-blanca-1",
    "route-montevideo-bahia-blanca-2",
    "route-montevideo-bahia-blanca-3",
    "route-montevideo-bahia-blanca-4",
    "offshore-bahia-blanca"
  ],
  [
    "offshore-bahia-blanca",
    "route-bahia-blanca-puerto-madryn-1",
    "route-bahia-blanca-puerto-madryn-2",
    "route-bahia-blanca-puerto-madryn-3",
    "route-bahia-blanca-puerto-madryn-4",
    "offshore-puerto-madryn"
  ],
  [
    "offshore-puerto-madryn",
    "route-puerto-madryn-puerto-deseado-1",
    "route-puerto-madryn-puerto-deseado-2",
    "offshore-puerto-deseado"
  ],
  [
    "offshore-puerto-deseado",
    "route-puerto-deseado-rio-gallegos-1",
    "route-puerto-deseado-rio-gallegos-2",
    "route-puerto-deseado-rio-gallegos-3",
    "offshore-rio-gallegos"
  ],
  [
    "offshore-rio-gallegos",
    "route-rio-gallegos-punta-arenas-1",
    "route-rio-gallegos-punta-arenas-2",
    "route-rio-gallegos-punta-arenas-3",
    "route-rio-gallegos-punta-arenas-4",
    "route-rio-gallegos-punta-arenas-5",
    "route-rio-gallegos-punta-arenas-6",
    "offshore-punta-arenas"
  ],
  [
    "offshore-buenos-aires",
    "route-buenos-aires-bahia-blanca-1",
    "route-buenos-aires-bahia-blanca-2",
    "route-buenos-aires-bahia-blanca-3",
    "route-buenos-aires-bahia-blanca-4",
    "route-buenos-aires-bahia-blanca-5",
    "route-buenos-aires-bahia-blanca-6",
    "offshore-bahia-blanca"
  ],
  [
    "pac-cape-horn-west",
    "offshore-cape-horn"
  ],
  [
    "offshore-cape-horn",
    "pac-cape-horn-east"
  ],
  [
    "cadiz-exterior",
    "offshore-cadiz"
  ],
  [
    "offshore-cadiz",
    "route-cadiz-lisbon-1",
    "route-cadiz-lisbon-2",
    "offshore-lisbon"
  ],
  [
    "offshore-lisbon",
    "route-lisbon-porto-1",
    "route-lisbon-porto-2",
    "offshore-porto"
  ],
  [
    "offshore-porto",
    "route-porto-vigo-1",
    "offshore-vigo"
  ],
  [
    "offshore-vigo",
    "route-vigo-a-coruna-1",
    "route-vigo-a-coruna-2",
    "route-vigo-a-coruna-3",
    "route-vigo-a-coruna-4",
    "route-vigo-a-coruna-5",
    "offshore-a-coruna"
  ],
  [
    "offshore-a-coruna",
    "route-a-coruna-brest-1",
    "offshore-brest"
  ],
  [
    "offshore-brest",
    "route-brest-cork-1",
    "route-brest-cork-2",
    "offshore-cork"
  ],
  [
    "offshore-cork",
    "route-cork-killybegs-1",
    "route-cork-killybegs-2",
    "route-cork-killybegs-3",
    "route-cork-killybegs-4",
    "route-cork-killybegs-5",
    "offshore-killybegs"
  ],
  [
    "offshore-killybegs",
    "route-killybegs-stornoway-1",
    "route-killybegs-stornoway-2",
    "route-killybegs-stornoway-3",
    "route-killybegs-stornoway-4",
    "route-killybegs-stornoway-5",
    "offshore-stornoway"
  ],
  [
    "offshore-stornoway",
    "route-stornoway-torshavn-1",
    "route-stornoway-torshavn-2",
    "offshore-torshavn"
  ],
  [
    "offshore-torshavn",
    "route-torshavn-hofn-1",
    "route-torshavn-hofn-2",
    "offshore-hofn"
  ],
  [
    "offshore-hofn",
    "route-hofn-vestmannaeyjar-1",
    "route-hofn-vestmannaeyjar-2",
    "offshore-vestmannaeyjar"
  ],
  [
    "offshore-vestmannaeyjar",
    "route-vestmannaeyjar-reykjavik-1",
    "route-vestmannaeyjar-reykjavik-2",
    "route-vestmannaeyjar-reykjavik-3",
    "offshore-reykjavik"
  ],
  [
    "offshore-reykjavik",
    "route-reykjavik-isafjordur-1",
    "route-reykjavik-isafjordur-2",
    "route-reykjavik-isafjordur-3",
    "route-reykjavik-isafjordur-4",
    "offshore-isafjordur"
  ],
  [
    "offshore-isafjordur",
    "route-isafjordur-tasiilaq-1",
    "route-isafjordur-tasiilaq-2",
    "offshore-tasiilaq"
  ],
  [
    "offshore-tasiilaq",
    "offshore-prins-christian-sund"
  ],
  [
    "offshore-prins-christian-sund",
    "route-prins-christian-sund-nanortalik-1",
    "offshore-nanortalik"
  ],
  [
    "offshore-nanortalik",
    "route-nanortalik-qaqortoq-1",
    "offshore-qaqortoq"
  ],
  [
    "offshore-qaqortoq",
    "route-qaqortoq-paamiut-1",
    "route-qaqortoq-paamiut-2",
    "route-qaqortoq-paamiut-3",
    "offshore-paamiut"
  ],
  [
    "offshore-paamiut",
    "route-paamiut-nuuk-1",
    "offshore-nuuk"
  ],
  [
    "offshore-nuuk",
    "route-nuuk-sisimiut-1",
    "route-nuuk-sisimiut-2",
    "route-nuuk-sisimiut-3",
    "offshore-sisimiut"
  ],
  [
    "offshore-sisimiut",
    "route-sisimiut-qikiqtarjuaq-1",
    "offshore-qikiqtarjuaq"
  ],
  [
    "offshore-qikiqtarjuaq",
    "route-qikiqtarjuaq-pangnirtung-1",
    "route-qikiqtarjuaq-pangnirtung-2",
    "route-qikiqtarjuaq-pangnirtung-3",
    "route-qikiqtarjuaq-pangnirtung-4",
    "route-qikiqtarjuaq-pangnirtung-5",
    "route-qikiqtarjuaq-pangnirtung-6",
    "route-qikiqtarjuaq-pangnirtung-7",
    "offshore-pangnirtung"
  ],
  [
    "offshore-pangnirtung",
    "route-pangnirtung-iqaluit-1",
    "route-pangnirtung-iqaluit-2",
    "route-pangnirtung-iqaluit-3",
    "route-pangnirtung-iqaluit-4",
    "route-pangnirtung-iqaluit-5",
    "offshore-iqaluit"
  ],
  [
    "offshore-iqaluit",
    "route-iqaluit-saglek-1",
    "route-iqaluit-saglek-2",
    "route-iqaluit-saglek-3",
    "route-iqaluit-saglek-4",
    "offshore-saglek"
  ],
  [
    "offshore-saglek",
    "route-saglek-nain-1",
    "route-saglek-nain-2",
    "route-saglek-nain-3",
    "route-saglek-nain-4",
    "route-saglek-nain-5",
    "offshore-nain"
  ],
  [
    "offshore-nain",
    "route-nain-cartwright-1",
    "route-nain-cartwright-2",
    "route-nain-cartwright-3",
    "route-nain-cartwright-4",
    "route-nain-cartwright-5",
    "route-nain-cartwright-6",
    "route-nain-cartwright-7",
    "offshore-cartwright"
  ],
  [
    "offshore-cartwright",
    "route-cartwright-st-anthony-1",
    "route-cartwright-st-anthony-2",
    "route-cartwright-st-anthony-3",
    "route-cartwright-st-anthony-4",
    "route-cartwright-st-anthony-5",
    "route-cartwright-st-anthony-6",
    "route-cartwright-st-anthony-7",
    "route-cartwright-st-anthony-8",
    "offshore-st-anthony"
  ],
  [
    "offshore-st-anthony",
    "route-st-anthony-st-johns-1",
    "route-st-anthony-st-johns-2",
    "offshore-st-johns"
  ],
  [
    "offshore-st-johns",
    "route-st-johns-saint-pierre-1",
    "route-st-johns-saint-pierre-2",
    "route-st-johns-saint-pierre-3",
    "offshore-saint-pierre"
  ],
  [
    "offshore-saint-pierre",
    "route-saint-pierre-halifax-1",
    "offshore-halifax"
  ],
  [
    "offshore-halifax",
    "route-halifax-atl-cape-sable-1",
    "atl-cape-sable"
  ],
  [
    "atl-cape-sable",
    "offshore-boston"
  ],
  [
    "offshore-boston",
    "route-boston-atl-cape-cod-1",
    "route-boston-atl-cape-cod-2",
    "atl-cape-cod"
  ],
  [
    "atl-cape-cod",
    "route-atl-cape-cod-new-york-1",
    "offshore-new-york"
  ],
  [
    "offshore-brest",
    "route-brest-falmouth-1",
    "offshore-falmouth"
  ],
  [
    "offshore-falmouth",
    "route-falmouth-rotterdam-1",
    "route-falmouth-rotterdam-2",
    "offshore-rotterdam"
  ],
  [
    "offshore-rotterdam",
    "route-rotterdam-hamburg-1",
    "route-rotterdam-hamburg-2",
    "offshore-hamburg"
  ],
  [
    "offshore-hamburg",
    "route-hamburg-bergen-1",
    "route-hamburg-bergen-2",
    "route-hamburg-bergen-3",
    "route-hamburg-bergen-4",
    "offshore-bergen"
  ],
  [
    "offshore-bergen",
    "route-bergen-norway-lindesnes-1",
    "route-bergen-norway-lindesnes-2",
    "route-bergen-norway-lindesnes-3",
    "route-bergen-norway-lindesnes-4",
    "norway-lindesnes"
  ],
  [
    "norway-lindesnes",
    "oslo-mouth"
  ],
  [
    "oslo-mouth",
    "route-oslo-mouth-oslo-1",
    "route-oslo-mouth-oslo-2",
    "route-oslo-mouth-oslo-3",
    "route-oslo-mouth-oslo-4",
    "route-oslo-mouth-oslo-5",
    "route-oslo-mouth-oslo-6",
    "offshore-oslo"
  ],
  [
    "offshore-stornoway",
    "route-stornoway-bergen-1",
    "route-stornoway-bergen-2",
    "route-stornoway-bergen-3",
    "route-stornoway-bergen-4",
    "route-stornoway-bergen-5",
    "route-stornoway-bergen-6",
    "route-stornoway-bergen-7",
    "offshore-bergen"
  ],
  [
    "offshore-lisbon",
    "route-lisbon-funchal-1",
    "offshore-funchal"
  ],
  [
    "offshore-funchal",
    "route-funchal-las-palmas-1",
    "offshore-las-palmas"
  ],
  [
    "offshore-las-palmas",
    "route-las-palmas-dakar-1",
    "route-las-palmas-dakar-2",
    "route-las-palmas-dakar-3",
    "offshore-dakar"
  ],
  [
    "offshore-dakar",
    "africa-liberia"
  ],
  [
    "africa-liberia",
    "africa-angola"
  ],
  [
    "africa-angola",
    "cabo-exterior"
  ],
  [
    "offshore-cadiz",
    "offshore-casablanca"
  ],
  [
    "offshore-casablanca",
    "route-casablanca-las-palmas-1",
    "offshore-las-palmas"
  ],
  [
    "offshore-lisbon",
    "route-lisbon-ponta-delgada-1",
    "offshore-ponta-delgada"
  ],
  [
    "offshore-ponta-delgada",
    "route-ponta-delgada-horta-1",
    "offshore-horta"
  ],
  [
    "offshore-horta",
    "offshore-bermuda"
  ],
  [
    "offshore-bermuda",
    "route-bermuda-new-york-1",
    "offshore-new-york"
  ],
  [
    "offshore-new-york",
    "atl-hatteras"
  ],
  [
    "atl-hatteras",
    "atl-florida"
  ],
  [
    "atl-florida",
    "offshore-miami"
  ],
  [
    "offshore-nassau",
    "route-nassau-havana-1",
    "offshore-havana"
  ],
  [
    "offshore-havana",
    "route-havana-cancun-1",
    "route-havana-cancun-2",
    "offshore-cancun"
  ],
  [
    "offshore-cancun",
    "route-cancun-veracruz-1",
    "route-cancun-veracruz-2",
    "route-cancun-veracruz-3",
    "offshore-veracruz"
  ],
  [
    "offshore-veracruz",
    "route-veracruz-havana-1",
    "offshore-havana"
  ],
  [
    "offshore-nassau",
    "route-nassau-san-juan-1",
    "route-nassau-san-juan-2",
    "route-nassau-san-juan-3",
    "offshore-san-juan"
  ],
  [
    "offshore-san-juan",
    "route-san-juan-cartagena-colombia-1",
    "route-san-juan-cartagena-colombia-2",
    "route-san-juan-cartagena-colombia-3",
    "offshore-cartagena-colombia"
  ],
  [
    "offshore-cartagena-colombia",
    "route-cartagena-colombia-colon-1",
    "offshore-colon"
  ],
  [
    "offshore-miami",
    "route-miami-bermuda-1",
    "offshore-bermuda"
  ],
  [
    "offshore-bermuda",
    "offshore-san-juan"
  ],
  [
    "offshore-balboa",
    "route-balboa-pac-guatemala-1",
    "route-balboa-pac-guatemala-2",
    "route-balboa-pac-guatemala-3",
    "route-balboa-pac-guatemala-4",
    "route-balboa-pac-guatemala-5",
    "route-balboa-pac-guatemala-6",
    "pac-guatemala"
  ],
  [
    "pac-guatemala",
    "pac-mex-south"
  ],
  [
    "pac-mex-south",
    "offshore-acapulco"
  ],
  [
    "offshore-acapulco",
    "route-acapulco-manzanillo-1",
    "route-acapulco-manzanillo-2",
    "offshore-manzanillo"
  ],
  [
    "offshore-manzanillo",
    "route-manzanillo-los-cabos-1",
    "offshore-los-cabos"
  ],
  [
    "offshore-los-cabos",
    "route-los-cabos-san-diego-1",
    "route-los-cabos-san-diego-2",
    "route-los-cabos-san-diego-3",
    "route-los-cabos-san-diego-4",
    "offshore-san-diego"
  ],
  [
    "offshore-los-angeles",
    "route-los-angeles-san-francisco-1",
    "route-los-angeles-san-francisco-2",
    "route-los-angeles-san-francisco-3",
    "route-los-angeles-san-francisco-4",
    "offshore-san-francisco"
  ],
  [
    "offshore-san-francisco",
    "route-san-francisco-seattle-1",
    "route-san-francisco-seattle-2",
    "route-san-francisco-seattle-3",
    "route-san-francisco-seattle-4",
    "route-san-francisco-seattle-5",
    "route-san-francisco-seattle-6",
    "route-san-francisco-seattle-7",
    "route-san-francisco-seattle-8",
    "route-san-francisco-seattle-9",
    "offshore-seattle"
  ],
  [
    "offshore-balboa",
    "route-balboa-callao-1",
    "route-balboa-callao-2",
    "route-balboa-callao-3",
    "route-balboa-callao-4",
    "route-balboa-callao-5",
    "offshore-callao"
  ],
  [
    "offshore-callao",
    "route-callao-valparaiso-1",
    "offshore-valparaiso"
  ],
  [
    "offshore-valparaiso",
    "route-valparaiso-pac-chile-south-1",
    "route-valparaiso-pac-chile-south-2",
    "pac-chile-south"
  ],
  [
    "pac-chile-south",
    "pac-cape-horn-west"
  ],
  [
    "pac-cape-horn-west",
    "pac-cape-horn-east"
  ],
  [
    "pac-cape-horn-east",
    "atl-patagonia"
  ],
  [
    "atl-patagonia",
    "route-atl-patagonia-montevideo-1",
    "offshore-montevideo"
  ],
  [
    "offshore-montevideo",
    "offshore-buenos-aires"
  ],
  [
    "offshore-montevideo",
    "route-montevideo-santos-1",
    "route-montevideo-santos-2",
    "route-montevideo-santos-3",
    "route-montevideo-santos-4",
    "offshore-santos"
  ],
  [
    "offshore-rio-de-janeiro",
    "route-rio-de-janeiro-dakar-1",
    "route-rio-de-janeiro-dakar-2",
    "offshore-dakar"
  ],
  [
    "offshore-santos",
    "offshore-cape-town"
  ],
  [
    "offshore-genoa",
    "route-genoa-med-sardinia-east-1",
    "med-sardinia-east"
  ],
  [
    "med-sardinia-east",
    "med-sicily-south"
  ],
  [
    "med-sicily-south",
    "med-matapan"
  ],
  [
    "med-matapan",
    "med-peloponnese-east"
  ],
  [
    "med-peloponnese-east",
    "offshore-piraeus"
  ],
  [
    "offshore-piraeus",
    "route-piraeus-istanbul-1",
    "route-piraeus-istanbul-2",
    "route-piraeus-istanbul-3",
    "route-piraeus-istanbul-4",
    "route-piraeus-istanbul-5",
    "route-piraeus-istanbul-6",
    "route-piraeus-istanbul-7",
    "route-piraeus-istanbul-8",
    "route-piraeus-istanbul-9",
    "route-piraeus-istanbul-10",
    "route-piraeus-istanbul-11",
    "offshore-istanbul"
  ],
  [
    "offshore-piraeus",
    "route-piraeus-port-said-1",
    "route-piraeus-port-said-2",
    "offshore-port-said"
  ],
  [
    "offshore-port-said",
    "offshore-ashdod"
  ],
  [
    "offshore-ashdod",
    "route-ashdod-haifa-1",
    "offshore-haifa"
  ],
  [
    "offshore-suez",
    "route-suez-jeddah-1",
    "route-suez-jeddah-2",
    "offshore-jeddah"
  ],
  [
    "offshore-jeddah",
    "route-jeddah-red-bab-south-1",
    "route-jeddah-red-bab-south-2",
    "route-jeddah-red-bab-south-3",
    "red-bab-south"
  ],
  [
    "red-bab-south",
    "red-aden"
  ],
  [
    "red-aden",
    "arab-socotra"
  ],
  [
    "arab-socotra",
    "route-arab-socotra-arab-oman-1",
    "route-arab-socotra-arab-oman-2",
    "route-arab-socotra-arab-oman-3",
    "arab-oman"
  ],
  [
    "arab-oman",
    "arab-hormuz-east"
  ],
  [
    "arab-hormuz-east",
    "route-arab-hormuz-east-arab-hormuz-north-1",
    "arab-hormuz-north"
  ],
  [
    "arab-hormuz-north",
    "offshore-dubai"
  ],
  [
    "offshore-suez",
    "route-suez-eilat-1",
    "route-suez-eilat-2",
    "route-suez-eilat-3",
    "route-suez-eilat-4",
    "offshore-eilat"
  ],
  [
    "offshore-eilat",
    "route-eilat-jeddah-1",
    "offshore-jeddah"
  ],
  [
    "arab-oman",
    "offshore-mumbai"
  ],
  [
    "offshore-mumbai",
    "india-west"
  ],
  [
    "india-west",
    "india-south"
  ],
  [
    "india-south",
    "offshore-colombo"
  ],
  [
    "offshore-colombo",
    "route-colombo-sri-lanka-south-1",
    "sri-lanka-south"
  ],
  [
    "sri-lanka-south",
    "malacca-west"
  ],
  [
    "malacca-west",
    "route-malacca-west-malacca-central-1",
    "route-malacca-west-malacca-central-2",
    "route-malacca-west-malacca-central-3",
    "malacca-central"
  ],
  [
    "malacca-central",
    "route-malacca-central-singapore-1",
    "offshore-singapore"
  ],
  [
    "offshore-singapore",
    "route-singapore-china-sea-south-1",
    "china-sea-south"
  ],
  [
    "china-sea-south",
    "route-china-sea-south-hong-kong-1",
    "offshore-hong-kong"
  ],
  [
    "offshore-hong-kong",
    "route-hong-kong-taiwan-west-1",
    "route-hong-kong-taiwan-west-2",
    "route-hong-kong-taiwan-west-3",
    "route-hong-kong-taiwan-west-4",
    "route-hong-kong-taiwan-west-5",
    "route-hong-kong-taiwan-west-6",
    "taiwan-west"
  ],
  [
    "taiwan-west",
    "route-taiwan-west-shanghai-1",
    "route-taiwan-west-shanghai-2",
    "route-taiwan-west-shanghai-3",
    "route-taiwan-west-shanghai-4",
    "offshore-shanghai"
  ],
  [
    "offshore-shanghai",
    "route-shanghai-jeju-south-1",
    "jeju-south"
  ],
  [
    "jeju-south",
    "offshore-busan"
  ],
  [
    "offshore-busan",
    "kyushu-west"
  ],
  [
    "kyushu-west",
    "route-kyushu-west-kyushu-south-1",
    "route-kyushu-west-kyushu-south-2",
    "kyushu-south"
  ],
  [
    "kyushu-south",
    "japan-south"
  ],
  [
    "japan-south",
    "route-japan-south-uraga-sur-1",
    "uraga-sur"
  ],
  [
    "offshore-singapore",
    "route-singapore-sunda-west-1",
    "route-singapore-sunda-west-2",
    "route-singapore-sunda-west-3",
    "route-singapore-sunda-west-4",
    "route-singapore-sunda-west-5",
    "route-singapore-sunda-west-6",
    "route-singapore-sunda-west-7",
    "route-singapore-sunda-west-8",
    "route-singapore-sunda-west-9",
    "sunda-west"
  ],
  [
    "sunda-west",
    "sunda-south"
  ],
  [
    "sunda-south",
    "offshore-fremantle"
  ],
  [
    "offshore-fremantle",
    "route-fremantle-australia-southwest-1",
    "australia-southwest"
  ],
  [
    "australia-southwest",
    "australia-bight"
  ],
  [
    "australia-bight",
    "bass-west"
  ],
  [
    "bass-west",
    "bass-east"
  ],
  [
    "bass-east",
    "route-bass-east-sydney-exterior-1",
    "sydney-exterior"
  ],
  [
    "offshore-sydney",
    "route-sydney-brisbane-1",
    "route-sydney-brisbane-2",
    "route-sydney-brisbane-3",
    "route-sydney-brisbane-4",
    "offshore-brisbane"
  ],
  [
    "offshore-sydney",
    "nz-north"
  ],
  [
    "nz-north",
    "route-nz-north-auckland-1",
    "route-nz-north-auckland-2",
    "route-nz-north-auckland-3",
    "offshore-auckland"
  ]
];
