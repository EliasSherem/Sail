# Modelo físico de DERIVA

DERIVA es un simulador lúdico aproximado de tres grados de libertad horizontales. No es CFD, un entrenador profesional ni una herramienta de navegación. Incluye cinco arquetipos ficticios y una recreación jugable del Spirit of Australia. Sus parámetros físicos se calibran para obtener respuestas distintas y plausibles; las dimensiones y el récord históricos del Spirit se distinguen de las aproximaciones del juego en [su ficha de fuentes y validación](SPIRIT_OF_AUSTRALIA.md).

## Unidades y estado

La posición persistente es latitud/longitud. La geografía usa una Tierra esférica de radio medio 6 371 008,8 m, distancias ortodrómicas y longitud normalizada en el antimeridiano. Los movimientos horizontales se integran en metros/segundos y se trasladan al globo mediante el problema geodésico directo. No se acumulan posiciones Three.js de millones de metros: la vista reconstruye coordenadas locales alrededor de un origen flotante.

`u` es avance relativo al agua y `v` es velocidad lateral a estribor. El rumbo y la velocidad angular positivos giran en sentido horario desde el norte. `motion()` rota las velocidades del casco a este/norte y suma la corriente, obteniendo velocidad y derrota sobre el fondo. Por ello un barco puede estar casi parado respecto al agua y derivar sobre el fondo. Los nudos, km/h y millas náuticas solo se usan para presentación.

Combustible: litros; consumo: litros/segundo. Potencia, carga y daño: fracciones de 0 a 1. Timón: -1 a +1, presentado como ±35°. Los rumbos meteorológicos indican **hacia dónde** sopla o fluye el medio.

## Fuerzas e integración

El paso fijo es **1/30 s**, independiente de React y del renderizado. Un acumulador conserva los pasos pendientes. Cada barco tiene masa en vacío, capacidad de carga, dimensiones, empuje, respuesta de motor, resistencia longitudinal/lateral, autoridad de timón y amortiguación angular propias.

- Masa: `m = masaVacía + carga × cargaMáxima`. Se usa masa efectiva 1,06 m en avance y 1,7 m lateral como aproximación de masa añadida; no procede de un cálculo hidrodinámico del casco.
- Inercia de giro: `I = m × (eslora² + manga²) × factorInercia`.
- El nivel del motor converge exponencialmente a la orden, con una constante de 2,6 s en la lancha y 24 s en el carguero. El empuje es proporcional a `nivel^1,25`, marcha y estado del casco. La reversa aplica una fracción del empuje; no cambia directamente la velocidad.
- Resistencia: coeficientes distintos en avance y lateral, con término cuadrático y pequeña cola lineal. Se calcula con velocidad **relativa al agua**. La carga eleva la resistencia hasta un 30%. La velocidad máxima emerge del equilibrio empuje/resistencia: no hay un límite artificial de velocidad.
- Agarre lateral: la resistencia transversal añade `|u| × agarre` al término `|v| + 0,12`. El denominador pasa a ser `1 + dragLat × loadDrag × (|v| + 0,12 + |u| × agarre) × dt / swayMass`. Así el agua que recorre el casco resiste el deslizamiento incluso cuando la deriva es pequeña. Los factores de juego son 1,1 para lancha, 0,6 yate, 0,32 Spirit, 0,25 pesquero, 0,14 remolcador y 0,06 carguero. Es una fuerza disipativa: no impone una dirección ni alinea la velocidad instantáneamente.
- Timón: el flujo efectivo es `u × (|u| + 0,35) × K / (|u| + 2)`, con coeficiente K propio de cada casco. Conserva la dirección del avance y la propulsión sobre el timón; a velocidad alta limita el crecimiento de la guiñada para que el radio aumente aproximadamente con la velocidad. Las pruebas a 1/2/4/8/16 m/s verifican que los seis radios crecen; duplicar de 8 a 16 m/s multiplica el radio entre 1,5 y 2,1. Actúa en la popa y produce fuerza lateral y momento de giro.
- **Flujo de hélice explícito:** `propWash` añade autoridad al timón cuando hay empuje. El remolcador y, en menor medida, el yate añaden momento por propulsión diferencial. Sin velocidad, viento ni empuje, el timón no hace girar el barco.
- Viento: presión dinámica del aire relativa al movimiento sobre el fondo; áreas longitudinal y lateral diferenciadas. Un pequeño brazo asimétrico produce guiñada. No se modelan ráfagas espaciales ni apantallamiento por edificios.
- La resistencia se aplica mediante denominadores semiimplícitos positivos. La rotación del sistema del casco usa una matriz ortogonal exacta, evitando que el cambio de rumbo agregue energía por sí mismo. La integración es una aproximación estable, no un solucionador completo de las ecuaciones de maniobra de Fossen.
- Consumo de los cinco barcos de hélice: curva de ralentí a plena potencia proporcional a `nivel^2,35`, multiplicada por `0,88 + 0,34 × carga`. El reactor del Spirit usa una curva lineal entre 60 y 650 L/h, con depósito de 900 L, con el mismo factor de carga. Son cifras de juego. La neutral consume combustible; estar amarrado detiene el consumo. Agotar combustible elimina el empuje, conservando la inercia y la deriva.

### Hidroplano Spirit of Australia

El hidroplano conserva el mismo integrador de tres grados de libertad. Su coeficiente longitudinal es `0,4793906 + 36 / (1 + (|u| / 10)^4)`: el término adicional reduce progresivamente su contribución al ganar velocidad, como aproximación de la menor superficie mojada durante el planeo. No calcula sustentación, contacto independiente de patines ni vuelo. El empuje máximo de juego es 15 600 N, con constante de respuesta de 4,8 s. A carga del 35%, sin viento ni corriente y en línea recta, el equilibrio de empuje y resistencia se aproxima a 511,11 km/h.

El Spirit usa la misma ley de flujo del timón que el resto de la flota, con `K = 13,1`. Sus giros se amplían con la velocidad y conservan la respuesta progresiva del momento angular. No se fija directamente el rumbo ni se multiplica la posición para aparentar velocidad. El reactor no aporta flujo de hélice al timón.

**REV es un propulsor auxiliar ficticio de maniobra**, con empuje máximo de 312 N. No representa una reversa real del J34 histórico. Junto con la resistencia del casco, permite detenerse y alcanzar aproximadamente 2,69 m/s hacia atrás. Desde la velocidad de récord, el frenado requiere unos 83,4 s y 3,26 km, sin incluir reacción del jugador. La estela y el cabeceo siguen siendo visuales; no se simulan vuelco aerodinámico, cavitación ni daños estructurales por correr sobre olas.

## Oleaje y clima

Tres ondas sinusoidales direccionales comparten parámetros entre shader oceánico y `waveAt()`: amplitud, longitud, dirección, fase y frecuencia angular `sqrt(g × k)`. La fase es `k × (este × sin(dirección) + norte × cos(dirección)) − frecuencia × tiempo + faseInicial`.

Elevación, cabeceo y balanceo son **movimientos visuales secundarios**. Se muestrea ese mismo campo en cinco posiciones: centro, proa, popa, babor y estribor. Su altura ponderada y diferencias de pendiente alimentan respuestas críticamente amortiguadas; una restricción continua mantiene el casco cerca de la superficie. La aceleración añade un pequeño cambio de asiento y la velocidad angular una inclinación de giro, ajustadas al tipo de barco. No son seis grados de libertad ni fuerzas de flotabilidad por puntos. Las olas no inyectan energía horizontal, daño ni hundimiento.

La velocidad relativa de encuentro entre la proa y la ola produce un coeficiente visual de entrada en el agua de 0 a 1. Aumenta las salpicaduras al atravesar una cresta. No altera impulso, posición geográfica ni consumo. En primera persona el ojo sigue la geometría del cockpit, mientras la dirección de mirada reduce parte del cabeceo y balanceo. Pausar congela la pose y los efectos; cambios explícitos de mar, barco y teletransportes reinician su historial.

El shader añade pequeñas variaciones de normales y reflejos para el detalle superficial; no ejercen fuerzas sobre el casco. La espuma de hélice depende de motor y marcha, y la estela de la velocidad relativa al agua. Guarda hasta 384 muestras del recorrido durante un máximo de 38 segundos simulados, de modo que permanece sobre el agua al girar; se traslada con el origen flotante. Sus crestas, vetas y burbujas se erosionan con la edad. El hidroplano usa contacto de patines, sin espuma de hélice al estar detenido.

`WaterSpray` emite en intervalos de 1/60 s simulado e interpola posición, rumbo y velocidad angular dentro de cada fotograma. Para un contacto a `a` metros hacia proa y `b` hacia estribor, la velocidad local es `(u − yawRate × b, v + yawRate × a)`. Las gotas heredan esa velocidad, incluida la rotación del casco. La carga exterior depende del avance con signo, la guiñada y la deriva lateral: reparte más gotas, elevación y espuma hacia el lado que empuja el agua, también en reversa. No depende de la orden del timón cuando el barco está quieto. La estela usa la tangente de recorrido de cada contacto con interpolación cúbica, preservando la posición de la espuma antigua. Combina gotas balísticas y agua pulverizada con resistencia del aire y deriva por viento. Las gotas nacen sobre el mismo oleaje y se desvanecen al entrar en él. El tiempo acelerado sólo reconstruye la ventana que todavía puede verse, de hasta 1,8 s. Los límites de almacenamiento son 900, 2200 y 4096 partículas para calidad baja, media y alta; la cantidad viva depende de la velocidad y del oleaje. Coordenadas y relojes locales preservan precisión tras cambios de origen y viajes largos. Espuma y salpicaduras son efectos visuales, no una simulación de fluidos.

Los estados calma/moderado/agitado/lluvia/tormenta/huracán modifican viento, olas, corriente y visibilidad. `weatherAt(estado, semilla, tiempoSimulado)` genera evolución reproducible mediante oscilaciones lentas. El viento y la corriente son uniformes en el mundo en cada instante. No son meteorología real ni mareas locales. El ciclo día/noche usa `environmentTime`, segundos reales sin pausa e independientes de 100×. El ciclo por defecto dura720 s; puede durar 1800 o 86400 s. Lluvia, rayos y fauna usan ese reloj visual, mientras el oleaje y la dinámica conservan el reloj físico. Los flashes se separan 11 s en huracán y 15 s en tormenta, con duración 0,55 s.

## Colisiones

Una cadena de discos solapados cubre el casco a lo largo de toda su eslora. Los centros de los discos se barren entre la posición anterior y la candidata, incluyendo el giro. Cada barrido usa la misma costa y muelles mostrados, con distancia continua entre segmentos, evitando atravesar tierra entre pasos.

Lejos de obstáculos, una cota conservadora de separación descarta los barridos detallados: la distancia recorrida se resta de la separación geográfica calculada, con margen extra del 1% y 10 m. Esta optimización presupone costa y muelles estáticos. Cerca del contacto se evalúa la cadena completa.

Un contacto rechaza la traslación/rotación del paso y disipa la velocidad, con pequeño retroceso. El daño depende del cuadrado de la velocidad de impacto por encima de un umbral de roce. El piloto automático se desactiva y la potencia se corta al chocar. Es una respuesta de juego estable, sin fractura, deformación ni fuerzas de amarre. No hay profundidad, varada por calado o batimetría.

## Tiempo y piloto automático

1×, 5×, 20× y 100× repiten exactamente los mismos pasos de 1/30 s. No multiplican la velocidad ni agrandan el paso. Un límite de trabajo por fotograma retiene el trabajo pendiente; la cercanía a costa, muelle o destino reduce el multiplicador antes de seguir integrando. La reducción utiliza velocidad y tamaño del casco. El puerto de destino impone 1× durante la aproximación final; mar abierto permite 100×.

El piloto solo escribe acelerador, marcha y timón. Corrige la corriente, anticipa curvas según el tamaño del casco, regula velocidad y aplica reversa durante el frenado. Usa la misma física, combustible y colisiones que el jugador. Al llegar a poca velocidad cede el control para atracar. No mueve la posición ni fija un rumbo instantáneamente. La geometría simplificada y las rutas limitadas no garantizan maniobras automáticas en cualquier posición arbitraria; una ruta trazada no sustituye la vigilancia de obstáculos.

El Spirit tiene un crucero configurado de 60 kn; el regulador solicita inicialmente el 88% de esa cifra y reduce más al girar y llegar. Su cálculo de potencia estable incluye la resistencia de planeo y del aire, y usa una ganancia menor para evitar oscilaciones durante la respuesta del reactor. El piloto no intenta navegar la ruta al ritmo del récord.

## Planificación de combustible

La carta y las misiones llaman a `estimateRouteFuel(state, route, weather)`, en `src/sim/routeEstimate.ts`. Devuelve distancia, duración, velocidad de crucero, consumo previsto, reserva recomendada, total con reserva, combustible disponible y estado de autonomía. La ruta debe estar recién calculada desde la posición del barco. El estimador suma sus tramos geodésicos efectivos, conservando las curvas del corredor y sustituyendo el ancla inicial por la posición actual.

El cálculo anterior combinaba consumo a plena potencia con velocidad nominal de crucero: eran dos condiciones distintas de funcionamiento del motor y sobreestimaban muchos viajes. El nuevo cálculo busca el equilibrio de fuerzas y potencia que solicita el piloto en cada dirección de viaje. Usa `autopilotControls()`, `stepVessel()` y `fuelRate()` sobre copias temporales; comparte así resistencia, carga, daño, viento, corriente y las curvas de consumo de hélice o reactor del juego. La velocidad alcanzable sale de ese equilibrio, incluso si un barco dañado no alcanza su crucero configurado. La corriente cambia el avance sobre el fondo y, por tanto, el tiempo por tramo.

Las copias tienen combustible suficiente y están desamarradas: se puede prever un viaje estando parado, en neutral, amarrado o con el depósito vacío. El estado real no se modifica. La previsión añade una aproximación del tiempo de respuesta del motor y de maniobra final al recorrido de crucero. Reutiliza el resultado mientras no cambien ruta, posición, barco, carga, daño o condiciones ambientales; una actualización del combustible a bordo sólo recalcula la clasificación. No integra un viaje completo en cada refresco de la interfaz.

Si `C` es el consumo previsto y `F` el combustible a bordo, la reserva recomendada es `R = 0,25 × C` y el total recomendado es `C + R`. **Es el 25% del consumo del viaje, no de la capacidad del depósito.**

| Estado | Condición | Comportamiento |
|---|---|---|
| Suficiente (`sufficient`) | `F ≥ C + R` | Hay combustible para la previsión y su reserva |
| Reserva baja (`low-reserve`) | `C ≤ F < C + R` | Se recomienda repostar o prever una escala |
| Insuficiente (`insufficient`) | `F < C` | Se muestra el déficit previsto y se recomienda una escala |

Son avisos: **ninguno bloquea Fijar rumbo**. Una misión con reserva baja o combustible insuficiente abre la carta con su ruta calculada para revisarla; una misión con combustible suficiente se activa directamente. La estimación de ruta es independiente de la autonomía instantánea de la consola, que depende del consumo y la velocidad actuales y puede omitirse al estar parado.

El pronóstico mantiene las condiciones ambientales actuales durante el viaje y aproxima las maniobras. El clima evolutivo, las curvas, los desvíos y navegar manualmente a plena potencia cambian el consumo real. La reserva es un margen recomendado y no garantiza terminar cualquier travesía. En condiciones extremas, el cálculo conserva valores finitos mediante un mínimo de avance de 0,2 m/s; no demuestra que el piloto pueda vencer cualquier corriente.

### Itinerarios de repostaje

`planFuelItinerary` busca etapas dentro de la autonomía con reserva del 25%: la primera descuenta combustible disponible y las posteriores suponen servicio obligatorio. Si falta combustible al salir y hay puerto a hasta 1000 m, devuelve `needs-refuel`; no aumenta el depósito. Una llegada intermedia se detiene hasta que el usuario atraca, reposta y suelta amarras. `prepareNextLeg` exige puerto correcto y tanque lleno, conserva casco/posición y prepara sólo una etapa con piloto desactivado. El guardado conserva destino final, lista de escalas, índice actual y repostaje pendiente.

El radio de servicio compartido entre atraque, planificador y restauración es 1000 m. Atracar exige además velocidad sobre fondo <0,85m/s y nunca desplaza el barco al muelle.

### Comparación con travesías ejecutadas

Se volvió a ejecutar Marsella–Cassis con los seis barcos y la calibración actual: piloto, carga del 35% y clima evolutivo de calma, semilla 4821. El pronóstico usa las condiciones iniciales. Los seis terminaron sin contactos; el consumo previsto más la reserva cubrió el gasto real en todos los casos. El error del consumo previsto fue de −16,9% a +21,3%.

| Barco | Consumo previsto Cassis | Consumo ejecutado Cassis | Previsto + reserva |
|---|---:|---:|---:|
| Aguja 9 | 27,8 L | 27,4 L | 34,7 L |
| Bruma 24 | 65,0 L | 63,7 L | 81,3 L |
| Nácar 18 | 75,0 L | 73,8 L | 93,8 L |
| Atlas 28 | 361,6 L | 354,2 L | 452,0 L |
| Spirit of Australia | 44,0 L | 53,0 L | 55,0 L |
| Meridiano 180 | 1289,9 L | 1063,1 L | 1612,3 L |

También se actualizaron las previsiones Marsella–Barcelona con la misma carga y condiciones iniciales: 331,7 L para lancha, 783,6 L para pesquero, 901,0 L para yate, 4389,2 L para remolcador, 479,1 L para Spirit y 14 273,5 L para carguero, antes de la reserva. Los seis depósitos llenos cubren consumo previsto y reserva; la lancha queda cerca del límite recomendado. Estos valores del informe comparativo son previsiones, no seis nuevos viajes físicos hasta Barcelona.

El Spirit sí ejecutó por separado Marsella–Barcelona con el nuevo balance: **347,72 km, 488,48 L consumidos, 411,52 L restantes y cero contactos**. Quedó el 45,7% del depósito. El estimador previó 479,08 L más 119,77 L de reserva, que cubren el consumo ejecutado. [Registro de ese viaje](../artifacts/planning/spirit-fuel-after.json). La curva anterior agotaba sus 400 L tras 140,77 km; el cambio de autonomía no modifica empuje, masa ni resistencia.

El [informe comparativo actual](../artifacts/planning/fuel-estimates.json) conserva cifras sin redondear, duración y clasificación. `npx tsx scripts/route-fuel-benchmark.ts` reproduce las seis travesías hasta Cassis y las previsiones hasta Barcelona. `tests/route-estimate.test.ts` comprueba esas travesías, el viaje físico del Spirit hasta Barcelona, límites entre estados de autonomía, depósito vacío, planificación desde reposo o amarrado, carga, daño, corriente y distancia desde la posición actual. El cruce físico completo del pesquero hasta Nueva York, con sus diez repostajes, se documenta en [FUEL_ITINERARIES.md](FUEL_ITINERARIES.md).

## Comparación reproducible

Ejecutar `npm run benchmark`. Todos los barcos usan carga 35%, sin viento/corriente. Se mide aceleración desde reposo durante 60 s, frenado a toda reversa desde 6 m/s con motor inicialmente a plena potencia y giro con todo el timón durante 10 s desde 6 m/s. Empezar cada maniobra desde el mismo estado evita confundir distinta velocidad inicial con distinta maniobrabilidad.

| Barco | Velocidad a 60 s | Frenado desde 6 m/s | Tiempo de frenado | Giro en 10 s |
|---|---:|---:|---:|---:|
| Aguja 9 | 27,22 kn | 8,3 m | 3,0 s | 106,40° |
| Bruma 24 | 13,09 kn | 22,9 m | 9,0 s | 24,21° |
| Nácar 18 | 22,80 kn | 18,1 m | 6,6 s | 43,69° |
| Atlas 28 | 8,35 kn | 13,0 m | 5,5 s | 25,68° |
| Spirit of Australia | 275,50 kn | 35,2 m | 16,6 s | 63,92° |
| Meridiano 180 | 3,28 kn | 543,7 m | 210,8 s | 0,75° |

Son resultados de estos parámetros de juego, no datos de ensayo real. El remolcador empieza la prueba de frenado por encima de su velocidad estable habitual para conservar la condición común. Los valores de frenado no incluyen tiempo de reacción del jugador. El carguero frena a 6 m/s en cientos de metros; a velocidades mayores, con más carga o retraso en aplicar reversa, necesita mayor distancia.

El benchmark de CPU con el carguero, mundo costero real incluido y 100× integró 500 s simulados (15 000 pasos) en aproximadamente **99 ms** en el entorno local Node.js usado durante el desarrollo; unos **0,330 ms por fotograma equivalente de 60 Hz**. Esta cifra excluye renderizado, carga de datos e interfaz. No es una prueba de rendimiento móvil ni garantiza FPS en otros equipos. El comando imprime una medición nueva cada vez.

`npm run benchmark -- --routes` añade travesías automáticas completas entre Marsella y Cassis, informa combustible, tiempo, llegada y colisiones. Añadir `--weather` activa el clima evolutivo de calma con semilla 4821. Añadir `--long --weather` verifica Marsella–Barcelona con pesquero y carguero.

Se verificaron los seis barcos en la ruta que planifica la interfaz, desde Marsella hasta Cassis, con clima evolutivo: todos llegaron sin contactos, dentro de los límites de posición/velocidad para atracar y con más del 25% del combustible. El Spirit recorrió 29 550,27 m en 1346,50 s, gastó 107,04 L y llegó a 24,89 m del destino, a 0,749 m/s. Los seis barcos completaron la ruta a 1× y solicitando 100× con estados finales idénticos, sin contactos. [Registro de esta calibración](../artifacts/steering/physics-report.json). En una validación anterior también se completó Marsella–Barcelona con pesquero (67 153 s simulados; 795,6 L consumidos) y carguero (58 894 s; 14 490,8 L), sin contactos. Estas comprobaciones corresponden al mar en calma, semilla 4821, carga 35% y las rutas de demostración indicadas.

`npm test` verifica dinámica, invariancia respecto al framerate, aceleración temporal, deriva, consumo, colisiones y límites del piloto. Incluye regresiones de los seis barcos hasta Cassis y de todos ellos con solicitud de 100×, con reducción automática a 1× durante la llegada. `tests/hydroplane.test.ts` añade seis casos específicos de consumo, aceleración hasta el récord, giro a alta velocidad, frenado y reversa auxiliar, equivalencia entre 30/60/144 FPS y 100×, y colisión continua contra un obstáculo delgado a velocidad de récord.

La calibración de giro se compara también a velocidades de navegación: desde 142 m/s, el Spirit gira 69,40° en diez segundos, con 6,94°/s tras el primer segundo y 0,42° de deriva angular. Desde 12 m/s, la lancha reduce la deriva de 20,04° a 7,34°; el yate, desde 10 m/s, de 13,37° a 5,80°. Son maniobras de juego con motor inicialmente a plena potencia, carga 35% y agua/aire inmóviles. `tests/steering.test.ts` comprueba agarre, disipación sin motor, dirección en reversa y equivalencia temporal de los seis barcos.
