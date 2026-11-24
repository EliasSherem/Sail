# Itinerarios con repostaje

La red actual reúne **279 puertos de servicio**, incluidos **174 añadidos** para cubrir huecos entre escalas. La planificación y la integración física comparten los parámetros de combustible de cada barco. La ampliación permite planificar cruces atlánticos y viajes largos por el Mediterráneo también con la lancha, el yate, el Vector 38 y el Spirit of Australia; las escalas y el presupuesto de cada etapa siguen siendo obligatorios.

## Combustible y reserva

| Barco | Depósito | Ralentí nominal | Caudal nominal a plena potencia |
|---|---:|---:|---:|
| Aguja 9 | 420 L | 0,8 L/h | 26 L/h |
| Nácar 18 | 2400 L | 4 L/h | 125 L/h |
| Vector 38 | 1400 L | 4 L/h | 380 L/h |
| Spirit of Australia | 900 L | 40 L/h | 500 L/h |

Estos caudales son un balance de juego, con el factor de carga y la curva de motor aplicados por `fuelRate`. Los depósitos mantienen su capacidad anterior; la mejora de autonomía procede de la reducción del consumo físico y de las nuevas escalas. El mapa usa los mismos valores. El pesquero, remolcador y carguero mantienen sus parámetros.

El presupuesto toma por segmento el máximo del gasto físico a crucero y a máxima potencia. Una envolvente de 72 muestras del clima sintético en unas 30 horas considera cambios desfavorables de viento y corriente; conserva las condiciones personalizadas mediante ratios y diferencias angulares. Las maniobras añaden combustible a caudal máximo: aceleración y frenado mediante cuadratura de las fuerzas reales, respuesta del motor, giros y aproximación. Después se añade **una reserva del 25% del consumo previsto**, no del depósito completo. Los desvíos repetidos, la espera con motor encendido y los cambios de clima requieren revisar el plan.

## Búsqueda de escalas

`planFuelItineraryAsync(world, state, destinationId, weather)` busca un itinerario entre puertos con acceso validado. La versión síncrona, `planFuelItinerary`, sirve para ensayos CPU. Ambas comparten cálculo; la asíncrona copia las condiciones iniciales y cede el hilo entre bloques de trabajo.

La primera opción es la ruta directa si el combustible actual cubre consumo y reserva. Si no cabe, A* combina corredores navegables entre puertos. Cada tramo debe caber en el depósito con la misma reserva. El primer tramo usa el combustible actual; dentro del radio de servicio de 1 km, el plan también puede pedir explícitamente atracar y llenar antes de salir. Una marca `docked` antigua no permite repostar lejos del puerto.

Los tramos posteriores usan un depósito lleno **hipotético** para calcular su viabilidad y llevan `refuelBefore: true`. El planificador nunca modifica posición ni combustible. El jugador debe llegar, reducir velocidad, atracar y repostar para continuar. El tiempo previsto suma navegación y maniobras, sin contar las esperas del jugador. El combustible total suma consumo previsto, sin repetir reservas que permanecen a bordo.

Los estados son `feasible`, `needs-refuel` y `unreachable`. El segundo pide repostar antes de la primera etapa. El último explica la falta de conexión o una brecha que supera la autonomía; no inventa escalas ni añade combustible en mar abierto. Los nuevos servicios costeros representan instalaciones ficticias de juego junto a lugares reales: no afirman que exista repostaje comercial en esas coordenadas, especialmente en los fondeos árticos.

Al activar el piloto se verifica otra vez la etapa desde la posición y el combustible reales. Si hace falta, se insertan escalas antes del puerto activo. La revisión también se aplica durante el piloto, al preparar la siguiente etapa y al restaurar una partida. Un fallo conserva el destino y muestra su motivo; no sustituye el itinerario por una ruta directa sin servicios.

Al iniciar una etapa casi parado y con la proa opuesta al rumbo de salida, el piloto comprueba arcos de giro contra costa y muelles. Si un lado está bloqueado y el otro libre, maniobra con el acelerador y timón normales; no recoloca el casco. Las conexiones locales de puerto también se comprueban mediante barrido de 90 m y mantienen las mismas rutas al planificar desde una posición equivalente.

## Resultados de planificación actuales

La [auditoría de 16 viajes](../artifacts/long-voyages/plans.json) aprobó las cuatro rutas siguientes con los cuatro barcos pequeños, carga del 35%, depósito lleno y calma de semilla 4821. Cada etapa cumple su consumo previsto más reserva y todos sus segmentos tienen 90 m de margen contra costa y muelles.

| Barco | Marsella–Nueva York | Marsella–Haifa | Acapulco–Los Cabos | Cancún–Veracruz |
|---|---:|---:|---:|---:|
| Aguja 9 | 31 escalas | 10 escalas | 2 escalas | 1 escala |
| Nácar 18 | 32 escalas | 10 escalas | 2 escalas | 3 escalas |
| Vector 38 | 32 escalas | 10 escalas | 2 escalas | 1 escala |
| Spirit of Australia | 28 escalas | 10 escalas | 2 escalas | 1 escala |

Una escala es un puerto intermedio; el destino final no se cuenta como repostaje. Estos números corresponden a los planes de la auditoría: el estado real y el clima al continuar pueden requerir recalcularlos. Por ejemplo, el plan del Spirit hasta Nueva York mide 14 655,56 km y tiene 29 etapas; su tramo mayor es de 681,71 km. La lancha usa 32 etapas y un rodeo de 14 883,26 km. No se presenta esta validación de planes como la ejecución física completa de los 16 viajes.

La [comparación anterior](../artifacts/planning/network-gap-before.json) rechazaba siete de ocho casos de diagnóstico; el [resultado actualizado](../artifacts/planning/network-gap-after.json) acepta los ocho. Además aprobaron 68 pruebas geográficas y de canales y las seis regresiones de `tests/refuelling-network.test.ts`, que verifican escalas, reserva, inmutabilidad del estado y colisión geográfica.

Persisten huecos de cobertura para barcos de menor autonomía, como Namibe–Walvis Bay y la conexión desde Colombo hacia el estrecho de Malaca. La red tiene corredores geométricos allí, pero no siempre servicios suficientemente próximos. Se mantiene el rechazo cuando ningún itinerario cabe en el combustible real: no se resuelve inventando depósitos, puertos oceánicos ni repostajes automáticos. Las distancias de corredores están en [ocean-route-audit.json](ocean-route-audit.json).

## Travesías físicas completas con el balance actual

El Spirit completó **Marsella–Nueva York en 29 etapas**, recorriendo **14 658,145 km físicos en 153,0387 horas simuladas**, con **cero contactos**. En todas las etapas el consumo real quedó cubierto por la previsión antes de reserva; la menor diferencia entre combustible restante y reserva exigida al llegar fue de **29,70 L**. [Registro físico completo del Spirit](../artifacts/long-voyages/spirit-marseille-new-york.json).

La lancha Aguja 9 completó **Marsella–Haifa en 11 etapas**, recorriendo **4635,016 km físicos en 118,0522 horas simuladas**, con **cero contactos**. La menor diferencia entre combustible restante y reserva exigida fue de **181,47 L**. [Registro físico completo de la lancha](../artifacts/long-voyages/launch-marseille-haifa.json).

Ambos registros marcan `passed: true` y `physical.completed: true`. Usan carga del 35%, calma evolutiva y semilla 4821, con revisión de combustible al preparar cada etapa. Cada repostaje se realizó después de llegar dentro de 1 km y por debajo de 0,85 m/s, sin cambiar posición ni rumbo. Las distancias físicas difieren ligeramente del trazado porque el piloto captura puntos de paso y recalcula desde la llegada real. Estos dos ensayos físicos complementan la auditoría de 16 planes; no equivalen a ejecutar físicamente los otros 14 casos.

## Reproducción y registros físicos

- `npx tsx scripts/long-voyage-audit.ts`: reproduce los 16 planes actuales.
- `npx tsx scripts/long-voyage-audit.ts --sail=spirit:marseille:new-york`: integra un viaje físico, comprueba llegada, consumo y reserva por etapa, y sólo reposta tras llegar a menos de 1 km y por debajo de 0,85 m/s, conservando posición y rumbo. El registro sólo acredita un viaje completo cuando `passed` y `physical.completed` son verdaderos.
- `REPORT_PATH=artifacts/planning/network-gap-after.json npx tsx scripts/network-gap-audit.ts`: repite los ocho diagnósticos de cobertura.
- `npx vitest run tests/refuelling-network.test.ts tests/itinerary.test.ts --maxWorkers=2`: comprueba el contrato de planificación y las regresiones regionales.

Los ensayos físicos anteriores permanecen como registros históricos. El pesquero completó 21 etapas y 20 repostajes, 15 672,93 km y 34,231 días simulados, sin contactos, con la red anterior de 105 puertos; todas sus etapas consumieron menos que su previsión antes de reserva. [Resumen histórico](../artifacts/planning/itinerary-summary.json), [registro histórico](../artifacts/planning/itinerary-report.json). El [ensayo aún anterior a crucero](../artifacts/planning/itinerary-report-legacy-cruise.json) usaba otro criterio de presupuesto y 11 etapas. Sus cifras no describen los planes actuales de los barcos recalibrados.
