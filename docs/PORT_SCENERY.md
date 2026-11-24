# Ciudades y puertos 3D

El escenario combina **huellas reales de edificios de OpenStreetMap**, elevación del atlas local Mapzen, volúmenes de monumentos modelados para el juego y tejido urbano regional de relleno. **No es una reproducción fotogramétrica ni una carta portuaria.** Las alturas se toman de `height` o `building:levels` cuando existen; el resto se estima según el tipo de edificio y el perfil de la ciudad. Los muelles de juego y sus colisiones siguen siendo ficticios y no se han desplazado.

## Datos reales sin conexión

`public/data/port-scenes/osm-buildings.json` conserva 7.716 edificios de doce áreas prioritarias: Marsella, Barcelona, Nueva York, Acapulco, Cabo San Lucas, Cancún, Veracruz, Haifa, Ashdod, Eilat, Singapur y Sídney. Nueva York combina 513 edificios costeros `new-york-shore` (Coney Island/Brooklyn) y 227 edificios de Lower Manhattan con alturas etiquetadas o derivadas de plantas superiores a 50 m. La consulta acotada de Manhattan abarca 40.699, −74.023 a 40.721, −73.991 y produjo 3.172 elementos antes de normalizar y filtrar. Se descartaron etiquetas de contacto, nombres de particulares y demás metadatos innecesarios; sólo quedan ID OSM, ubicación, contorno, área, tipo y altura disponible.

La selección reparte edificios por celdas de 175 m, favoreciendo los volúmenes mayores y las alturas etiquetadas. Se eliminan vértices prácticamente colineales con tolerancia de 0,45 m y se limitan contornos a 32 vértices. Esto conserva la posición y forma general real, con simplificación explícita. Es una muestra del tejido urbano, no el inventario completo. `osm-manifest.json` describe centros, radios, límites y resultados de consulta. Todas las peticiones de datos durante el juego son locales; Overpass se utiliza sólo al preparar el atlas.

El normalizador reproducible es `scripts/download-port-scenes.py`. Por defecto sólo lee respuestas guardadas y conserva las áreas sin caché: `python3 scripts/download-port-scenes.py --cache-dir /tmp`. Una descarga nueva requiere una única zona explícita, por ejemplo `python3 scripts/download-port-scenes.py --port new-york --fetch`. Realiza un solo intento, sin reintentos automáticos ni descargas masivas. La selección especial de Manhattan conserva hasta 400 edificios altos; el render prioriza los edificios próximos y después las mayores alturas lejanas, compartiendo el presupuesto de 750 edificios del puerto principal.

**© OpenStreetMap contributors.** Base derivada disponible aquí bajo [Open Database License 1.0](https://opendatacommons.org/licenses/odbl/1-0/). [Copyright y atribución OSM](https://www.openstreetmap.org/copyright). Puede copiarse y redistribuirse el JSON derivado bajo esa licencia. El código y los modelos procedurales no se presentan como datos OSM. Las descargas usaron los servicios públicos `https://overpass-api.de/api/interpreter` y, para Veracruz, `https://overpass.kumi.systems/api/interpreter`.

## Diferencias visuales deliberadas

| Puerto | Composición |
|---|---|
| Marsella | Huellas urbanas densas, fachadas claras y tejas, basílica de Notre-Dame de la Garde y catedral de la Major. |
| Barcelona | Manzanas compactas, Port Vell, hotel en forma de vela, columna y terminal de contenedores. |
| Nueva York | Edificios costeros reales, barrio litoral bajo y torres reales de Lower Manhattan. One World Trade Center conserva sus coordenadas, a unos 31 km del fondeo exterior. |
| Acapulco | Edificios y hoteles de la bahía, diferencias de altura y tonos claros sobre la ladera. |
| Los Cabos | Construcciones bajas de marina, tejas y paleta desértica; no se inventa el Arco sobre agua sin colisión. |
| Cancún | Huellas de hoteles litorales y relleno de complejos claros escalonados. |
| Veracruz | Tejido histórico bajo, faro, almacenes, contenedores y grúas. |
| Haifa | Edificios adaptados al Carmelo, cúpula dorada y terminal industrial. |
| Ashdod | Bloques claros de mayor altura, grúas y superficie de almacenamiento. |
| Eilat | Volúmenes de hoteles y ciudad baja en entorno desértico. |
| Singapur | Torres densas y terminales del litoral sur. |
| Sídney | Ciudad del CBD, cubiertas curvas puntiagudas inspiradas en la Ópera, torre mirador y servicio de ferris. |

Los 105 puertos tienen perfil regional de arquitectura, paleta, cubiertas, densidad, alturas, trama y función (marina, contenedores, ferris, pesca o graneles). Los asentamientos árticos no se convierten en metrópolis: Saglek y Prins Christian Sund tienen sólo pequeños conjuntos. Las formas fuera del atlas son aproximaciones procedurales, con semillas estables por puerto, no edificios reales identificados.

## Geografía, colisiones y límites

Antes de admitir una construcción se comprueban el centro, todos los vértices y los puntos medios de sus lados contra `World.isLand`. Se muestrea la misma superficie DEM que el terreno y se descartan pendientes incompatibles. No se agregan islas, terrenos ganados al mar ni obstáculos invisibles a los corredores navegables. El terreno costero simplificado puede rechazar edificios reales que en la realidad están sobre rellenos o islas pequeñas.

La costa local de mayor detalle admite One World Trade Center en sus coordenadas reales. Se siguen rechazando la Estatua de la Libertad, Marina Bay Sands y el hotel señalado de Eilat si alguna muestra de su base queda fuera de tierra. Sus coordenadas se conservan en los perfiles y se registra su exclusión; no se trasladan arbitrariamente al muelle de juego. También se admiten los hitos de Marsella, Barcelona, Haifa, Veracruz y Sídney. No se añaden puentes que atraviesen agua sin una solución física para su gálibo.

`group.userData` informa `osmAccepted`, `osmRejected`, hitos admitidos/rechazados, número de edificios, triángulos y draw calls. Las bases de validación se conservan en `footprints`. La generación se limita a 1.000 edificios en el grupo, cinco puertos cercanos y seis lotes de materiales; las ventanas usan textura original y emisión moderada, sin miles de luces ni mallas por ventana. Todos los materiales respetan la niebla meteorológica. Los hitos lejanos no fuerzan visibilidad durante una tormenta.

## Integración y pruebas

Cargar `preloadPortSceneryData()` junto al World y el DEM antes de generar el primer terreno. Añadir `createPortScenery(world, origin, radius, surfaceAt)` después de construir el terreno; `surfaceAt` debe proceder de `createTerrainSurfaceSampler` para compartir altura. El grupo se limpia mediante `disposeObject`, incluidas sus texturas.

Pruebas CPU: `npx vitest run tests/port-scenery.test.ts`. Comprueban las doce áreas con el World y DEM reales, bases totalmente terrestres, geometría finita, seis draw calls como máximo, presupuesto de memoria, perfiles diferentes y ausencia de construcciones sobre un World de agua. `public/data/port-scenes/validation.json` registra las mediciones de generación iniciales.

## Referencias primarias de diseño

- [Marsella: bassins Est/Ouest y funciones de terminales](https://www.marseille-port.fr/les-bassins).
- [Barcelona: plano oficial del puerto](https://contentv5.portdebarcelona.cat/cntmng/gd/d/workspace/SpacesStore/a58cc162-b879-4784-9528-c8d77dbf4c0a/20250521_Planol_Guia_A3.pdf).
- [New York/New Jersey: mapa de instalaciones de la Autoridad Portuaria](https://www.panynj.gov/content/dam/port/customer-library-pdfs/211215_JV_PORT_Port%20Facilities%20Map_V3.pdf).
- [Acapulco: Administración del Sistema Portuario Nacional](https://puertoacapulco.com.mx/).
- [Los Cabos: marina y carácter del destino](https://www.visitloscabos.travel/places-to-visit/cabo-san-lucas/) y [Arco de Cabo San Lucas](https://www.visitloscabos.travel/places-to-visit/the-arch-of-cabo-san-lucas/).
- [Cancún: organismo de promoción del Caribe Mexicano](https://caribemexicano.travel/destino/cancun/?event=266).
- [Veracruz: mapa oficial de instalaciones](https://www.puertodeveracruz.com.mx/infraestructura/mapa-de-instalaciones/).
- [Haifa: conexión de la terminal con la ciudad](https://www.haifaport.co.il/en/contacts-and-directions/) y [terrazas y cúpula del Santuario del Báb](https://ganbahai.org.il/visit-us-haifa/).
- [Ashdod: equipos, muelles y grúas](https://www.ashdodport.co.il/english/AboutAshdodPort/Facilities/pages/cranes.aspx).
- [Eilat: infraestructura portuaria](https://eilatport.co.il/infrastructure/).
- [Singapur: terminales de la Maritime and Port Authority](https://www.mpa.gov.sg/port-marine-ops/operations/port-infrastructure/terminals) y [arquitectura de Marina Bay Sands](https://www.marinabaysands.com/guides/exceptional-experiences/marina-bay-sands-architecture.html).
- [Sídney: arquitectura y cubiertas de la Ópera](https://www.sydneyoperahouse.com/our-story/jorn-utzon).

Las referencias informan la ubicación general y la morfología; sus fotografías o mapas no se han redistribuido como texturas del juego.
