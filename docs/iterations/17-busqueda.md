# Iteración 17 - Búsqueda y filtros integrados con la paginación

## SPEC

### Objetivo

Permitir buscar y filtrar coches en el listado (por modelo, marca, combustible, transmisión y rango de precio, y elegir el orden), combinándolo con la paginación del servidor y guardando la búsqueda en la URL para poder compartirla, recargarla o recuperarla con «atrás».

### Requisitos funcionales

- **Barra de búsqueda.** Encima del listado, para cualquier visitante, con estos controles:
  - **Modelo**: texto libre (hasta 100 caracteres) que busca dentro del nombre del modelo, sin distinguir mayúsculas.
  - **Marca**: lista con las marcas del catálogo (cargadas del servidor, las mismas que usa el formulario).
  - **Combustible** (Gasolina, Diésel, Eléctrico) y **Transmisión** (Manual, Automático): listas, con opción de quitar la selección.
  - **Precio mínimo** y **precio máximo**, en euros.
  - **Ordenar por**: Más recientes (por defecto), Precio de menor a mayor, Precio de mayor a menor y Menos kilómetros.
- **Cuándo se busca.** Solo al pulsar «Buscar» (o Intro): no se pide nada al servidor mientras se escribe. «Limpiar» vacía la barra y muestra de nuevo todos los coches; está desactivado si no hay nada escrito ni aplicado.
- **Resultados.** Se ve el mismo listado de siempre, con el total actualizado («Mostrando 1-9 de 14 coches»). Los filtros se combinan entre sí (se cumplen todos a la vez).
- **Paginación.** Al buscar con otros filtros se vuelve a la primera página. Al cambiar de página se conservan los filtros. Si la página pedida ya no existe con esos filtros, se va a la última que quede.
- **Precio.** Si el mínimo es mayor que el máximo se avisa («El precio mínimo no puede ser mayor que el máximo») y no se busca; el aviso desaparece al corregirlo. Mínimo y máximo iguales es un intervalo válido.
- **Sin resultados.** Si hay filtros y no hay coches, se dice «No se han encontrado coches con esos filtros.» (distinto del «No hay coches disponibles en este momento.» de un catálogo vacío) y la barra sigue a la vista para cambiarlos o limpiarlos.
- **Errores.** Si falla la búsqueda se muestra el error con «Reintentar», que repite la misma búsqueda con sus filtros y su página. Si fallan solo las marcas, se desactiva únicamente ese filtro (con un «Reintentar»), y el listado y el resto de filtros siguen funcionando.
- **La búsqueda vive en la URL**, por ejemplo `/?texto=ibiza&marca=2&combustible=diesel&precio_max=15000&orden=precio_asc&pagina=2`:
  - se puede compartir, recargar o abrir directamente, y la barra se rellena con lo que hay en la URL;
  - «atrás» y «adelante» del navegador recuperan las búsquedas anteriores y rellenan la barra;
  - los valores no válidos escritos a mano en la URL (una marca que no es un número, un combustible desconocido, un intervalo de precios imposible…) se ignoran en lugar de dar error;
  - el orden por defecto y la primera página no aparecen en la URL.
- **Otras pantallas.** Tras eliminar un coche con una búsqueda activa, se vuelve a pedir la misma página con los mismos filtros.

### Requisitos técnicos

- `src/utils/filtros.js`: `filtrosDesdeQuery` (lee y valida la URL, ignorando lo no válido), `queryDesdeFiltros` (la operación inversa) y `hayFiltros`. Un objeto de filtros solo contiene los que están activos.
- `FiltrosCoches` (componente): no consulta nada; se rellena con los filtros aplicados y emite `buscar` con los nuevos y `reintentar-marcas`. Usa PrimeVue (`InputText`, `Select`, `InputNumber`, `Button`).
- La tienda `coches` guarda los `filtros` actuales y los envía al servicio `buscarCoches` de la práctica 1 (que ya valida y aplica todos esos filtros en el servidor), junto con la página y el tamaño. Sin filtros, la llamada es la misma de antes.
- `ListadoView` obtiene los filtros de la URL, vuelve a pedir los datos cuando cambia la página o algún filtro (y no por parámetros ajenos), y usa la tienda de marcas compartida con el formulario.
- En los tests, el servicio de marcas se sustituye por defecto (`tests/preparar-entorno.js`) para que el listado no toque la red; los tests que necesitan marcas concretas declaran su propio mock.

### Fuera de alcance

- Mostrar coches no disponibles (el listado muestra solo los disponibles, como en la práctica 1).
- Filtros por año, kilometraje o potencia, o búsqueda por texto en la descripción.
- Cambiar cuántos coches se muestran por página.
- Mostrar los filtros activos como etiquetas que se pueden quitar de una en una.

## PLAN

1. Crear `src/utils/filtros.js`.
2. Ampliar la tienda `src/stores/coches.js` con los filtros.
3. Crear `src/components/FiltrosCoches.vue`.
4. Integrar la barra en `src/views/ListadoView.vue` (filtros en la URL, recarga al cambiar, marcas, mensaje de «sin resultados»).
5. Sustituir por defecto el servicio de marcas en `tests/preparar-entorno.js` (y usar el real en `tests/setup.test.js`).
6. Crear `tests/filtros.test.js`, `tests/filtros-coches.test.js` y `tests/busqueda.test.js`; ampliar `tests/coches.store.test.js` y `tests/eliminar-coche.test.js`.
7. Ejecutar `npm test` y `npm run build`.
8. Probar a mano con el Supabase real.

Decisiones: los filtros viven en la URL, para que funcionen atrás/adelante, recargar y compartir; solo se busca al pulsar «Buscar», para no lanzar una petición por cada tecla; al cambiar los filtros se hace una navegación nueva (`push`), de modo que «atrás» recupera la búsqueda anterior; la URL se lee con tolerancia (se ignora lo no válido), porque cualquiera puede escribir lo que quiera en la barra de direcciones; se reutiliza el filtrado del servicio de la práctica 1, sin duplicarlo en el cliente; la barra es un componente que no consulta nada, y la pantalla decide qué hacer con lo que emite; el modelo de la URL usa `marca` en lugar de `marca_id` para que sea más legible.
Riesgo: un intervalo de precios imposible en la URL se descarta entero (mínimo y máximo), no solo uno de ellos.

## TEST_PLAN

| Caso | Resultado esperado | Resultado obtenido |
|---|---|---|
| Barra de búsqueda visible con sus siete controles y las marcas del servidor (pedidas una vez) | Aparecen; las marcas se piden una sola vez |  |
| Escribir sin pulsar «Buscar» | No se pide nada al servidor |  |
| Buscar por modelo | La URL lleva `?texto=` y solo salen los coches que lo contienen |  |
| Buscar combinando varios filtros | Se cumplen todos a la vez; la URL los refleja |  |
| Ordenar por precio ascendente, descendente y por kilómetros | El listado sale en ese orden |  |
| Buscar desde la página 3 | Vuelve a la primera página |  |
| Cambiar de página con filtros activos | Se conservan los filtros |  |
| Precio mínimo mayor que el máximo | Aviso, no se busca y desaparece al corregirlo |  |
| Abrir una URL con filtros | Se aplican y la barra se rellena |  |
| URL con valores no válidos escritos a mano | Se ignoran, sin errores |  |
| «Atrás» y «adelante» tras varias búsquedas | Recuperan la búsqueda y rellenan la barra |  |
| «Limpiar» | Quita los filtros de la URL y vuelve a mostrar todos; está desactivado si no hay nada |  |
| Sin resultados con filtros | «No se han encontrado coches con esos filtros.»; la barra sigue visible |  |
| Catálogo vacío sin filtros | Mantiene «No hay coches disponibles en este momento.» |  |
| Endurecer filtros desde una página que deja de existir | Va a la última página que quede |  |
| Error al buscar y «Reintentar» | Repite la misma búsqueda con sus filtros y su página |  |
| Error al cargar las marcas | Solo se desactiva ese filtro; el resto funciona; se puede reintentar |  |
| Parámetro ajeno en la URL (por ejemplo `utm=x`) | No vuelve a pedir los datos |  |
| Eliminar un coche con una búsqueda activa (administrador) | Se vuelve a pedir la misma página con los mismos filtros |  |
| Funciones de `filtros.js` y la tienda | Leen y escriben la URL con tolerancia; la tienda envía los filtros al servicio |  |
| `npm run build` | Sin errores |  |
| Comprobación manual con el Supabase real: buscar por modelo, por marca y por rango de precio | Los resultados son los correctos |  |
| Comprobación manual: la búsqueda por modelo no distingue mayúsculas ni acentos como se espera, y escribe `%` o `_` | Se buscan literalmente, sin errores |  |
| Comprobación manual: copiar la URL de una búsqueda y abrirla en otra pestaña | Muestra los mismos resultados |  |
| Comprobación manual: usar «atrás» tras varias búsquedas | Recupera cada búsqueda |  |
| Comprobación manual: un coche marcado como no disponible | No aparece en el listado |  |

### Tests automáticos

- `tests/filtros.test.js` (12 tests): lectura y escritura de los filtros de la URL, con valores no válidos.
- `tests/filtros-coches.test.js` (17 tests): la barra (campos, rellenado, buscar, limpiar, aviso de precios, marcas).
- `tests/busqueda.test.js` (19 tests): la búsqueda completa con la aplicación (buscar, URL, paginación, atrás/adelante, limpiar, sin resultados, errores).
- `tests/coches.store.test.js` (28 tests): se añaden los filtros.
- `tests/eliminar-coche.test.js` (18 tests): se añade eliminar con una búsqueda activa.
- Los tests de las iteraciones anteriores no cambian de comportamiento; el servicio de marcas se sustituye por defecto en `tests/preparar-entorno.js`.
- Comprobación de que los tests detectan fallos: al quitar el reinicio de página y al dejar de enviar los filtros al servicio, fallan los tests correspondientes.
- Además, la IA comprobó el flujo en un navegador real contra un Supabase simulado (buscar, combinar, ordenar, paginar con filtros, limpiar, sin resultados, URL compartida con valores no válidos, «atrás»); esa prueba no sustituye a la comprobación manual con tu Supabase real.

**Resultado de la ejecución:** (pendiente: se rellena después de ejecutar `npm test` —deben salir 23 archivos y 335 tests—, `npm run build` y las comprobaciones manuales).

## AI_LOG

### Herramienta usada

- Herramienta: Claude Code
- Modelo: Claude Sonnet 5.5 (sesión en la nube)
- Tipo: asistente de código en la nube

### Uso realizado

Se usó la IA para:

- proponer el diseño (filtros en la URL, búsqueda solo al pulsar «Buscar», lectura tolerante de la URL, barra como componente que no consulta nada);
- **redactar la SPEC, el PLAN y el TEST_PLAN** (por petición del estudiante, que los revisa y los hace suyos);
- generar el código y los tests;
- comprobar el flujo en un navegador real contra un Supabase simulado y mejorar el ancho del selector de orden tras ver una captura.

### Prompt importante 1

«vamos con la iteración 17». Resultado: búsqueda con filtros y orden integrada con la paginación del servidor y guardada en la URL.

### Decisiones de diseño propuestas por la IA

[REVISAR: confirma que las aceptas o anota las que cambiaste]

- Los filtros viven en la URL.
- Solo se busca al pulsar «Buscar».
- Cada búsqueda nueva es una navegación (`push`), para que «atrás» la recupere.
- La URL se lee con tolerancia: lo no válido se ignora.
- Se reutiliza el filtrado del servidor de la práctica 1.
- La barra es un componente que no consulta nada.

### Se rechazó o descartó

- Buscar en cada pulsación de tecla: descartado, lanzaría una petición por letra.
- Filtrar en el cliente los coches ya cargados: descartado, solo se tiene una página; el filtrado lo hace el servidor.
- Guardar los filtros solo en memoria: descartado, se perderían al recargar y no se podría compartir la búsqueda.

### Correcciones manuales

- [COMPLETAR: cambios que hayas hecho tú, o «Ninguna»]

## COMMITS RELACIONADOS

- `HASH_17` - (se rellena al hacer el commit)
