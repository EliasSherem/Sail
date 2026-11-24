# Relieve geográfico y vegetación

El terreno 3D próximo a los **105 destinos costeros** utiliza alturas reales derivadas de **Terrain Tiles / Mapzen**, descargadas del conjunto público en AWS el 26 de septiembre de 2026. La malla del juego conserva exactamente la huella horizontal de tierra de `World`: el nuevo relieve no añade colisiones, no cierra canales ni mueve los fondeos.

## Datos y modificaciones

- Fuente primaria: [AWS Registry of Open Data — Terrain Tiles](https://registry.opendata.aws/terrain-tiles/).
- Teselas: `https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png`, zoom 9, formato Terrarium. La altura original se decodifica como `R × 256 + G + B / 256 − 32768` metros.
- Se descargaron 429 teselas y se remuestrearon bilinealmente a 105 cuadrículas de 81 × 81 muestras separadas 700 m, cubriendo aproximadamente 56 × 56 km por destino.
- `public/data/port-elevations.json` contiene alturas enteras con signo, en metros, empaquetadas como `int16` little-endian en base64. Tamaño: 1 852 584 bytes. No se consultan servicios remotos durante el juego.
- La altura visible se interpola bilinealmente, mezclando suavemente cuadrículas solapadas. Se suavizan las normales de la malla y se mantiene el detalle de la teselación cerca del jugador.
- A menos de 350 m de la **costa generalizada del juego** se adapta la altura a una orilla baja. Es una modificación deliberada para reconciliar el DEM y el mapa de distinta resolución. La tierra se mantiene al menos a 1,2 m; las alturas submarinas del DEM no crean nuevos mares interiores.
- Fuera de la cobertura de los destinos se usa relieve decorativo moderado, identificado como tal en el código. El terreno y la carta no representan sondas ni navegación real.

Las alturas son una aproximación regional de la topografía, no un levantamiento exacto de muelles, acantilados o edificios. No se añaden montañas procedurales a las zonas llanas cubiertas por DEM. Por ejemplo, las pruebas miden unos 22 m en Brooklyn y 8 m tierra adentro de Cancún, frente a 581 m al oeste de Eilat, 367 m al norte de Cabo San Lucas y 355 m en el Carmel.

## Vegetación y regiones

La clasificación visual es una decisión artística regional, **no un inventario botánico ni un mapa de uso de suelo**. Distingue matorral y pinos mediterráneos, arbolado templado, coníferas boreales, vegetación tropical con palmas, desierto, tundra sin árboles y basaltos islandeses. Las montañas altas reciben coloración de nieve según umbrales regionales de presentación. No se simulan estaciones, glaciares ni cobertura de nieve actual.

El muestreador `createTerrainSurfaceSampler(world, origin, radius)` comparte la fórmula DEM/orilla con los edificios. La carga `loadPortElevations()` se completa antes de construir la primera escena; las alturas decodificadas se comparten entre reconstrucciones sin conservar texturas GPU.

## Licencias y atribución

**Terrain Tiles / Mapzen**, con datos de **USGS**, **NOAA**, **Copernicus EU-DEM**, **INEGI**, **ArcticDEM**, **Canada CDEM**, **Kartverket**, **LINZ**, **Geoscience Australia** y otros proveedores regionales.

La atribución y las condiciones de los proveedores se conservan completas en [TERRAIN-ATTRIBUTION.md](../public/data/TERRAIN-ATTRIBUTION.md), copia de la [documentación oficial de Tilezen/Joerd](https://github.com/tilezen/joerd/blob/master/docs/attribution.md). El enlace también puede abrirse desde la aplicación como `/data/TERRAIN-ATTRIBUTION.md`. Los datos derivados se han modificado como se describe arriba; esas modificaciones no están aprobadas ni avaladas por los proveedores.

## Reproducción y comprobaciones

`python3 scripts/download-elevations.py` reconstruye el atlas mediante `curl` y la biblioteca estándar de Python. Su caché de teselas se guarda en `/tmp/deriva-terrain-tiles`; no añade dependencias al juego.

`npx vitest run tests/elevation.test.ts` comprueba cobertura, tamaño, interpretación de alturas, contrastes regionales, biomas, acuerdo entre la malla y el muestreador de edificios, y conservación de agua en las cuatro entradas de canales. `npx tsx scripts/benchmark-elevations.ts` registra construcción CPU y geometría por región en `elevation-performance.json`.
