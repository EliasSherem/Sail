# Puertos y corredores regionales del juego

La red contiene **293 destinos costeros**: los 105 anteriores más **188 servicios nuevos**. La ampliación comprende 46 destinos en México, Baja California y el Mediterráneo, 31 escalas adicionales del Atlántico norte, 97 en otras costas americanas, África, mar Rojo y Asia, y 14 en Patagonia, Tierra del Fuego y la península Antártica. Es una selección mundial amplia, no un catálogo completo de todos los puertos.

Los destinos usan nombres reales y posiciones regionales aproximadas. **El punto seleccionable, el muelle y el servicio de repostaje son representaciones de juego**. No son coordenadas certificadas de atraque ni una afirmación sobre disponibilidad real de combustible. Esto incluye los fondeos costeros remotos del Ártico. La posición se desplaza cuando hace falta para cumplir el margen de la costa simplificada: el mayor ajuste actual es de 35 km en Jacksonville y 25 km en Duba; Belawan requiere 10 km y los demás quedan en 5,5 km o menos. Los accesos de estuario representan fondeos exteriores, no toda su navegación interior. [Auditoría de posiciones](port-placement-audit.json).

Las coordenadas de los 20 puertos originales se conservan. Los nuevos conectores locales pueden acortar un acceso sin cruzar tierra: Marsella–Cassis pasa de 30 418,936 m a **27 326,529 m**, con barrido continuo de 90 m, resultado simétrico y equivalencia al planificar desde la posición del barco.

## Referencias geográficas primarias

Consulta y ampliación: 27 de septiembre de 2026. Las fuentes acreditan nombres y regiones; las posiciones exactas de los muelles ficticios se calculan contra la geometría del juego.

- [NGA, World Port Index, catálogo JSON](https://msi.nga.mil/api/publications/world-port-index?output=json): referencia general de nombres y coordenadas regionales; el catálogo consultado contiene 2951 registros. [Explicación de campos](https://msi.nga.mil/api/publications/download?key=16920959%2FSFH00000%2FWPI_Explanation_of_Data_Fields.pdf&type=view).
- [Gobierno de México, puertos y terminales](https://www.gob.mx/puertosymarinamercante/acciones-y-programas/puertos-y-terminales): destinos de ambas costas mexicanas. [SEMAR, costa occidental de Baja California](https://digaohm.semar.gob.mx/derrotero/derrotero/bc.pdf), [SEMAR, estación San Quintín](https://oceanografia.semar.gob.mx/Templates/grafnum_sanquintin.html) y [APIBCS, Puerto San Carlos](https://apibcs.com.mx/puerto-de-san-carlos/): escalas de Baja California.
- [Gobierno de Nunavut, Qikiqtarjuaq](https://www.gov.nu.ca/en/communities/qikiqtarjuaq), [Parks Canada, Torngat Mountains](https://parks.canada.ca/pn-np/nl/torngats/visit.aspx) y [Torngat Mountains Base Camp, llegada en barco](https://thetorngats.com/plan-your-trip/piloting-your-own-plane-or-vessel-to-the-park/): comunidades y fondeos de Baffin y Labrador.
- [GEUS, costa oriental de Groenlandia](https://eng.geus.dk/media/14054/nr27_p37-68.pdf), [GEUS, nombres regionales](https://www.geus.dk/media/13684/nr18_001-126.pdf) y [DMI, Timmiarmiut](https://ocean.dmi.dk/arctic/timmiarmiut.php): escalas groenlandesas.
- [Servicio Hidrográfico Canadiense, estación 03995](https://tides.gc.ca/en/stations/03995), [DFO, referencia costera](https://waves-vagues.dfo-mpo.gc.ca/Library/20190.pdf) y [Gobierno de Canadá, publicación costera](https://publications.gc.ca/collections/collection_2023/mpo-dfo/Fs74-38-2021-12-eng.pdf): ubicaciones regionales de las conexiones canadienses.

Las fuentes adicionales y semillas de cada ampliación se conservan en [regional-service-additions.json](regional-service-additions.json), [atlantic-service-additions.json](atlantic-service-additions.json), [coastal-service-additions.json](coastal-service-additions.json) y [drake-service-additions.json](drake-service-additions.json). Los cuatro archivos incluyen también las cadenas de servicios que se incorporan al generador. Las semillas consolidadas están en [port-seeds.json](port-seeds.json).

## Patagonia y paso Drake

Ampliación consultada el 29 de septiembre de 2026: **14 destinos** enlazan la red existente con Puerto Montt, Puerto Chacabuco, Puerto Natales, Punta Arenas, Ushuaia y Puerto Williams; la costa atlántica incorpora Bahía Blanca, Puerto Madryn, Puerto Deseado y Río Gallegos. Sus posiciones regionales proceden del [World Port Index de NGA](https://msi.nga.mil/api/publications/world-port-index?output=json). Cabo de Hornos usa como referencia el área costera de transferencia publicada por [DIRECTEMAR](https://www.directemar.cl/directemar/site/edic/base/port/estrechodemagallanes_es.html).

Las tres escalas antárticas son Bahía Fildes, junto a la isla Rey Jorge y la base Escudero, documentada por [INACH](https://www.inach.cl/expedicion-antartica/bases-chilenas-en-antartica-2/base-profesor-julio-escudero/) y sus [coordenadas oficiales](https://www.mercadopublico.cl/Procurement/Modules/RFB/DetailsAcquisition.aspx?qs=Id4Ohl6oWafOr9Cco2k9Xg%3D%3D); Whalers Bay, en isla Decepción, según la [Secretaría del Tratado Antártico](https://www.ats.aq/devAS/Ats/Guideline/e36c1a8f-3ae7-4187-9b24-194c8cf5e780); y Port Lockroy, según el [Gobierno del Territorio Antártico Británico](https://www.britishantarcticterritory.org.uk/heritage/port-lockroy/). Son referencias geográficas de estaciones científicas y sitios históricos: **el atraque y repostaje antárticos y el fondeo de Hornos son servicios ficticios del juego**, sin afirmar disponibilidad comercial real.

Los 14 fondeos se desplazan entre **0 y 5,5 km** respecto de sus semillas para ajustarse a la costa simplificada, sin trasladar los puertos de fiordo a otra región. Las posiciones, fuentes y comprobaciones están en [drake-service-additions.json](drake-service-additions.json) y la [auditoría de colocación](port-placement-audit.json). El cruce Hornos–Fildes mide como mínimo **840 km en línea geodésica**; el recorrido navegable puede ser mayor. No se añade una isla ni una escala imaginaria en medio del Drake: cada barco debe cubrirlo con su autonomía y reserva reales. Chacabuco–Natales conserva asimismo su recorrido oceánico por el corredor existente al sur de Chile.

## Conectividad y alcance

La ampliación cubre las costas del golfo de México y Baja California, el enlace entre Acapulco y Los Cabos, la costa italiana y las islas del Mediterráneo hacia Israel, nuevos pasos del Atlántico norte, y más servicios en América, África y Asia. Se comprobaron accesos y conexión en ambos sentidos de los **293 destinos**, con el casco completo del carguero y los muelles fuera de tierra. [Auditoría global](global-network-audit.json).

La autoría genera **662 cadenas** y 1141 nodos adicionales, con cero tramos fallidos. Los corredores se calculan fuera del juego y se guardan como puntos explícitos. Exigen barridos continuos de 100 m en los corredores y 95 m en las salidas de fondeo; al ejecutarse se vuelven a comprobar contra costa, muelles y canales. Los conectores locales de hasta 50 km también se validan con un radio de 90 m. Un índice espacial y árboles de destinos cacheados mantienen local esa búsqueda al crecer la red. [Auditoría de corredores](ocean-route-audit.json).

Panamá y Suez tienen agua en la geometría compartida, con ejes simplificados y canales ensanchados para el juego. No hay esclusas ni cambios de nivel. Gibraltar conserva su corredor de 2 km de margen. Ningún puerto original se mueve para crear un atajo.

El itinerario atlántico septentrional dispone de escalas por la costa ibérica, Irlanda/Escocia, Feroe, Islandia, Groenlandia, Baffin, Labrador, Terranova y la costa oriental americana. La lancha, yate, Vector y Spirit obtienen planes viables hasta Nueva York y también desde Marsella hasta Haifa con el consumo físico y la reserva actuales. El número de escalas depende del barco, combustible, carga y clima; no existe un único salto máximo aplicable a todos los planes. La [auditoría de 16 viajes](../artifacts/long-voyages/plans.json) verifica estas cuatro embarcaciones en el Atlántico, Mediterráneo y dos travesías mexicanas. El juego no reproduce hielo, permisos ni estacionalidad de la navegación ártica.

La conectividad geográfica no garantiza autonomía entre cualquier pareja de puertos. Quedan huecos largos, como Namibe–Walvis Bay y Colombo–Malaca, además de travesías oceánicas sin servicios intermedios. Si ninguna cadena cabe en el presupuesto, el planificador explica el rechazo y conserva el combustible real; no crea estaciones en mar abierto. [Modelo de itinerarios](FUEL_ITINERARIES.md).

## Reproducción de la auditoría

- `npx tsx scripts/build-port-network.ts`: semillas consolidadas → fondeos y auditoría de posición.
- `npx tsx scripts/build-ocean-routes.ts`: cadenas originales y los cuatro archivos de ampliación → corredores explícitos, caché y auditoría; cada entrada cacheada vuelve a validarse.
- `npx tsx scripts/audit-global-network.ts`: conexión, colocación del carguero, muelles fuera de tierra y corredores atlánticos.
- `npx vitest run tests/global-ports.test.ts tests/ports-expansion.test.ts tests/geo.test.ts tests/canals.test.ts --maxWorkers=2`: **68 pruebas aprobadas**, incluidos barridos, canales y regresiones físicas regionales.
- `npx vitest run tests/refuelling-network.test.ts --maxWorkers=1`: **6 pruebas aprobadas** de itinerarios regionales con servicios, reserva e inmutabilidad del estado.

Los JSON de auditoría describen el modelo del juego; no constituyen datos oficiales de navegación ni evidencia de servicios comerciales reales.
