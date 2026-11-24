# Spirit of Australia en DERIVA

Spirit es una de las siete embarcaciones y una recreación jugable del hidroplano de tres puntos **Spirit of Australia**, construido y pilotado por Ken Warby. El [Museo Marítimo Nacional de Australia](https://www.sea.museum/en/society-and-water/ken-warby) documenta el récord mundial de **511,11 km/h**, promedio de dos pasadas en Blowering Dam en 1978. Ese promedio histórico sirve como objetivo de calibración en condiciones constantes del juego; no es una medición de la velocidad instantánea máxima del barco real.

La [ficha del museo en Google Arts & Culture](https://artsandculture.google.com/asset/spirit-of-australia/uwEpuduoPnHl_g) registra dimensiones de **1080 × 8230 × 2440 mm** y masa de **1524 kg**. La eslora, manga y masa del juego toman esos valores. [Warby Motorsport](https://warbymotorsport.com/boats/spirit-of-australia/) describe la construcción en madera, el desarrollo de las carenas y tomas de aire, y el motor **Westinghouse J34** usado en las tentativas. Se representa el barco original; no su sucesor Spirit of Australia II.

La geometría y sus materiales están creados con código para este proyecto. No se incorpora un modelo 3D descargado del museo. No es una réplica de ingeniería: fuerzas, combustible, calado, carga y maniobrabilidad son aproximaciones para jugar, sin CFD, sustentación dinámica ni simulación de accidentes de un hidroplano real.

## Parámetros del juego

| Parámetro | Valor y procedencia |
|---|---|
| Eslora / manga / masa base | 8,23 m / 2,44 m / 1524 kg; catálogo del museo |
| Calado / carga máxima | 0,35 m / 120 kg; aproximaciones de juego |
| Empuje máximo / respuesta del reactor | 15 600 N / constante de 4,8 s; calibración de juego |
| Combustible | 900 L de capacidad; 40–500 L/h nominales con curva lineal y factor de carga; balance de juego para travesías, no cifras del J34 histórico |
| Crucero del piloto | 60 kn configurados; orden inicial al 88%, reducida en giros y aproximación |
| Reversa | Propulsor auxiliar ficticio de 312 N; unos 9,7 km/h hacia atrás |
| Integración | Paso fijo de 1/30 s; mismas fuerzas, combustible, colisiones y geodesia que los demás barcos |

La resistencia longitudinal disminuye progresivamente su componente de desplazamiento al ganar velocidad. La deflexión efectiva del timón se reduce a alta velocidad. La velocidad máxima resulta de esas fuerzas y de la resistencia del aire; no se impone moviendo directamente el barco. [Fórmulas del modelo](PHYSICS.md).

## Cómo probarlo

En la selección inicial, elige **Spirit of Australia → Probar en mar abierto**. Empieza a **42° N, 4° E**, con mar en calma, sin viento ni corriente y carga del 35%. Avante ya está seleccionado; sube la potencia con `W` o la barra y mantén el timón centrado. `C` alterna las cámaras; `1` abre la primera persona y `3` la tercera. Arrastra en primera persona para mirar desde el cockpit.

`Espacio` corta potencia y selecciona neutral; la inercia permanece. `R` o **REV** selecciona la adaptación auxiliar de frenado y maniobra; regula su empuje con la potencia. Desde la velocidad de récord necesita kilómetros para detenerse. **Ajustes → Banco de pruebas** permite repetir la escena controlada con potencia máxima ya seleccionada.

## Resultados físicos comprobados

Condiciones de aceleración: carga del 35%, agua y aire en reposo, timón centrado, potencia máxima desde parado. Son resultados del juego, no ensayos del barco histórico.

| Tiempo simulado | Velocidad |
|---|---:|
| 10 s | 153,03 km/h |
| 30 s | 467,34 km/h |
| 60 s | 510,22 km/h |
| 90 s | 511,093 km/h |
| 120 s | 511,1097 km/h |

Desde unos 511,11 km/h, REV detuvo el avance en **83,37 s y 3263 m**. El retroceso estable fue **2,69 m/s**. Con la nueva calibración, todo el timón durante 10 s desde 142 m/s produce 69,40° de giro, con 6,94°/s tras el primer segundo y sólo 0,42° de deriva angular. La resistencia lateral aumenta con el flujo longitudinal; la guiñada sigue surgiendo de fuerzas y amortiguación. Las pruebas de giro sin empuje verifican disipación de energía.

## Autonomía actual y escalas

El balance actual conserva el depósito de **900 L** y reduce el caudal nominal del reactor a **40 L/h al ralentí y 500 L/h a plena potencia**. Con la carga de prueba del 35%, la fórmula física aplica 39,96 y 499,5 L/h respectivamente. Planificador y motor usan los mismos valores. La curva lineal del reactor, las fuerzas, velocidad, frenado y respuesta del motor se conservan; la autonomía es una decisión de jugabilidad, no una especificación del J34 histórico.

La red tiene **279 puertos**, incluidos 174 servicios nuevos. El Spirit ya obtiene rutas con escalas tanto a través del Atlántico como desde Marsella hasta Israel. La [auditoría actual](../artifacts/long-voyages/plans.json), con carga del 35%, depósito lleno y calma de semilla 4821, verifica:

| Viaje | Distancia planificada | Etapas | Escalas para repostar |
|---|---:|---:|---:|
| Marsella–Nueva York | 14 655,56 km | 29 | 28 |
| Marsella–Haifa | 4637,27 km | 11 | 10 |
| Acapulco–Los Cabos | 1505,43 km | 3 | 2 |
| Cancún–Veracruz | 1109,89 km | 2 | 1 |

Cada etapa cabe con su consumo previsto más **25% adicional de reserva**. El presupuesto cubre el mayor consumo por segmento entre piloto y plena potencia, clima desfavorable y maniobras. Los planes no añaden combustible: cada escala requiere llegar, reducir velocidad, atracar a menos de 1 km y repostar. Al preparar otra etapa se revisa la posición, combustible y clima reales, por lo que el itinerario puede cambiar. Estos resultados acreditan planes comprobados por combustible y barrido geográfico; no afirman que se hayan ejecutado físicamente los cuatro viajes completos. [Funcionamiento y auditorías de combustible](FUEL_ITINERARIES.md).

Los servicios costeros son representaciones de juego junto a lugares reales, especialmente en los fondeos árticos; no afirman que allí pueda repostarse en la realidad. También quedan brechas de cobertura, como Namibe–Walvis Bay o Colombo–Malaca, para las que el planificador mantiene el rechazo si no existe una cadena asequible. No inventa estaciones oceánicas ni extiende automáticamente el depósito.

Los registros de combustible anteriores se conservan como antecedentes. Con la calibración de 900 L y 60–650 L/h, el viaje físico Marsella–Barcelona consumió 488,48 L, terminó con 411,52 L y no tuvo contactos: [ensayo de la calibración anterior](../artifacts/planning/spirit-fuel-after.json). La versión aún anterior, de 400 L y 180–950 L/h, agotaba el combustible tras 140,77 km: [comparación histórica](../artifacts/planning/spirit-fuel-before.json). Sus cifras no describen el nuevo caudal de 40–500 L/h.

Las regresiones previas de Marsella–Cassis verificaron llegada y estados finales idénticos a 1× y solicitando 100×, con reducción automática cerca del destino. El [registro de giro y travesías anterior](../artifacts/steering/physics-report.json) conserva el combustible de la calibración antigua; sus cifras de consumo no describen el depósito y curva actuales.

`npm test` incluye seis casos en `tests/hydroplane.test.ts`: curva del reactor, aceleración y récord, giro estable, inercia/frenado/reversa, equivalencia entre 30/60/144 FPS y 100×, y barrido del casco contra un obstáculo delgado a velocidad de récord. La regresión general de `tests/physics.test.ts` incluye su travesía completa hasta Cassis; `tests/route-estimate.test.ts` añade el viaje físico hasta Barcelona con más del 25% del depósito restante. `npm run benchmark` compara las siete embarcaciones desde condiciones comunes. `npx tsx scripts/spirit-fuel-benchmark.ts` ejecuta la prueba regional con los parámetros vigentes; `--legacy` reproduce el balance histórico inicial en un proceso aislado. `npx tsx scripts/long-voyage-audit.ts` comprueba los planes largos; `--sail=spirit:marseille:new-york` integra el cruce físico y sólo acredita su final cuando el registro marca `passed` y `physical.completed`. La comprobación visual y de navegador queda registrada en [VALIDATION.md](VALIDATION.md).
