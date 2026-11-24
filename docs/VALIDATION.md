# Registro de validación

Última revisión: 29 de septiembre de 2026 en macOS, Node.js 24.14.1 y Google Chrome 153. Los informes enlazados distinguen pruebas numéricas, viajes físicos ejecutados y recorridos de interfaz. La emulación táctil usa Chrome de escritorio: no se probaron teléfonos físicos ni otros navegadores.

## Patagonia, paso Drake y Antártida · 29 de septiembre

Se añadieron **14 destinos**, para un total de **293**: Puerto Montt, Puerto Chacabuco, Puerto Natales, Punta Arenas, Ushuaia, Puerto Williams, Cabo de Hornos, Bahía Blanca, Puerto Madryn, Puerto Deseado, Río Gallegos, Bahía Fildes (isla Rey Jorge), Isla Decepción y Port Lockroy. Los fondeos nuevos quedan como máximo a 5,5 km de su referencia regional. Los servicios antárticos y de Hornos son ficticios; no se añadió una escala en medio del océano ni se modificó la autonomía de los barcos.

- **Geografía:** 662 cadenas generadas, 1141 nodos adicionales y cero conexiones fallidas. Los 293 destinos tienen ruta desde la red mundial, casco del carguero colocable y muelles fuera de tierra. Las pruebas australes comprueban conexiones de ida y vuelta con Ushuaia y ambas costas existentes. [Red global](global-network-audit.json), [corredores](ocean-route-audit.json), [fuentes](port-network-sources.md).
- **Travesía física:** Bruma 24 completó **Ushuaia → Hornos → Fildes → Port Lockroy**, 1471,74 km y 74,47 horas simuladas, con cero colisiones y repostajes únicamente tras llegar y frenar en Hornos y Fildes. Cruzó realmente las latitudes del Drake usando el motor de pasos fijos con 1000× solicitado. En Hornos–Fildes consumió 1802,64 L frente a los 3261,35 L previstos; llegó con 2997,36 L y una reserva exigida de 815,34 L. La llegada final quedó a 22,65 m y 0,749 m/s. [Informe reproducible](../artifacts/drake/fishing-ushuaia-port-lockroy.json), comando `npm run test:drake-voyage`.
- **Navegador de producción:** nueva partida seleccionando Bruma 24 y Ushuaia desde la interfaz; planes factibles a Fildes y Lockroy, conservación de barco/posición/combustible y 293 opciones en ambos selectores. Capturas revisadas de Ushuaia, Fildes, Decepción y Lockroy. Cero errores JavaScript/WebGL y solicitudes externas. [Informe](../artifacts/drake/browser-report.json), comando `npm run test:drake-browser`.
- **Paisaje:** bases pequeñas de 16, 5 y 3 edificios en Fildes, Decepción y Lockroy, sin terminales industriales ni árboles antárticos. Terreno polar nevado y costa volcánica diferenciada en Decepción. Muelles de juego conservan sus colisiones con equipo bajo. Son representaciones regionales procedurales; estos destinos no añaden un DEM ni edificios OSM nuevos.
- **Husos:** Ushuaia, Río Gallegos, Magallanes y Coyhaique con zonas IANA regionales; Fildes usa el horario de Punta Arenas y las escalas estacionales Decepción/Lockroy una convención operativa UTC−03 explícita. Se verificaron enero y julio, y se conservó el horario estacional de Puerto Montt.

Suite completa `npm test -- --maxWorkers=2`: **497 pruebas aprobadas en 39 archivos**, 103,13 s. Incluye las 6 regresiones de rutas Drake y 20 de paisaje/husos australes, además de navegación, combustible, canales, fauna, cámaras, guardado y multiplicadores existentes.

`npm run build` aprobado: **1291,50 kB JavaScript / 362,77 kB gzip**, 65,79 kB CSS. Permanece el aviso informativo de bloque mayor de 500 kB. Las cifras y recorridos del apartado siguiente corresponden a la revisión previa de 279 puertos.

## Revisión anterior: rutas largas, renders y tiempo · 27 de septiembre

Esta revisión tenía **279 puertos**, 174 más que la anterior. Se comprobaron geométricamente las nuevas conexiones y las escalas de los cuatro barcos pequeños. La calibración de combustible se comparte entre el motor físico y el planificador; cada presupuesto conserva la reserva adicional del 25%.

La suite completa `npm test -- --maxWorkers=2` aprobó **471 pruebas en 37 archivos** en 90,99 s. Incluye escalas, geografía, pilotaje, clima, persistencia, cámaras, 1000× y husos. Las inicializaciones de la red de 279 puertos tienen un límite de 15 s para no confundir el coste de construcción en frío con un fallo de navegación cuando se ejecutan varios archivos a la vez.

`npm run build` pasa TypeScript y Vite: **1.267,47 kB JavaScript / 357,05 kB gzip** y 65,79 kB CSS. El bloque de JavaScript sigue superando el umbral informativo de 500 kB; este aviso no impide compilar ni ejecutar. Después del ajuste final de la consola del remolcador se repitieron sus 33 comprobaciones de geometría/cámaras, todas aprobadas.

- **16/16 planes factibles**: lancha, yate, Vector y Spirit en Marsella–Nueva York, Marsella–Haifa, Acapulco–Los Cabos y Cancún–Veracruz. Se revisan combustible, servicios y corredor libre por etapa. [Informe](../artifacts/long-voyages/plans.json).
- **Spirit Marsella–Nueva York ejecutado físicamente**: 29 etapas, 14.658,15 km recorridos, 153,04 horas simuladas y 14.769,62 L consumidos sumando los repostajes. Cero contactos y todas las llegadas conservaron la reserva; el margen mínimo sobre ella fue 29,70 L. [Informe](../artifacts/long-voyages/spirit-marseille-new-york.json).
- **Lancha Marsella–Haifa ejecutado físicamente**: 11 etapas, 4.635,02 km, 118,05 horas simuladas y 1.211,82 L consumidos. Cero contactos; margen mínimo sobre la reserva de 181,47 L. [Informe](../artifacts/long-voyages/launch-marseille-haifa.json).
- Los siete cascos tienen nuevos acabados PBR, cristales, bandas de flotación, rótulos y detalles propios. Las 33 pruebas de geometría y cámaras conservan las dimensiones físicas, ojos despejados y presupuesto inferior a 60.000 triángulos por barco.
- Se revisaron las siete embarcaciones en primera persona, tercera persona y órbita, con capturas del juego y cero errores. [Informe visual](../artifacts/voyage-upgrade/models-report.json).
- **1×, 5×, 20×, 100× y 1000×** comparten el tiempo físico y solar, con pasos de 1/30 s. Cerca de costas y llegadas siguen reduciéndose automáticamente. Las partículas y animales mantienen su reloj de animación. El sol se compone después de la imagen HDR para que esta no lo oculte.
- **Navegador: rutas**. Ocho planes atlánticos/mediterráneos activados con los cuatro barcos pequeños; 279 destinos disponibles, combustible y reserva visibles en cada etapa, sin cambios de barco, posición ni combustible al planificar. Cero errores JavaScript/WebGL y peticiones externas. [Informe](../artifacts/voyage-upgrade/renders-report.json).
- **Regresión de combustible**: un Spirit vacío en mar abierto no puede activar un itinerario imposible; un yate desviado con 250 L inserta Palma antes de Barcelona y conserva Cartagena como destino posterior. Repetir piloto con botón/tecla no duplica escalas ni altera barco o combustible. [Informe actualizado](../artifacts/fuel-navigation/report.json).
- **Actualización en caliente**: `test:clock-refresh` reemplaza temporalmente el módulo del motor en Vite y confirma que conserva barco, posición, combustible, UTC y selección 1000×, sin recargar la página. Después conduce físicamente a 1000×. El archivo se restaura exactamente al finalizar; cero errores. [Informe](../artifacts/voyage-upgrade/refresh-report.json).
- **Navegador: tiempo y husos**. Las cinco escalas avanzan el mismo reloj. El ensayo 1000× integró **12.032,90 s**, recorrió **170,79 km** y consumió **86,79 L** en unos 12 s reales; la escena pasó visualmente de tarde a noche. El reloj local terminó a las 20:42, con hora solar 20,80 h. Se probaron guardado/restauración, UTC−04:00 en Nueva York, −05:00 en Cancún, −07:00 en Los Cabos y +03:00 en Haifa/Eilat, con fecha fija 2026-09-27. El barco cruzó físicamente el meridiano −7,5° y el reloj pasó de UTC−01:00 a UTC+00:00. Controles accesibles en 390×844 y 844×390. [Informe](../artifacts/voyage-upgrade/time-report.json), [tarde](../artifacts/voyage-upgrade/1000x-sunset-before.png), [noche](../artifacts/voyage-upgrade/1000x-night-after.png).

El reloj conserva un instante UTC y aplica zonas IANA a menos de 25 km de los 279 puertos; el horario de verano lo resuelve `Intl` según la fecha simulada. Fuera de esos radios usa franjas marítimas de 15°, sin fingir una cartografía global de fronteras horarias. La hora solar media usa la longitud continuamente; el modelo no calcula estaciones ni amaneceres astronómicos exactos. Datos contrastados con [IANA](https://data.iana.org/time-zones/tzdb/zone1970.tab).

Las travesías físicas rellenan únicamente tras llegar a la boya, frenar y atracar. La siguiente etapa se prepara desde la posición y clima reales, sin teletransportar ni resetear el rumbo. Estos informes sustituyen las limitaciones y cifras de combustible de las revisiones históricas que siguen.

## Revisión anterior: HUD y Vector 38

Esta revisión añade el panel de navegación compacto, el speedboat Vector 38 y el cambio de barco junto al puerto. Cada recorrido de navegador conserva su informe; las pruebas de recálculo de rumbo, combustible, puertos y fauna que se indican más abajo pertenecen a sus revisiones anteriores.

| Comprobación final | Resultado |
| --- | --- |
| Suite completa `npm test -- --maxWorkers=4` | Aprobado: **409 casos en 33 archivos**, incluidos Vector 38, cambio de barco, desvíos, escalas por combustible, piloto guardado, climatología y llegada con huracán. |
| `npm run build` | TypeScript y Vite correctos. JavaScript: **1.129,56 kB minificados / 325,89 kB gzip**. Permanece el aviso de bloque mayor de 500 kB. |
| `npm run test:hud` contra producción | Aprobado: cinco tamaños de pantalla y servicios de puerto en móvil, mandos accesibles y vista central despejada. [Informe](../artifacts/hud-layout/report.json). |
| `npm run test:speedboat` contra producción | Aprobado: siete grupos de comprobaciones de selección, cambio junto al puerto, guardado, rutas y navegación real. Vector 38 alcanzó **218,43 km/h**. Sin errores JavaScript/WebGL ni solicitudes externas. [Informe](../artifacts/speedboat/report.json). |
| `npm run test:replanning` contra producción | Aprobado: dos desvíos mediante controles reales y reactivación por botón y T, más ruta costera Marsella–Cassis; cero errores JavaScript/WebGL ni solicitudes externas. [Informe](../artifacts/replanning/report.json). |
| `npm run test:fuel-navigation` contra producción | El caso de rechazo atlántico de esta revisión quedó sustituido por el barco vacío en mar abierto; véase el informe actualizado al inicio. La regresión de Palma sigue aprobada. |
| `npm run test:world` contra producción | Aprobado: cinco grupos de comprobaciones, sin errores JavaScript/WebGL ni solicitudes externas. [Informe](../artifacts/world-expansion/browser-report.json). |
| `npm run test:navigation-regressions` contra producción | Aprobado: ocho comprobaciones, Chrome 153; sin errores ni solicitudes externas. [Informe](../artifacts/navigation-regressions/report.json). |
| `npm run test:ports-visual` contra producción | Aprobado: 14 puertos, capturas revisadas; 58–60 FPS en los muestreos del HUD, sin errores ni solicitudes externas. Es la revisión anterior al último ajuste de fauna. [Informe](../artifacts/port-realism/report.json). |
| `npm run test:browser` contra producción | Aprobado: 13 comprobaciones funcionales tras los ajustes de navegación. [Informe](../artifacts/browser-results.json). |
| Movimiento y orientación de fauna | `test:marine-animation` aprobado en Chrome: 29 capturas, tres vídeos y comprobación de independencia del observador; cero errores JavaScript/WebGL ni peticiones externas. Revisados ascenso y descenso de los cinco delfines y capturas del juego real. [Informe](../artifacts/marine-animation/report.json), [capturas y vídeos](../artifacts/marine-animation/review.html). |

## Panel de navegación y cambio de barco

La información del viaje queda en una tarjeta compacta al borde inferior, con detalles desplegables. La minicarta se puede plegar y empieza cerrada en pantallas pequeñas. Velocidad, potencia, timón, combustible, piloto y controles de cámara siguen accesibles. La distancia acumulada y las coordenadas están en los detalles del viaje; la distancia restante de la etapa sigue visible.

`test:hud` pasó contra la compilación de producción en **1440×1000, 1366×768, 1024×650, 390×844 y 844×390**. Comprueba que los paneles no invaden el corredor central de navegación, que sus controles reciben entrada, expansión del viaje y mapa, primera/tercera persona, navegación real y activación del piloto. También prueba repostaje, reparación y salida de puerto en móvil. Cero errores JavaScript/WebGL ni solicitudes externas. Se revisaron capturas de escritorio, móvil vertical y horizontal. [Informe](../artifacts/hud-layout/report.json).

La flota mantiene la confirmación fuera del área desplazable de tarjetas e identifica por separado **Seleccionado** y **A bordo**. A menos de 1 km de la boya y por debajo de 0,85 m/s sobre el fondo permite **Atracar y cambiar de barco**; ya atracado, permite cambiar directamente. Conserva posición y rumbo exactos, tiempo, distancia y ruta, y apaga el piloto anterior. Comprueba el espacio del casco antes de aplicar el cambio. Las 11 pruebas específicas cubren disponibilidad, corriente, velocidad, casco demasiado grande, carga, viaje y guardado.

## Vector 38

Speedboat ficticio de 11,6 m, casco en V y doble fuera de borda. Se sitúa entre los barcos de recreo y el Spirit, con unos **220 km/h**, crucero de 75 kn y depósito de 1400 L. Tiene geometría 3D y dibujo de flota propios, asiento de cámara de primera persona, planeo, inclinación y salpicaduras. Los parámetros son una calibración de juego.

Las pruebas físicas verifican aceleración progresiva, mayor radio de giro a alta velocidad, agarre lateral, frenado y reversa limitada. Cubren 330 km a máxima potencia con reserva del 25%, guardado en movimiento y una travesía física Marsella–Barcelona con clima evolutivo, combustible suficiente y cero contactos.

El recorrido de navegador realizó **13,29 km en 233,30 segundos simulados**, alcanzó **218,43 km/h**, gastó **28,55 L** y no produjo daños. Se revisaron las capturas de sus tres cámaras, incluyendo visión delantera desde el puesto de mando y estela a máxima potencia. Verificó selección inicial, rutas a Cassis y La Ciotat, cambio desde un yate atracado, cambio junto a la boya tanto en escritorio como móvil y conservación después de guardar y continuar. La cancelación no aplica barco ni carga; mar abierto y velocidad excesiva muestran la razón de indisponibilidad. [Informe y estados](../artifacts/speedboat/report.json).

## Red mundial, costas y canales

Hay **105 destinos** en América, Europa, África, Asia y Oceanía. Se incluyen Acapulco, Los Cabos, Cancún, Veracruz y Manzanillo; Haifa, Ashdod y Eilat; y una cadena de escalas por el Atlántico norte. Sus nombres y regiones son reales; los puntos de servicio y muelles son adaptaciones simplificadas mar adentro. No se presenta el atlas como un catálogo de todos los puertos del mundo.

Las auditorías comprueban que los 105 destinos son alcanzables por la red, que el carguero cabe en cada salida y que los muelles completos quedan en agua. Los corredores se verifican contra los mismos polígonos que usa la colisión. La cadena septentrional propuesta tiene un salto máximo de **732,56 km**, entre Pangnirtung e Iqaluit; la viabilidad con combustible depende del barco y condiciones. [Red](global-network-audit.json), [emplazamientos](port-placement-audit.json), [fuentes y método](port-network-sources.md).

Panamá y Suez tienen pasos abiertos en la geometría de costa: la carta, el terreno y las colisiones comparten el agua navegable. Se probaron barridos continuos del casco y cuatro tránsitos físicos. Sus ejes y anchuras son deliberadamente simplificados; no se simulan esclusas ni desniveles. [Canales](CANALS.md).

Natural Earth 1:10.000.000 utiliza tolerancia de 0,001° en el Mediterráneo occidental y ventanas de Nueva York, Singapur y Eilat, y 0,04° fuera. La revisión regional conserva los emplazamientos y las distancias de ruta de los 105 destinos y mantiene los canales abiertos. El archivo final tiene **6.035 anillos, 69.613 vértices y 1.939.499 bytes**. El control focal de geografía, red mundial, costa y canales pasó **40 pruebas en cuatro archivos**. [Auditoría de costa](coast-detail-audit.json), [método reproducible](GEOGRAPHY.md).

## Relieve y puertos 3D

El atlas DEM contiene **105 regiones**, cada una con una cuadrícula de 81×81 muestras separadas 700 m y cobertura aproximada de ±28 km. Se generó a partir de 429 teselas Mapzen Terrarium; ocupa 1.852.584 bytes. Las alturas reales del interior se concilian con la costa generalizada mediante una transición litoral, y terreno y edificios comparten el mismo muestreo de altura. Fuera de la cobertura existe relieve decorativo de respaldo. [Datos y método](ELEVATION.md), [auditoría](elevation-audit.json).

Las pruebas contrastan Nueva York y Cancún bajos con los relieves de Eilat, Los Cabos y el Carmelo; verifican biomas y vegetación regional, el muestreo de la malla construida y las entradas de canales. Tras refinar la costa, el máximo de la malla de Eilat se mide sobre sus **12.943 vértices**: alcanza **592,12 m**. El muestreo reducido se mantiene solo para comparar alturas con el generador de edificios. Las **12 pruebas de elevación** pasan; no se rebajó el umbral de altura para acomodar el cambio de triangulación.

El atlas local contiene **7.716 huellas OpenStreetMap en doce áreas prioritarias**: Marsella, Barcelona, Nueva York, Acapulco, Los Cabos, Cancún, Veracruz, Haifa, Ashdod, Eilat, Singapur y Sídney. Las alturas usan etiquetas cuando existen y estimaciones cuando faltan. Los 105 destinos añaden perfiles regionales de arquitectura; hay relleno artístico donde falta cobertura. Las bases de los edificios se comprueban contra tierra y el DEM. No es fotogrametría ni una reproducción exacta de instalaciones portuarias. [Composición, licencia y límites](PORT_SCENERY.md).

El mayor detalle costero permite la base completa de One World Trade Center en sus coordenadas reales. Liberty Island no aparece en la fuente costera, y las bases completas propuestas de Marina Bay Sands y del hotel de Eilat no pasan la comprobación terrestre; esos monumentos se omiten, sin trasladarlos a coordenadas inventadas. One WTC está a unos 31 km del fondeo de Nueva York, por lo que su visibilidad depende de posición, cámara y clima.

## Escalas, combustible y persistencia

La estimación funciona desde reposo, neutral o atraque y calcula, por segmento, el mayor consumo entre crucero del piloto y máxima potencia. Usa las fuerzas y caudales reales del juego, carga y daño; contempla una envolvente de viento/corriente del clima sintético y un presupuesto separado de aceleración, frenado y giros. Añade una reserva del **25% de ese consumo**. Carta y misiones comparten el cálculo. **Fijar rumbo** queda deshabilitado si el itinerario es imposible. Un plan que requiere repostar en el puerto actual sí puede fijarse, pero no permite iniciar el piloto antes del servicio.

El planificador conserva el barco, combustible y posición. La primera etapa usa el combustible actual; las siguientes suponen depósitos llenos después de un repostaje que debe realizar el jugador. Atracar exige estar **a un máximo de 1 km y por debajo de 0,85 m/s**, sin desplazar el barco hasta el puerto. En una escala, repostar y preparar la siguiente etapa conserva la posición y selecciona el nuevo destino. El piloto se apaga al atracar y permanece apagado al soltar amarras. Es un radio de servicio de juego, no una maniobra de amarre contra un muelle exacto.

El nuevo plan **Marsella–Nueva York con pesquero** tiene **21 etapas y 20 repostajes**. Se ejecutó completo: **15.672,93 km físicos, 34,231 días simulados y cero contactos**. Consumió 35.055,95 L y llegó con 3.629,36 L; la menor cantidad al llegar a una escala fue 2.663,05 L de los 4.800 L de capacidad. En las 21 etapas el consumo real quedó por debajo de la previsión, incluso antes de sumar la reserva. Se probaron calma evolutiva, carga del 35% y semilla 4821. El plan del carguero tiene una etapa; yate y Spirit se rechazan por una brecha entre escalas con este presupuesto conservador. [Resumen actual](../artifacts/planning/itinerary-summary.json), [estados y etapas](../artifacts/planning/itinerary-report.json).

También se ejecutaron seis recorridos manuales de 10 km a máxima potencia: todos quedaron dentro del consumo presupuestado. Incluyen aceleración, pero se midieron todavía en marcha; el pronóstico añade además frenado/llegada. Spirit completó Marsella–Barcelona con huracán: 656,70 L reales, 243,30 L finales, cero contactos y llegada a 48,28 m de la boya. Se corrigió el bucle de aproximación que antes impedía completar a unos 34 m. Su presupuesto con reserva es 992,48 L, por lo que el planificador exige una escala en esas condiciones. [Auditoría física de consumo](../artifacts/planning/fuel-conservative-audit.json).

En la revisión anterior, con el presupuesto de crucero, el cruce **Marsella–Nueva York con pesquero se ejecutó físicamente**: 11 etapas, 10 atraques y repostajes, **15.511,50 km**, 33,873 días simulados y ningún contacto. Consumió 34.698,10 L en total; la menor cantidad al llegar a una escala fue 980,20 L y terminó con 2.029,33 L. Los planes anteriores de yate (29 etapas) y carguero (una etapa) no se ejecutaron físicamente. Estas cifras son históricas: el nuevo presupuesto de máxima potencia revela una brecha atlántica de autonomía para el yate, además de la del Spirit. [Informe anterior de etapas y estados](../artifacts/planning/itinerary-report-legacy-cruise.json), [metodología](FUEL_ITINERARIES.md).

La comparación histórica de consumo a crucero ejecutó Marsella–Cassis con los seis barcos: los errores estimado/real van de **−16,94% para Spirit a +21,33% para el carguero**; la reserva del 25% cubre los seis ensayos. Las filas de Barcelona del mismo informe son previsiones, no seis travesías adicionales. El yate requiere aproximadamente 901 L más 225 L de reserva. Spirit, con su depósito actual de 900 L, completó por separado Marsella–Barcelona sin contactos y con 411,5 L restantes. [Comparación](../artifacts/planning/fuel-estimates.json), [calibración de Spirit](SPIRIT_OF_AUSTRALIA.md).

La distancia del HUD es la recorrida acumulada. La tarjeta y minicarta muestran la longitud restante de la **etapa activa**, recalculada también en navegación manual; el total del itinerario aparece en la carta. La regresión de navegador observa **29.746,38 m restantes hacia Cassis**, iguales en minicarta y panel, cuando el barco está a solo 0,41 m del origen en Marsella. El destino ya no se confunde con el puerto más cercano.

Al activar el piloto, tanto el botón como `T` reconstruyen la ruta desde las coordenadas actuales al puerto de la etapa activa y reinician el índice de puntos pendientes. Conservan el mismo viaje, barco, combustible, posición y controles físicos. Si el combustible ya no cubre la etapa, buscan e insertan escalas de servicio antes del próximo puerto; conservan el destino final y las paradas posteriores. Sin escala alcanzable con reserva, el piloto no se activa. Una revisión cada cinco segundos reales comprueba el tramo pendiente durante el piloto, y pausa la navegación si no puede resolver una nueva falta de autonomía. Restaurar una partida valida de nuevo el piloto con el clima de su tiempo simulado; no confía ciegamente en una activación guardada. La navegación manual renueva el trazado tras 50 m de desplazamiento, como máximo dos veces por segundo real. Ambas cartas dibujan el recorrido pendiente desde el barco y eliminan los segmentos ya navegados. Una ruta no verificable se oculta y no activa el piloto. La maniobra inicial junto a muelles también descarta decisiones antiguas si cambia la ruta.

Las pruebas CPU cubren desvíos en mar abierto, Calanques, costa con una recta bloqueada y pasos de Panamá/Suez; todos los segmentos nuevos conservan el barrido de 90 m. También comprueban guardas, pausa, cadencia, recuperación tras un fallo y conservación exacta del estado físico y las escalas. El planificador mantiene su límite de conexión de 50 km a la red y puede rechazar una posición demasiado próxima a tierra; en ese caso no reutiliza una ruta obsoleta como alternativa.

La misma regresión verifica que una llegada completada sigue completada al guardar y continuar; que atracar y soltar amarras no reinicia el piloto; que aceptar una misión cuyo destino ya está al alcance muestra un aviso sin sustituir otra ruta; y que fijar Barcelona conserva Spirit y su combustible. La previsión visible actual de Spirit fue de **aproximadamente 634 L incluyendo la reserva**, con 900 L a bordo. [Ocho comprobaciones de navegador](../artifacts/navigation-regressions/report.json).

`test:selection`, ejecutado con Vite en desarrollo, comprueba conservación del barco y ruta durante una actualización real de módulos y al guardar/continuar. Repite tras cambiar de embarcación en puerto. Añade temporalmente un comentario a `App.tsx` y lo restaura al terminar; no debe ejecutarse contra `preview`. [Reproducción anterior](../artifacts/planning/selection-before.json), [corrección verificada](../artifacts/planning/selection-after.json).

## Interfaz, clima, luz y fauna

`test:planning` aprobó diez grupos de comprobaciones: seis disposiciones (1440×900, 1366×768, 1024×650, 820×650, 768×1024 y 390×844), doce rutas regionales y selector de más de cien destinos, previsiones desde reposo para seis barcos, conservación del barco al fijar rutas/misiones, avisos de repostaje previo y entrada táctil. Este informe es anterior al bloqueo de itinerarios imposibles. No hubo errores JavaScript/WebGL, solicitudes externas ni solapamiento de cámaras con la minicarta. [Informe](../artifacts/planning/report.json).

`test:world` comprueba **105 opciones**, incluidos México e Israel; zoom por rueda y botones centrado en el jugador después de arrastrar; atraque a 900 m y rechazo a 1100 m, sin teletransporte; guardado/restauración del itinerario atlántico; repostaje y cambio real a la siguiente etapa. Las pantallas móviles a 390×844 conservan controles accesibles y no desbordan horizontalmente. [Informe](../artifacts/world-expansion/browser-report.json).

El mismo recorrido selecciona lluvia, tormenta y huracán, además de amanecer, día, atardecer y noche, sin errores de shaders. Comprueba persistencia de la velocidad del ciclo y de la opción de vida marina. Los seis estados meteorológicos son sintéticos; no consultan pronósticos reales. El día completo dura 12 minutos reales por defecto, configurable a 30 minutos o 24 horas, se congela en pausa y no se acelera con el 100× de navegación.

Delfines, ballena y gaviotas tienen un encuentro anclado a coordenadas geográficas, con rumbo y velocidad propios. Mover, girar o acelerar el barco no los arrastra. La proyección recibe el origen exacto del render: las pruebas conservan posición al cambiar el observador y al reajustar ese origen. No se repone automáticamente el grupo cerca del jugador cuando se aleja; una nueva simulación crea otro encuentro. Son animales decorativos, no un ecosistema persistente.

Los cinco delfines alternan vuelos balísticos de 1,05–1,29 s con varios segundos sumergidos. La nariz sigue la tangente de la trayectoria y la cola deja de batir en el aire. La ballena emerge lentamente y anticipa la costa con una inmersión amortiguada. Las 13 pruebas cubren fases, continuidad, rumbo propio, independencia del barco, pausa, cambios de origen, costa y presupuestos. La revisión visual registró dos secuencias de 12 s a 721 fotogramas cada una y una salida real con acelerador al 100%: **117,68 m recorridos**, velocidad final **13,70 m/s**, sin errores. Se inspeccionaron las capturas de ascenso y descenso de todos los delfines y las del juego a 0, 6 y 12 s; los vídeos quedan disponibles para reproducción.

## Mediciones de rendimiento y alcance

El benchmark CPU de la red ampliada integró **15.000 pasos / 500 s simulados** de carguero con colisiones en **99,03 ms**, equivalentes a **0,33 ms por fotograma a 100× y 60 Hz**. Excluye renderizado, carga de recursos y React: no es una medición de FPS. [Salida del benchmark](../artifacts/world-expansion/physics-benchmark.txt).

El generador de terreno con DEM tardó en Marsella **406,56 ms en frío y 260,63–285,67 ms en repeticiones**. Otros casos medidos costaron 35,62 ms en Nueva York, 115,69 ms en Cancún, 155,44 ms en Eilat, 77,30 ms en Los Cabos, 36,55 ms en Nuuk y 48,26 ms en Singapur. Son mediciones CPU de terreno anteriores al último refinamiento costero y excluyen PortScenery y GPU; no describen la carga completa del juego. El origen se reajusta cada 2 km reutilizando terreno y este se reconstruye al alejarse unos 8 km. [Registro](elevation-performance.json).

Las cifras de FPS de las pruebas históricas siguientes pertenecen a escenas concretas de este equipo. No garantizan esas tasas con todos los edificios, clima o hardware. La revisión de 14 puertos registró 58–60 FPS en capturas puntuales del HUD; no es una distribución de tiempos de fotograma ni un benchmark sostenido. Incluyó Acapulco, Los Cabos, Cancún y Veracruz, los tres israelíes, Nueva York, Singapur, Sídney, Bergen y Qikiqtarjuaq, además de Marsella y Barcelona. Ninguna prueba emulada sustituye una prueba en teléfono físico.

## Registro histórico de revisiones anteriores

Las tablas y cifras de esta sección se conservan como evidencia de desarrollo. **No son el recuento de pruebas, tamaño de compilación ni conjunto de datos actuales.** Las revisiones posteriores incorporaron 105 puertos, DEM, edificios OSM, clima ampliado, escalas y la calibración de combustible de Spirit. El cierre actual está al principio del documento.

### Ampliación previa de 8 a 20 puertos

La ampliación mediterránea añadió La Ciotat, Bandol, Hyères, Niza, Mónaco, Génova, Ajaccio, Palma, Valencia, Cartagena, Málaga y Gibraltar. En esa revisión pasaron **173 pruebas en 14 archivos**. Los recorridos físicos La Ciotat–Bandol (lancha), Niza–Mónaco (yate) y Tolón–Hyères (carguero) llegaron despacio, sin contactos. Esa cobertura regional sigue incluida en los 105 destinos actuales.

### Conducción, cámaras y terreno procedural

La salida inicial en neutral impedía apreciar avance al subir potencia. Se cambió a avante y se añadió el aviso accionable para neutral, manteniendo la marcha de partidas restauradas. La prueba operó el acelerador real sin pulsar F:

| Ensayo histórico | Resultado observado |
| --- | --- |
| Yate, aceleración | 4,9 kn a los 5 s; 14,1 kn a los 10 s; 93,6 m al terminar el giro |
| Yate, reversa | 10,96 a 6,09 m/s en tres segundos |
| Lancha, toque emulado a 390×844 | 51,96 m recorridos; avance final 12,05 m/s; consumo real |
| Viaje a 100× desde fixture marino | 13,92 km; 688 fotogramas, mediana 16,7 ms, p95 16,8 ms, máximo 33,3 ms |
| Construcción de terreno anterior, sin DEM ni OSM | 295 ms en frío; 223–244 ms en repeticiones |

Se inspeccionaron seguimiento, puente, estela, giro y navegación nocturna en mar agitado. [Conducción](../artifacts/revision/driving-results.json), [vídeo](../artifacts/revision/driving-test.webm), [táctil y noche](../artifacts/visual/report.json), [cambios de origen a 100×](../artifacts/revision/rebase-100x.json), [terreno anterior](../artifacts/revision/terrain-rebuild-benchmark.json).

La prueba de cámaras conservó posición física durante cambios de vista en pausa, guardó/restauró la cámara y verificó ratón y gestos táctiles. Recorrió 7,14 km a 100× con varios cambios de origen, manteniendo barco y estela encuadrados. [Informe](../artifacts/cameras/report.json).

### Giro y agarre

En condiciones constantes, Spirit desde 142 m/s pasó de **12,09° a 69,40° de giro en diez segundos**, con 6,94°/s tras un segundo. La deriva de lancha a 12 m/s bajó de 20,04° a 7,34°; la de yate a 10 m/s, de 13,37° a 5,80°. Los seis barcos completaron Cassis a 1× y 100× sin contactos, con estados finales iguales. [Ensayo físico](../artifacts/steering/physics-report.json).

`test:steering` sostuvo una sola tecla D sin repetición automática: timón completo antes de 300 ms, giro de 52,71° en 7,67 s a más de 508 km/h y −55,41° al contravirar. Las once comprobaciones incluyeron soltado, pérdida de foco, teclas opuestas, pausa, reversa y toque móvil. La nube de agua cambió al exterior del giro y la estela conservó su curva. No hubo errores ni solicitudes externas. Esos artefactos preceden al depósito actual de 900 L; sus lecturas de combustible no representan la calibración actual. [Navegador](../artifacts/steering/report.json), [vídeo](../artifacts/steering/steering-test.webm).

### Hidroplano y agua

`test:hydroplane` condujo desde la interfaz: 160,59 km/h tras unos 10,3 s a 1×; después 510,46 km/h a los 62,5 s simulados. Guardó/restauró a alta velocidad, cambió las tres cámaras en pausa sin alterar la física y redujo de 510,55 a 423,39 km/h con REV en unos tres segundos, recorriendo 394,83 m. En emulación táctil alcanzó 510,82 km/h. [Informe](../artifacts/spirit/report.json), [vídeo](../artifacts/spirit/hydroplane-test.webm). El antiguo consumo de 107,71 L hasta Cassis pertenecía a la calibración anterior y quedó sustituido por el informe actual de combustible.

`test:water` verificó emisión continua de gotas y pulverización, espuma en curvas, pausa, inercia y tres cámaras. Llegó a 510,93 km/h y recorrió 1.158,72 m en 8,17 s simulados a 1×. En ocho segundos de vídeo a 1440×900, calidad alta y DPR 1, los 481 intervalos tuvieron mediana 16,7 ms y p95/máximo 16,8 ms. Incluyó seis escenas de lancha/carguero en calma, moderado y agitado, y toque móvil a calidad baja. [Informe](../artifacts/water-interaction/report.json), [vídeo](../artifacts/water-interaction/water-test.webm).

La comprobación adicional a DPR 2 observó 180 intervalos con mediana/p95 16,7 ms y máximo 16,8 ms, sin errores. [Informe Retina](../artifacts/water-interaction/retina-report.json). Todos estos resultados pertenecen al equipo de desarrollo y a las escenas de esa revisión.

## Límites de lo verificado

La red completa se verifica geométricamente. Se ejecutaron los viajes mediterráneos descritos, los tránsitos de canales y el cruce atlántico del pesquero; no todos los corredores intercontinentales, barcos, mares, cargas ni salidas arbitrarias. La costa es generalizada y el DEM regional: no hay batimetría, mareas, arrecifes, calados ni cartografía certificada. No se declara una reproducción fotográfica exacta de los puertos.

Las pruebas bloquean solicitudes externas para comprobar que los recursos de juego son locales. No se probaron dispositivos móviles físicos, otros motores de navegador ni rendimiento en GPU modestas. El aviso de Vite por un bloque superior a 500 kB se documenta con el tamaño de la compilación final, sin convertirlo en un fallo de ejecución.
