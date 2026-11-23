# Iteración 12 - Listado paginado de coches

## SPEC

### Objetivo

Mostrar a cualquier visitante el catálogo de coches disponibles, página a página, con la información necesaria para identificar cada uno y acceder a su detalle, y distinguiendo claramente los estados de carga, lista vacía y error.

### Requisitos funcionales

- **Listado.** La pantalla `/` muestra los coches disponibles (los que el backend devuelve por defecto) en una rejilla de tarjetas, de 9 en 9. No hace falta haber iniciado sesión.
- **Tarjeta de un coche.** Muestra:
  - su foto principal, con un texto alternativo con la marca y el modelo; si no tiene foto, un marcador «Sin foto»;
  - marca y modelo, precio en euros (con separador de miles, por ejemplo `18.500 €`), año y kilometraje (`45.000 km`);
  - etiquetas con el combustible (Gasolina, Diésel, Eléctrico) y la transmisión (Manual, Automático);
  - un botón «Ver detalle» y enlaces en la foto y el título, que llevan a `/coches/:id`.
- **Paginación.** Debajo de la rejilla hay un paginador con las páginas, los botones anterior y siguiente y el texto «Mostrando 10-18 de 25 coches». Cada cambio de página pide esa página al servidor (no se descargan todos los coches). Las etiquetas de accesibilidad del paginador están en español.
- **Página en la URL.** La página actual está en la dirección (`/?pagina=2`). Así se puede entrar directamente a una página, recargar sin perderla, y los botones atrás y adelante del navegador cambian de página. La primera página no añade nada a la URL.
- **Páginas no válidas.** Si `pagina` no es un entero mayor o igual que 1 (`abc`, `0`, `-2`, `1.5`, vacío), se muestra la primera página. Si es mayor que la última (por ejemplo, tras eliminar coches), se lleva al usuario a la última página.
- **Estados de la carga.**
  - Cargando por primera vez: un indicador con el texto «Cargando coches...» y sin paginador.
  - Cambiando de página: los coches anteriores siguen visibles, atenuados y marcados como ocupados, hasta que llega la nueva página. Si se piden varias páginas seguidas, solo cuenta la última respuesta, aunque una anterior tarde más.
  - **Lista vacía** (no hay coches): mensaje «No hay coches disponibles en este momento.», sin botón de reintentar ni paginador. No se trata como un error.
  - **Error al cargar:** mensaje comprensible (por ejemplo, «No se pudo conectar con el servidor...») con un botón «Reintentar», que vuelve a pedir la misma página. No se muestra a la vez el mensaje de lista vacía.
- **Acciones de administrador.** Si el usuario es administrador, el listado muestra un botón «Nuevo coche» que lleva al formulario de creación. Un visitante o un usuario normal no lo ve. (Editar y eliminar llegan en las iteraciones 15 y 16.)

### Requisitos técnicos

- Tienda de Pinia `coches` con la página actual de coches, el total, el número de páginas, el tamaño de página, y los indicadores `cargando` y `error`, y las acciones `cargar` y `reintentar`. Es la capa de servicios (`buscarCoches`) la que habla con Supabase.
- Componente `EstadoCarga` reutilizable que decide qué mostrar (carga, error, vacío o contenido) y componente `CocheCard` para la presentación de cada coche.
- Funciones de formato (`src/utils/formato.js`) para el precio, el kilometraje y las etiquetas, con separador de miles también en las cifras de cuatro dígitos.
- PrimeVue configurado con textos en español (`src/locale.js`).
- El número de coches por página (9) está en la tienda, y el máximo que admite el backend es 50.

### Fuera de alcance

- Búsqueda y filtros (iteración 17), detalle (13), crear, editar y eliminar (14 a 16), y la gestión de fotos (18).
- Mostrar los coches no disponibles.

## PLAN

1. Crear `src/utils/formato.js` y `src/locale.js`, y registrar el idioma en `main.js`.
2. Crear la tienda `src/stores/coches.js`.
3. Crear `EstadoCarga.vue` y `CocheCard.vue`.
4. Reescribir `ListadoView.vue` con la página en la URL, el paginador y los estados.
5. Preparar los datos de prueba en `tests/helpers.js` y adaptar `tests/app.test.js`.
6. Crear `tests/formato.test.js`, `tests/coches.store.test.js`, `tests/coche-card.test.js` y `tests/listado.test.js`.
7. Ejecutar `npm test` y `npm run build`.
8. Comprobar a mano con el Supabase real: varias páginas, recargar, atrás y adelante, desconectar la red para ver el error y reintentar.

Decisiones: el servidor pagina (el listado nunca descarga todos los coches); la página vive en la URL para que funcionen atrás, adelante y recargar; los coches anteriores se mantienen atenuados mientras llega la página nueva, para evitar parpadeos; una página inexistente lleva a la última en lugar de mostrar una lista vacía engañosa; se muestra solo la foto principal y se carga de forma diferida.
Riesgo: al borrar coches desde otra pestaña, la página que se está viendo puede quedar desfasada; se resuelve al cambiar de página o recargar.

## TEST_PLAN

| Caso | Resultado esperado | Resultado obtenido |
|---|---|---|
| Primera página | 9 tarjetas, paginador y «Mostrando 1-9 de 25 coches» |  |
| Contenido de una tarjeta | Marca y modelo, precio, año, km, etiquetas y foto con texto alternativo |  |
| Coche sin foto | Muestra «Sin foto» |  |
| Enlaces de la tarjeta y «Ver detalle» | Llevan a `/coches/:id` |  |
| Formato de precio, kilometraje y etiquetas | `18.500 €`, `45.000 km`, Diésel, Automático... |  |
| Etiquetas del paginador | En español |  |
| Pulsar una página y el botón siguiente | Pide esa página, la pone en la URL y cambia el texto del paginador |  |
| Última página incompleta | Muestra los coches que quedan |  |
| Entrar por `/?pagina=2` | Carga esa página |  |
| `pagina` no válida (`abc`, `0`, `-2`, `1.5`, vacío) | Carga la primera |  |
| `pagina` mayor que la última | Lleva a la última |  |
| Atrás y adelante | Cambian de página |  |
| Volver a la página 1 | La URL no lleva `?pagina=` |  |
| Primera carga | Indicador y «Cargando coches...», sin paginador |  |
| Cambio de página en curso | Los coches anteriores se ven atenuados hasta que llega la nueva página |  |
| Dos páginas pedidas seguidas | Solo cuenta la última respuesta |  |
| Lista vacía | Mensaje de lista vacía, sin error ni paginador |  |
| Error al cargar | Mensaje comprensible y botón «Reintentar», sin el mensaje de lista vacía |  |
| Reintentar | Vuelve a pedir la página y muestra la lista |  |
| Botón «Nuevo coche» | Solo lo ve un administrador y lleva al formulario |  |
| `npm run build` | Sin errores |  |
| Comprobación manual con el Supabase real: varias páginas, recarga, atrás y adelante | Se comporta como se ha descrito |  |
| Comprobación manual: error de red | Al cortar la conexión aparece el error con «Reintentar», y al recuperarla y reintentar se ve la lista |  |

### Tests automáticos

- `tests/listado.test.js` (24 tests): listado, paginación, página en la URL, estados de la carga y acciones según el usuario.
- `tests/coches.store.test.js` (8 tests): tienda de coches con el servicio simulado.
- `tests/coche-card.test.js` (5 tests): tarjeta de un coche.
- `tests/formato.test.js` (4 tests): formato de precio, kilometraje y etiquetas.
- `tests/app.test.js` (14 tests): adaptado al listado real.
- El resto de archivos de tests no cambian de comportamiento.

**Resultado de la ejecución:** (pendiente: se rellena después de ejecutar `npm test`, `npm run build` y las comprobaciones manuales).

## AI_LOG

### Herramienta usada

- Herramienta: Claude Code
- Modelo: Claude Sonnet 5.5 (sesión en la nube)
- Tipo: asistente de código en la nube

### Uso realizado

Se usó la IA para:

- proponer el diseño del listado, de la tienda y de los estados de la carga;
- **redactar la SPEC, el PLAN y el TEST_PLAN** (por petición del estudiante, que los revisa y los hace suyos);
- generar la tienda, los componentes, la pantalla y los tests;
- comprobar el aspecto y los estados (con datos, error, vacío y cambio de página) en un navegador real contra un Supabase simulado.

### Prompt importante 1

«vamos con la iteración 12». Resultado: listado paginado con la página en la URL y los estados de carga, vacío y error.

### Decisiones de diseño propuestas por la IA

Revisadas por el estudiante, que las acepta todas.

- Paginación en el servidor: se pide solo la página que se ve.
- La página actual vive en la URL (`?pagina=`).
- Una página inexistente lleva a la última.
- Se atenúan los coches anteriores mientras llega la página nueva.
- Componente `EstadoCarga` reutilizable para distinguir cargando, error, vacío y contenido.
- 9 coches por página, en una rejilla de tarjetas.

### Se rechazó o descartó

- Cargar todos los coches y paginar en el navegador: descartado, porque el enunciado pide recorrer las páginas del backend.
- Un desplazamiento infinito en lugar de un paginador: descartado por no encajar con la URL con página.

### Correcciones manuales

- Ninguna.

## COMMITS RELACIONADOS

- `1686bc2` - Iteraciones 12 y 13: listado paginado y detalle de un coche
