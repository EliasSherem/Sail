# Geografía, costas y rutas

La posición autoritativa es latitud/longitud, en grados. Las distancias se calculan mediante la fórmula haversine sobre una esfera de radio medio **6 371 008,8 m**. Los rumbos y destinos usan trigonometría esférica de círculo máximo. Es un modelo terrestre simplificado, con diferencias de hasta aproximadamente 0,6 % respecto a distancias elipsoidales, no una carta náutica. Un grado ecuatorial equivale a 111 195,08 m; una milla náutica equivale exactamente a 1 852 m. El rumbo se expresa en radianes, en sentido horario desde el norte. Metros y segundos son las unidades internas.

El sistema local es una proyección azimutal equidistante centrada en el origen del renderizador: `x` apunta al este y `z` al sur. `toLocal` y `fromLocal` son inversas en el hemisferio local y no cambian la ubicación geográfica al desplazar el origen. Las longitudes se normalizan a [-180°, 180°); distancia, rumbo y destino utilizan el arco corto del antimeridiano. Los polígonos que atraviesan el meridiano 180° se dividen antes de indexarse.

## Datos incluidos y licencia

**Made with Natural Earth.** Fuente: [Natural Earth, land 1:10m, versión 5.1.1](https://www.naturalearthdata.com/downloads/10m-physical-vectors/10m-land/). [Archivo original](https://naciscdn.org/naturalearth/10m/physical/ne_10m_land.zip). [Condiciones oficiales: dominio público](https://www.naturalearthdata.com/about/terms-of-use/). Fuente y licencia comprobadas el 26 de septiembre de 2026.

**1:10m significa escala 1:10 000 000, no precisión de diez metros.** Es cartografía generalizada. No contiene batimetría, mareas, peligros sumergidos, balizamiento oficial ni detalles utilizables para navegar en el mundo real.

`public/data/land.geojson` contiene 6 035 anillos exteriores y 69 613 vértices, unos 1,94 MB sin compresión. Procede del archivo original, con simplificación topológica de 0,001° en las siguientes regiones y de 0,04° en el resto del mundo:

| Región detallada | Oeste | Sur | Este | Norte |
| --- | ---: | ---: | ---: | ---: |
| Mediterráneo occidental | −6° | 35° | 10° | 45° |
| Nueva York y Lower Bay | −74,32° | 40,40° | −73,67° | 41,00° |
| Singapur | 103,55° | 1,05° | 104,17° | 1,51° |
| Norte del golfo de Aqaba / Eilat | 34,73° | 29,32° | 35,20° | 29,79° |

Son tolerancias de simplificación, no garantías de exactitud de la fuente. Los vértices de fuente se redondean a cinco decimales; las intersecciones con los límites rectangulares conservan su precisión calculada. Fuera de las regiones detalladas se omiten polígonos menores de 0,00003 grados cuadrados. En las regiones detalladas se conservan las islas presentes en la fuente. Las aguas interiores y lagos se rellenan y están igualmente cerrados en la geometría visible y las colisiones.

Las tres ampliaciones urbanas sustituyen únicamente esos recortes del mapa anterior; no desplazan puertos ni corredores. Se comprobaron los 105 fondeos y muelles, todos los enlaces nuevos y canales, y las distancias desde Marsella: permanecen iguales. La huella completa de One World Trade Center queda sobre tierra. Natural Earth sigue sin representar Liberty Island ni con suficiente precisión la orilla del hotel de Eilat; parte de la huella de Marina Bay Sands también queda fuera de tierra. Esas referencias no se mueven artificialmente ni se dibujan sobre agua para ocultar la limitación. La [auditoría regional](coast-detail-audit.json) registra las comprobaciones y el SHA-256 del activo; una regeneración completa reprodujo exactamente sus bytes.

Se carga un mapa base mundial compacto y datos locales de relieve y edificios. Sólo se construye la escena 3D cercana al jugador. El índice espacial limita los bordes examinados por las colisiones y `polygonsNear` selecciona las costas próximas para el renderizador. La memoria global corresponde al mapa base y su índice, no a un escenario 3D de todo el planeta.

Para reproducir el activo, instalar Python 3, Shapely y pyshp en un entorno virtual y ejecutar `python docs/build_geography.py` desde la raíz. La opción `--output /ruta/temporal.geojson` permite revisar una regeneración sin sobrescribir el activo. El script descarga la fuente con `curl` usando HTTPS y verificación normal del certificado. No hace falta Python ni acceso a Internet para jugar una vez instaladas las dependencias web.

## Puertos y navegación

Hay **105 zonas portuarias conectadas**. Se incluyen los principales destinos de América, Europa, África, Asia y Oceanía, una cadena de escalas atlánticas y los puertos israelíes Haifa, Ashdod y Eilat. La [auditoría de puertos](port-network-sources.md) detalla fuentes, posiciones y corredores.

Las posiciones de servicio son fondeos de aproximación adaptados a la costa simplificada. No son coordenadas de atraques reales. Los muelles de servicio conservan huellas de 300 × 32 m a 160 m al este del punto de servicio. Los edificios y referencias visuales costeras usan datos y reconstrucciones artísticas independientes de esos servicios del juego.

La red combina corredores globales con 228 cadenas regionales nuevas. Conecta los 105 puertos en ambas direcciones y permite planificación con escalas según combustible. Las simplificaciones pueden producir rodeos respecto de rutas comerciales reales.

Cada tramo se valida al cargar contra el mismo mundo usado por la física, con margen amplio en corredores abiertos y 90 m en aproximaciones y corredores regionales; si un tramo falla, se elimina. **Gibraltar está explícitamente implementado**, con 2 km de separación geométrica en los tramos de acceso y cruce. Se utiliza Dijkstra con una cola de prioridad sobre los tramos disponibles. El grafo contiene nodos espaciados a un máximo de 25 km para poder replanear o restaurar una partida en mitad de una travesía oceánica. La posición actual se conecta a nodos del corredor a menos de 50 km únicamente si el conector también supera la validación de 90 m. Una búsqueda inversa permite comparar todos los conectores sin repetir el cálculo completo.

| Desde Marsella | Distancia directa | Ruta implementada |
| --- | ---: | ---: |
| Cassis | 9,49 mn | 16,42 mn |
| Tolón | 29,39 mn | 37,85 mn |
| Barcelona | 183,60 mn | 191,66 mn |

Las rutas evitan tierra e islas incluidas en la geometría simplificada, y se muestrean cada 10 km o menos para representar los mismos arcos geodésicos en el mapa. **Son corredores de juego, no derrotas reales.** Fuera del grafo sigue disponible la navegación libre; para replanear desde mar abierto hay que estar a menos de 50 km de un corredor. Los canales de **Panamá y Suez** están abiertos en la misma geometría que usa el renderizador, el mapa y las colisiones. Funcionan al nivel del mar, con anchuras de juego de 1400 m y 1200 m; Panamá no modela esclusas. [Fuentes, geometría y pruebas físicas](CANALS.md). Otros pasos interiores no incluidos pueden seguir cerrados. No se inventa una línea recta entre puertos no conectados.

Las travesías intercontinentales son largas y requieren escoger barco, potencia y combustible adecuados. El consumo a plena potencia puede superar la capacidad del carguero en ciertos corredores. No se acortan distancias ni se añade combustible automáticamente: la autonomía mejora reduciendo la potencia según la curva física de consumo. El mapa calcula consumo al crucero del piloto, añade una reserva del 25% y busca escalas válidas. Los repostajes posteriores requieren servicio efectivo en puerto; no se añade combustible durante la navegación. Los tramos recomendados para la demostración y las misiones iniciales siguen siendo Marsella–Cassis y Marsella–Barcelona.

## Coherencia de colisiones

Renderizador y colisiones acceden a los mismos anillos de `World.landPolygons` y a las mismas dimensiones de `World.docks`. La tierra no recibe colisiones de formas invisibles añadidas. La distancia de separación incluye tierra y muelles, y se limita a 50 km lejos de obstáculos para el control de travesía.

`World.sweep` barre un disco de radio finito contra los segmentos de la costa y los rectángulos de los muelles. Los trayectos largos se subdividen en arcos de hasta 2 km y cada subtramo usa una prueba continua segmento-segmento; no depende solo de muestrear el punto final. Devuelve el último inicio seguro del subtramo que colisiona. La física puede barrer varios discos para cubrir toda la eslora. El método es conservador y no simula una malla de contacto deformable.

Las pruebas de `tests/geo.test.ts` comprueban conversiones, distancias conocidas, proyección inversa, distancia y colisión en el antimeridiano, cruce de islas con ambos extremos en agua, radio de casco, muelles compartidos, fondeos seguros y todos los corredores mediterráneos. También verifican conectividad bidireccional entre los 105 puertos, ausencia de colisiones en los corredores atlántico/índico/pacífico, margen de Gibraltar, continuación de un viaje lejos de cualquier puerto, continuación junto al antimeridiano y cierre automático de un corredor bloqueado por geometría nueva. Las pruebas de `tests/coast-detail.test.ts` fijan la huella de One WTC y las posiciones y distancias anteriores a la ampliación regional; `tests/global-ports.test.ts` y `tests/canals.test.ts` cubren la red mundial y los pasos físicos. No se han probado cartas profesionales ni navegación real.
