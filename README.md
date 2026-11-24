# DERIVA · Maritime Explorer

Juego web 3D de navegación libre, en español, creado desde un directorio vacío. Siete barcos con respuestas físicas distintas: seis arquetipos ficticios y una recreación jugable del **Spirit of Australia**, el hidroplano a reacción de Ken Warby. Incluye 293 destinos costeros de lugares reales, con fondeos y servicios simplificados, y un mundo basado en Natural Earth. No necesita cuenta, claves, servicios de pago ni backend.

## Ejecutar

Requisitos: Node.js 22.12 o posterior (desarrollo verificado con Node 24.14.1), npm y un navegador moderno con WebGL 2 y aceleración gráfica.

```bash
cd /Users/elias/Desktop/Juego
npm install
npm run dev
```

Abrir **http://localhost:5173**. Si ese puerto está ocupado, Vite imprime el alternativo. Desde una copia en otra carpeta, ejecutar los comandos en la raíz del proyecto. `npm ci` reproduce las versiones del archivo de bloqueo.

```bash
npm run build       # TypeScript y producción en dist/
npm run preview     # sirve la compilación, normalmente en http://localhost:4173
npm test            # geografía, física, persistencia y geometría visual
npm run benchmark   # comparación de barcos y medición CPU
npm run benchmark -- --routes --long --weather
```

Todos los datos, tipografías y modelos necesarios están incluidos localmente. Solo la instalación inicial de paquetes necesita Internet. Se sirve como sitio estático; no requiere peticiones a servicios externos durante el juego. No es una aplicación instalable PWA ni incluye un service worker.

## Primera salida

1. Elige embarcación y puerto. **Nácar 18 en Marsella** es la salida inicial.
2. Pulsa **Comenzar travesía**. Las salidas nuevas comienzan en avante: mantén `W` o sube la barra de potencia para moverte. `F` vuelve a seleccionar avante si has cambiado a neutral. Los controles también están en la consola inferior.
3. **Descubrir travesías** ofrece el tutorial de 300 m, el traslado a Cassis y la travesía a Barcelona. El pesquero o el carguero permiten recorridos largos. Las misiones usan una previsión conservadora que contempla crucero del piloto y máxima potencia, más una reserva del 25%. Si falta combustible o reserva, abren la carta para revisar las escalas.
4. En **Carta náutica**, elige un destino, calcula una ruta y pulsa **Fijar rumbo**. Verás consumo previsto, reserva, total recomendado y combustible a bordo. El planificador añade escalas de repostaje cuando el depósito no basta para el destino. La primera etapa usa el combustible a bordo; las siguientes requieren atracar y repostar. En cada escala, **Repostar y preparar siguiente etapa** conserva el barco y activa el siguiente tramo. El zoom de la carta siempre vuelve a centrar el jugador. El piloto automático se activa expresamente con su botón o `T`.
5. Cerca de la boya del puerto, frena: el atraque exige **hasta 1 km y menos de 0,85 m/s (1,65 kn)**. `E` o **Atracar** amarra sin saltar hasta el puerto. Ya puedes repostar, reparar o cambiar de barco. **Soltar amarras** permite volver a navegar; el piloto queda desactivado hasta que lo actives expresamente.

La boya amarilla tiene un aro luminoso, una baliza y una etiqueta de distancia. La misión se completa al atracar en el destino final. El piloto alcanza la aproximación y cede el control, pero no pulsa el atraque por ti. El tutorial pide acelerar, recorrer 300 m y frenar; un barco pesado tarda más.

En **La flota**, selecciona una tarjeta y confirma con el botón que permanece visible al pie del panel. Durante una partida, a menos de 1 km de una boya y por debajo de 1,6 kn, **Atracar y cambiar de barco** permite realizar ambos pasos; si ya estás amarrado, confirma el cambio directamente. El servicio conserva la posición, orientación y ruta, comprueba que el nuevo casco cabe y deja el piloto apagado. La nueva embarcación recibe la carga seleccionada y su depósito lleno.

Durante la navegación, la información del viaje se concentra junto a los mandos inferiores. El destino, la distancia restante y el piloto permanecen a mano; la flecha **Mostrar detalles del viaje** despliega las etapas y demás información. **Mapa local** permite plegar la minicarta. En pantallas estrechas empieza plegada para dejar libre la vista al frente; los botones de cámara siguen disponibles.

**Vector 38** es un speedboat ficticio de 11,6 m: alcanza aproximadamente **220 km/h** en calma y dispone de **1.400 L** de combustible. Ofrece una velocidad intermedia entre las embarcaciones convencionales y el Spirit. Su modelo propio tiene casco V profundo azul, cubierta con franjas blancas y naranjas, dos asientos de piloto, parabrisas bajo y dos motores fuera de borda. Está disponible desde la salida inicial y en **La flota**, con cámaras de primera persona, tercera persona y orbital.

Para probar el barco más rápido, selecciona **Spirit of Australia → Probar en mar abierto**. Comienza a 42° N, 4° E, en calma, sin viento ni corriente, con carga del 35% y avante seleccionado. Sube la potencia con `W` o la barra. A plena potencia y en línea recta alcanza unos **153 km/h a los 10 s** y **511 km/h a los 90–120 s**. La velocidad extra se muestra en km/h; las lecturas náuticas se conservan. Cambia entre cockpit y seguimiento con `C`, `1` y `3`.

El récord histórico es **511,11 km/h**, promedio de dos pasadas en 1978, documentado por el [Museo Marítimo Nacional de Australia](https://www.sea.museum/en/society-and-water/ken-warby). El modelo toma su forma y dimensiones como referencia; sus fuerzas, combustible y **reversa auxiliar para maniobrar** son aproximaciones de juego. A velocidad de récord necesita aproximadamente **3,26 km para detenerse con REV**. El piloto usa un crucero mucho menor. Su depósito de juego tiene 900 L y el consumo se ha ajustado para viajar entre puertos: completó Marsella–Barcelona con 543,8 L restantes, sin colisiones. [Fuentes, parámetros y pruebas del Spirit](docs/SPIRIT_OF_AUSTRALIA.md).

## Controles

| Acción | Tecla / control |
| --- | --- |
| Aumentar / reducir acelerador | `W` / `S` o `↑` / `↓`; barra de potencia |
| Timón babor / estribor | `A` / `D` o `←` / `→`; se centra al soltar la tecla |
| Avante / neutral / reversa | `F` / `N` / `R`; botones AVANTE / N / REV |
| Neutral y potencia cero | `Espacio`; **no detiene inmediatamente el barco** |
| Atracar / soltar amarras | `E` o botón contextual |
| Piloto automático | `T` o botón de la tarjeta de ruta |
| Mapa | `M` o Carta náutica; arrastrar, rueda y botones de zoom |
| Alternar primera / tercera persona | `C` o botones **1ª persona / 3ª persona** |
| Elegir cámara directamente | `1` primera persona; `3` tercera persona |
| Mirar desde el puente | En primera persona, arrastrar el océano con ratón o dedo; cambiar de vista centra la mirada |
| Cámara orbital | Arrastrar el océano; rueda para acercarse |
| Pausa | `P`, `Esc` o botón superior |
| Ayuda | `H` o interrogación superior |
| Guardado | Icono de guardar; automático cada 30 s y al ocultar la pestaña |

Mantener `A`/`D` o las flechas lleva el timón a su extremo en unos 0,2 segundos, sin depender de la repetición del teclado. Se centra al soltar o al perder el foco; pulsar ambos sentidos lo centra mientras estén mantenidos. Las barras de potencia y timón y los botones permiten control táctil básico. Los menús pausan la física y restauran el estado de pausa previo al cerrarse. Al ocultar la pestaña se pausa la simulación. En un campo de texto o selector, el teclado conserva su función normal.

Si aceleras estando en neutral, aparece **Motor en neutral → Engranar avante**. Las partidas guardadas conservan su marcha. `W` y `S` siguen funcionando después de tocar la barra de potencia. La distancia realmente recorrida se consulta al expandir los detalles del viaje. La minicarta y la tarjeta de ruta muestran lo que queda de la **etapa activa**, también al conducir manualmente; no es la distancia al puerto más cercano ni el total de todas las escalas. La carta conserva el total previsto del itinerario.

Al activar el piloto con el botón o `T`, se calcula una ruta navegable nueva desde la posición actual hasta el puerto de la etapa activa. Desviarse no obliga a regresar a un punto antiguo de la línea. Se conservan el barco, combustible y destino final; si el desvío exige repostar, se insertan escalas antes del próximo puerto. En manual también se actualiza el trazado; ambas cartas dibujan sólo el recorrido pendiente desde el barco. Sin paso navegable o combustible para alcanzar una escala con reserva, el piloto permanece apagado. Durante el piloto se revisa periódicamente el combustible restante; si las condiciones invalidan la etapa, se buscan nuevas escalas y, si no existen, se pausa la navegación con un aviso.

El agua tiene reflejos del cielo, ondas de varias escalas y espuma según propulsión y velocidad. La estela queda sobre la trayectoria y sigue los giros. La cámara de seguimiento acompaña al barco y suaviza los cambios de rumbo. Los siete barcos tienen geometría y materiales propios: cascos curvos, cristales, metal, equipamiento y cubiertas de madera donde corresponde; el Spirit incorpora patines, cockpit y reactor, y el Vector 38 su casco V profundo y doble fuera de borda.

El casco toma muestras del oleaje en proa, popa y ambos costados para amortiguar su cabeceo y balanceo; sube ligeramente al acelerar y se inclina al girar. Las salpicaduras combinan gotas con caída y agua pulverizada que arrastra el viento. La densidad responde a la velocidad, entrada en las olas y tamaño del barco, con presupuestos de partículas según calidad. La espuma se dispersa sobre el recorrido incluso al soltar el acelerador. Son efectos visuales sobre la navegación física existente.

**3ª persona** sigue al barco desde popa y permite ver el casco y la estela. **1ª persona** sitúa la cámara a bordo, mirando hacia la proa; arrastra para mirar a los lados o arriba y abajo. **Orbital** conserva la vista exterior libre. Los tres botones forman un selector compacto junto a la minicarta; ambos se ocultan al abrir un panel. También puedes usar `C`, `1` y `3`. La vista elegida se guarda con la partida.

## Simulación y viajes

- Estado físico independiente de React: avance, deriva lateral y guiñada. Paso fijo de **1/30 s**, disipación semiimplícita, giro de velocidades que no agrega energía, masa y momento de inercia por embarcación.
- Empuje progresivo, reversa, resistencia relativa al agua, viento, corriente, carga, consumo y daños. Timón con flujo de hélice explícito; el remolcador tiene propulsión diferencial. Las velocidades máximas resultan del equilibrio de fuerzas.
- El Spirit añade resistencia de planeo progresiva y un radio de giro que aumenta con la velocidad. Su reactor tiene respuesta de 4,8 s y consumo de juego de 40–500 L/h y depósito de 900 L; la reversa auxiliar ficticia alcanza unos 9,7 km/h. Usa el mismo paso fijo, geografía y colisiones que el resto.
- La consola distingue velocidad sobre el fondo (SOG) y sobre el agua (STW). El compás indica rumbo de proa; la bitácora muestra también derrota real. Potencia motor es la respuesta efectiva; la barra indica la orden.
- Autonomía basada en consumo y velocidad actuales; se omite a potencia o velocidad demasiado bajas. ETA depende de la velocidad actual y es incierta al maniobrar. No son garantías de combustible ni llegada.
- La carta y las misiones comparten una previsión conservadora de consumo, válida también desde reposo, neutral o amarrado. Usa distancia navegable desde la posición actual, carga, daño, viento, corriente, maniobras y el consumo propio de cada motor tanto al crucero del piloto como a máxima potencia. La reserva adicional es el **25% del consumo previsto**, no del depósito. Cada etapa debe caber con esa reserva; una ruta imposible no permite **Fijar rumbo**. Un plan que exige repostar en el puerto actual sí puede fijarse, pero no iniciar el piloto hasta realizar el servicio. Desvíos, choques y tiempo detenido con el motor encendido requieren volver a comprobar el combustible.
- **1×, 5×, 20×, 100× y 1000×** ejecutan los mismos pasos físicos y aceleran también el ciclo solar. No se aumenta el paso de integración ni se multiplica la velocidad. Si falta presupuesto de CPU se conserva trabajo pendiente. Cerca de costa, muelles y destino se reduce automáticamente el multiplicador; se muestran solicitado y efectivo.
- Seis estados de clima sintético reproducible: calma, moderado, agitado, lluvia, tormenta y huracán. Viento y corriente van hacia la dirección indicada. El reloj de luz tiene su propio ritmo configurable, independiente del multiplicador de navegación. Las ondas del shader y el movimiento visual del barco comparten función. Elevación, cabeceo y balanceo son aproximaciones visuales, no flotabilidad dinámica de seis grados de libertad.
- Una cadena de discos barridos cubre el casco completo. Las colisiones usan los polígonos que dibuja el mundo. Se rechaza el paso inseguro, se disipa velocidad y se aplica daño según el impacto; un contacto desactiva el piloto.

Fórmulas, calibración, resultados y aproximaciones: [docs/PHYSICS.md](docs/PHYSICS.md).

## Mundo y datos

La red incluye **293 puertos** repartidos por América, Europa, África, Asia, Oceanía y Antártida, con una cadena de escalas por el Atlántico norte. Incluye **Acapulco, Los Cabos, Cancún, Veracruz y Manzanillo**, además de **Haifa, Ashdod y Eilat**. Se añadieron 174 servicios para cubrir huecos de autonomía, especialmente Mediterráneo, México y Atlántico norte, y después 14 destinos australes. Los nombres corresponden a lugares reales; los servicios de atraque y repostaje son adaptaciones del juego. [Fuentes y auditoría de la red](docs/port-network-sources.md).

**Patagonia, Drake y Antártida:** Puerto Montt, Puerto Chacabuco, Puerto Natales, Punta Arenas, Ushuaia, Puerto Williams, Cabo de Hornos, Bahía Blanca, Puerto Madryn, Puerto Deseado, Río Gallegos, Bahía Fildes (isla Rey Jorge), Isla Decepción y Port Lockroy. Están conectados a ambas costas sudamericanas. Las escalas antárticas tienen bases pequeñas y costa de roca/nieve; sus muelles y combustible son servicios ficticios de juego. El pesquero **Bruma 24** puede realizar Ushuaia → Hornos → Fildes → Port Lockroy con repostajes. El cruce abierto del Drake ronda los 850 km: los barcos sin autonomía suficiente mantienen el rechazo por combustible, sin una estación inventada en medio del océano.

Las costas ya no comparten una única ladera mediterránea: se usan **elevaciones reales en 105 regiones**, biomas, vegetación y arquitectura local. Las doce áreas prioritarias incorporan un atlas local de **7.716 huellas de edificios OpenStreetMap**, además de edificios de relleno regional y monumentos modelados. Las alturas proceden de etiquetas cuando existen y se estiman cuando faltan. Se respetan las coordenadas reales y las bases terrestres; no es fotogrametría ni una réplica exacta de cada instalación. [Relieve](docs/ELEVATION.md) · [Puertos 3D](docs/PORT_SCENERY.md).

La posición autoritativa usa latitud/longitud. Geodesia esférica con radio **6.371.008,8 m**, arcos de círculo máximo, antimeridiano normalizado y metros/segundos internos. Una milla náutica son 1.852 m. Se muestran tanto distancia directa como longitud del corredor navegable. El renderizador emplea proyección local y rebasa el origen cada 2 km. El terreno cercano se reutiliza hasta 8 km, corrigiendo posición y convergencia de meridianos; las pruebas limitan el error visual frente a la proyección exacta a menos de 5 cm en el área completa y 2 mm a un kilómetro del barco.

Natural Earth land **1:10.000.000** se simplifica con tolerancia de 0,001° en el Mediterráneo occidental y en ventanas de Nueva York, Singapur y Eilat; se usa 0,04° fuera de ellas. Esa escala **no significa resolución de diez metros**. El mapa base mundial pesa unos 1,94 MB; solo se construyen las costas 3D próximas. No se cargan modelos detallados del planeta entero. La costa, los muelles, las colisiones y la carta comparten huellas geométricas.

El planificador recorre un grafo de corredores oceánicos conservadores y verifica cada tramo contra tierra e islas incluidas. Los corredores globales pueden ser bastante más largos que rutas comerciales reales. Gibraltar, **Suez y Panamá** son navegables. Los canales comparten geometría con la carta, terreno y colisiones; están ensanchados para el juego y Panamá no simula esclusas. [Modelo y pruebas de canales](docs/CANALS.md). No se dibujan rectas inventadas a través de continentes. El gráfico mundial se desacopla del detalle local 3D.

Marsella–Cassis: **9,49 mn directas / 16,42 mn por el corredor entre puertos**. Marsella–Barcelona: **183,60 / 191,66 mn**. Planear desde una posición actual puede acortar el acceso al corredor; por eso las cifras de la interfaz pueden variar ligeramente.

Fuentes, licencias, metodología y límites geográficos: [docs/GEOGRAPHY.md](docs/GEOGRAPHY.md).

## Clima, ciclo de luz y vida marina

En **Ajustes** puedes elegir calma, moderado, agitado, lluvia, tormenta o huracán. Cambian viento, corriente, olas, visibilidad, nubosidad y lluvia; las tormentas incluyen relámpagos espaciados y el huracán añade bandas de lluvia y ráfagas. Es clima simulado y reproducible.

El ciclo completo de día/noche sigue **24 horas simuladas**. Todos los multiplicadores aceleran el reloj y la iluminación: a 1000×, una hora simulada tarda 3,6 segundos reales si la costa no limita la aceleración. Se detiene en pausa. Puedes seleccionar amanecer, día, atardecer o noche. El cielo combina detalle fotográfico con un sol móvil y colores dinámicos de atardecer; por la noche aparecen estrellas y luna. Delfines, una ballena y gaviotas recorren el mar con posiciones geográficas y velocidades propias: el barco puede pasarlos y dejarlos atrás. Su animación y las partículas mantienen un reloj visual fluido. La actividad disminuye con mal tiempo y se puede desactivar.

El reloj muestra **hora local y desfase UTC**. A menos de 25 km de los puertos usa su zona IANA y las reglas de horario de verano del navegador, según la fecha simulada. En mar abierto usa husos marítimos de 15° de longitud. Cambiar de huso puede cambiar la hora o fecha local; el sol sigue la hora solar media por longitud de forma continua. El guardado conserva el instante UTC y las partidas antiguas migran manteniendo la hora visible. Las fronteras civiles terrestres y la astronomía estacional detallada no están modeladas.

Los siete modelos incorporan pintura PBR, superficies de cristal, franjas de flotación, rótulos y detalles de cubierta. El Spirit añade uniones de paneles y una tobera metálica; Vector, yate, lancha, pesquero, remolcador y carguero conservan siluetas y equipamiento propios. Las cámaras siguen las dimensiones físicas de cada embarcación.

## Guardado

`localStorage`, clave `deriva.save.v1`, esquema versionado. Conserva estado físico, combustible, carga, daño, controles, tiempo simulado, destino final, escalas, etapa actual y llegada completada, piloto, misión, tutorial, reloj ambiental y preferencias. Se comprueban versiones, tipos, límites y valores finitos; al restaurar se comprueba que el **casco completo** cabe en agua y se vuelve a validar la ruta contra la geografía y el combustible antes de reactivar un piloto guardado. Datos inválidos no bloquean una nueva salida. Se maneja almacenamiento bloqueado o lleno con un aviso.

**Continuar mi partida** aparece en el inicio cuando hay un guardado válido. Cada navegador/origen tiene su propia partida; no hay sincronización remota. El multiplicador vuelve a 1× al restaurar. La bitácora de mensajes y el tiempo real de la sesión no se persisten. El tutorial restaura su etapa y punto de inicio. Una llegada ya completada sigue completada al continuar, y atracar desactiva el piloto para que soltar amarras no lo reinicie.

## Arquitectura

| Ubicación | Responsabilidad |
| --- | --- |
| `src/sim/engine.ts` | Fuerzas, integración, casco, piloto y tiempo fijo |
| `src/sim/routeEstimate.ts` | Previsión conservadora de combustible y reserva, compartidas por carta y misiones |
| `src/sim/itinerary.ts`, `voyagePlan.ts` | Planificación de escalas, instalación y continuidad de cada etapa |
| `src/sim/weather.ts`, `daylight.ts` | Clima determinista, ondas y reloj de luz |
| `src/sim/benchmark.ts` | Comparaciones reproducibles sin renderizado |
| `src/geo/math.ts` | Unidades, geodesia y coordenadas locales |
| `src/geo/world.ts` | Costa, índice espacial y colisión continua |
| `src/geo/routes.ts` | Grafo navegable, distancias y rutas verificadas |
| `src/data/ships.ts`, `ports.ts` | Configuraciones y ubicaciones independientes |
| `src/render/elevation.ts`, `terrain.ts`, `PortScenery.ts` | DEM regional, biomas y edificios sobre la misma superficie terrestre |
| `src/render/` | Three.js, barcos, cámaras, agua, clima, fauna y estela persistente |
| `src/components/` | Carta y dibujos de embarcaciones |
| `src/persistence/` | Validación y almacenamiento versionado |
| `src/App.tsx` | Flujo de juego, mandos, misiones e interfaz React |
| `tests/`, `scripts/` | Pruebas de unidades, viajes y navegador; benchmarks |

El renderer impulsa el acumulador de simulación con tiempo real; React refresca instrumentos a 10 Hz. La física no importa React ni Three.js. No se añadió un Web Worker: la medición local no lo justificó para esta escala, y evitar copias de estado simplifica la coherencia. Es una opción futura para dispositivos modestos y rutas más extensas.

## Validación y rendimiento

Las pruebas cubren geografía, física, estimación de combustible, persistencia, geometría, cámaras, estela y cambios de origen. El [registro de validación](docs/VALIDATION.md) reúne el recuento y las comprobaciones de producción y navegador.

Las pruebas cubren geodesia, antimeridiano, colisión continua, rutas, maniobras, clima, consumo, piloto y guardado. La nueva red y el consumo compartido por motor y planificador permiten los 16 planes auditados de lancha, yate, Vector y Spirit: Marsella–Nueva York, Marsella–Haifa, Acapulco–Los Cabos y Cancún–Veracruz. Cada etapa incluye combustible de viaje y reserva del 25%. Además, se ejecutaron físicamente **Marsella–Nueva York con Spirit (29 etapas)** y **Marsella–Haifa con lancha (11 etapas)**: todas las llegadas conservaron la reserva, sin colisiones ni teletransportes. [Planes](artifacts/long-voyages/plans.json), [cruce atlántico](artifacts/long-voyages/spirit-marseille-new-york.json), [travesía mediterránea](artifacts/long-voyages/launch-marseille-haifa.json). Hay regiones con huecos de servicio que todavía pueden impedir rutas de barcos pequeños; el planificador nunca inventa combustible.

Las pruebas actuales del estimador comparan su consumo con travesías físicas de los siete barcos hasta Cassis, comprueban las previsiones hasta Barcelona y cubren reserva baja, depósito vacío, carga, daño, corriente y planificación desde reposo. El [informe comparativo anterior](artifacts/planning/fuel-estimates.json) conserva los resultados de los seis barcos disponibles antes del Vector 38 y distingue los viajes ejecutados de las previsiones.

La comprobación de navegador recorre controles, atraque, repostaje, cambio de barco, avisos de autonomía, ruta, piloto, tiempo, guardado/restauración, cámaras, clima, calidad y disposición móvil. Para repetirla, mantener el servidor en ejecución:

```bash
npx playwright install chromium
node scripts/browser-check.mjs
npm run test:driving
npm run test:visual
npm run test:cameras
npm run test:hydroplane
npm run test:water
npm run test:steering
npm run test:planning
npm run test:world
npm run test:ports-visual
npm run test:navigation-regressions
npm run test:replanning
npm run test:fuel-navigation
npm run test:hud
npm run test:speedboat
```

La revisión lateral de fauna requiere el servidor de desarrollo: `TEST_URL=http://localhost:5173 npm run test:marine-animation`. Genera capturas de las fases del salto, vídeos y una prueba de independencia respecto al barco en `artifacts/marine-animation/`.

En el Mac de desarrollo se utilizó Google Chrome instalado:

```bash
CHROME_PATH='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' node scripts/browser-check.mjs
CHROME_PATH='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' npm run test:driving
CHROME_PATH='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' npm run test:visual
CHROME_PATH='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' npm run test:cameras
CHROME_PATH='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' npm run test:hydroplane
CHROME_PATH='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' npm run test:water
CHROME_PATH='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' npm run test:steering
CHROME_PATH='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' npm run test:planning
CHROME_PATH='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' npm run test:world
CHROME_PATH='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' npm run test:ports-visual
CHROME_PATH='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' npm run test:navigation-regressions
```

Para comprobar producción, ejecutar primero `npm run build` y `npm run preview`, y añadir `TEST_URL=http://localhost:4173` delante de cada comando de prueba. `test:driving` graba [la conducción](artifacts/revision/driving-test.webm) y comprueba aceleración con la barra, giro, neutral y reversa. `test:visual` comprueba toques reales emulados y navegación nocturna con mar agitado; en móvil guarda mediante el logo **Bitácora → Guardar**.

`test:cameras` comprueba cambios de vista durante la navegación, mirada con ratón, atajos, restauración de la cámara guardada, selección táctil y que cambiar de cámara en pausa no altera el estado físico. Genera capturas de primera y tercera persona de los cinco arquetipos originales en `artifacts/cameras/`; las comprobaciones adicionales del Spirit se recogen en el registro de validación.

`test:hydroplane` conduce el Spirit con controles reales: acelera diez segundos a 1×, supera 500 km/h, alterna las tres cámaras, restaura la partida a alta velocidad y frena con la reversa auxiliar. También comprueba acelerador y cámaras táctiles a 390×844. Genera [el informe](artifacts/spirit/report.json), capturas y [un vídeo](artifacts/spirit/hydroplane-test.webm).

`test:speedboat` comprueba la selección inicial del Vector 38, su ilustración, el cambio desde un yate amarrado y junto a la boya en escritorio y móvil, la confirmación siempre visible, los bloqueos por distancia o velocidad, rutas regionales y guardado/restauración. Conduce una aceleración real en mar abierto para verificar su rango aproximado de 220 km/h, consumo y desplazamiento, y captura las tres cámaras. Genera su informe y capturas en `artifacts/speedboat/`.

`test:hud` comprueba cinco tamaños de pantalla, incluidos móvil vertical y horizontal: vista al frente despejada, mandos accesibles, detalles del viaje y mapa plegables, cámaras, carta y conducción real. También verifica repostaje, reparación y salida del puerto desde el panel compacto. Genera su informe y capturas en `artifacts/hud-layout/`.

`test:steering` prueba una sola pulsación mantenida, respuesta y agarre a máxima velocidad, contravolante, centrado al soltar/perder foco, ajuste fino de la barra, pausa y giros táctiles. Incluye reversa de la lancha desde una partida de ensayo explícita. [Informe](artifacts/steering/report.json), [vídeo](artifacts/steering/steering-test.webm).

`test:water` graba aceleración, giro y navegación por inercia del Spirit, mide intervalos de fotogramas a 1× y verifica pausa, cámaras y calidad baja con entrada táctil. Compara lancha y carguero en tres estados de mar mediante partidas de ensayo explícitas. [Informe](artifacts/water-interaction/report.json), [vídeo](artifacts/water-interaction/water-test.webm).

`test:planning` conserva el recorrido histórico de carta y cámaras con la red de 105 destinos. `test:voyage-upgrade` comprueba todos los destinos disponibles, ocho rutas largas de barcos pequeños, todos los renders, los cinco multiplicadores, transición visual a la noche, husos, guardado y controles móviles. `test:drake-voyage` ejecuta la travesía física del pesquero desde Ushuaia a Port Lockroy y `test:drake-browser` comprueba los nuevos selectores, rutas y paisajes australes en producción. `test:fuel-navigation` comprueba que un barco vacío en mar abierto no puede fijar un itinerario imposible y que un desvío inserta Palma sin duplicar escalas ni cambiar barco o combustible. `test:replanning` conduce desvíos reales y reactiva el piloto con botón y teclado. Los informes y capturas quedan en `artifacts/`.

El informe histórico `test:world` corresponde a los 105 destinos y controles del ciclo anteriores. `test:ports-visual` captura puertos con relieves y edificios distintos. `test:navigation-regressions` verifica distancia por etapa, conservación del barco, piloto apagado al atracar, llegada completada restaurada y previsión de combustible del Spirit. Sus informes quedan en `artifacts/world-expansion/`, `artifacts/port-realism/` y `artifacts/navigation-regressions/`.

`test:selection` necesita el servidor de desarrollo (`npm run dev`): verifica que fijar una ruta, recargar módulos de Vite y restaurar la partida conservan el barco elegido y el destino. Repite la comprobación tras cambiar de barco en puerto. Modifica temporalmente `src/App.tsx` para provocar la recarga y restaura el archivo al terminar. Usa `DEV_URL` para indicar otro servidor de desarrollo; no se ejecuta contra `preview`.

```bash
npm run test:selection
# Con Google Chrome instalado y la URL de Vite explícita:
CHROME_PATH='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' DEV_URL=http://localhost:5173 npm run test:selection
```

El resultado de esta regresión se guarda en [selection-after.json](artifacts/planning/selection-after.json).

`TEST_URL=http://localhost:5173 npm run test:clock-refresh` comprueba la actualización del motor conservando barco, reloj UTC y selección 1000×, y después navega a esa escala. Añade temporalmente un comentario a `src/sim/engine.ts` y restaura el archivo exacto al finalizar. [Informe actual](artifacts/voyage-upgrade/refresh-report.json).

Se generan capturas e informes en `artifacts/`. Las mediciones de FPS corresponden a escenas y equipos concretos, identificados en el [registro de validación](docs/VALIDATION.md); no representan todos los puertos ni garantizan el rendimiento de otros dispositivos. La disposición táctil se comprueba por emulación a 390×844, **no en un teléfono físico**. El benchmark CPU de la red ampliada integró 15.000 pasos con colisiones en 99,03 ms, excluyendo gráficos, carga y React. Repetir `npm run benchmark` mide el equipo actual.

La escena de prueba de **Ajustes → Banco de pruebas** coloca el barco actual a 42° N, 4° E, sin viento/corriente, carga 35% y avante al 100%. Sustituye la salida actual. El benchmark de consola compara todos los barcos bajo las mismas condiciones y muestra también frenado y giro. Resultados detallados en [docs/PHYSICS.md](docs/PHYSICS.md).

## Recursos y licencias

- [Natural Earth land](https://www.naturalearthdata.com/downloads/10m-physical-vectors/10m-land/): dominio público; atribución incluida en el mapa, `public/data/ATTRIBUTION.txt` y documentación. [Condiciones oficiales](https://www.naturalearthdata.com/about/terms-of-use/).
- Entorno de iluminación y cielo: [Kloofendal 48d Partly Cloudy (Pure Sky)](https://polyhaven.com/a/kloofendal_48d_partly_cloudy_puresky), Greg Zaal y Jarod Guest / Poly Haven, CC0. Copia local y [atribución](public/environment/ATTRIBUTION.md); se usa como recurso visual, no como meteorología de la posición real.
- Barcos, muelles de servicio, ilustraciones SVG y ondas: creados específicamente con código para este proyecto. El Spirit se inspira en el barco histórico, con [referencias primarias documentadas](docs/SPIRIT_OF_AUSTRALIA.md); no se distribuye un modelo descargado del museo. El relieve de los 105 destinos usa un DEM regional real de Mapzen, muestreado a 700 m y conciliado con la costa generalizada; la vegetación es artística.
- [Edificios de OpenStreetMap](https://www.openstreetmap.org/copyright): atlas derivado local bajo ODbL; huellas reales y alturas disponibles, con alturas estimadas cuando faltan. [Composición, fuentes y limitaciones](docs/PORT_SCENERY.md).
- [Mapzen Terrain Tiles](https://registry.opendata.aws/terrain-tiles/): datos de relieve para 105 regiones portuarias; [método y atribuciones](docs/ELEVATION.md).
- DM Sans y Manrope: SIL Open Font License 1.1, archivos locales y textos OFL en `public/fonts/`.
- React, Vite, Three.js y Lucide: dependencias abiertas; sus avisos y licencias se distribuyen con cada paquete. No se utilizaron modelos o texturas comerciales.

## Limitaciones y siguientes mejoras

Es una primera versión jugable, no un simulador de ingeniería ni cartografía de navegación real. Las costas son generalizadas, sin sondas, bajos, arrecifes, mareas, rutas oficiales ni interiores portuarios precisos. No hay colisión por calado, CFD, hundimiento, rotura de casco, tráfico naval, sonido, multijugador ni economía.

Los movimientos secundarios no simulan seis grados de libertad. El clima es uniforme espacialmente y reproducible, no meteorología real. Las rutas intercontinentales se verifican geométricamente; se ejecutaron las rutas mediterráneas indicadas y el cruce Marsella–Nueva York con pesquero: 21 etapas, 20 repostajes y ninguna colisión. [Informe de travesía](artifacts/planning/itinerary-report.json). El piloto requiere vigilancia y puede no resolver cualquier salida arbitraria o mar agitado. Fuera de un corredor cercano puede no encontrarse ruta automática, aunque se mantiene navegación libre.

Próximas mejoras recomendadas: más pruebas físicas de corredores oceánicos, costa regional de mayor detalle con batimetría abierta, más áreas urbanas documentadas y propulsores independientes, controles táctiles mayores, interpolación gráfica del paso fijo, audio y pruebas en hardware móvil real. El motor 3D y la red mundial generan un bloque JavaScript que supera los 500 kB y activa el aviso de tamaño de Vite. Separar la carga de Three.js es una mejora pendiente, sin impedir la compilación ni el funcionamiento probado.
