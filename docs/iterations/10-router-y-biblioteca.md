# Iteración 10 - Router y biblioteca de componentes

## SPEC

### Objetivo

Dotar al frontend de la estructura de navegación (rutas con Vue Router) y de la biblioteca de componentes (PrimeVue), con una pantalla base común, avisos y diálogos de confirmación reutilizables. Es la base sobre la que se construyen las pantallas de las iteraciones siguientes. Cubre dos de los apartados adicionales del enunciado: la navegación mediante un router y la mejora de la interfaz con una biblioteca de componentes.

### Requisitos funcionales

- **Rutas.** La aplicación tiene estas direcciones:
  - `/`: listado de coches;
  - `/login`: inicio de sesión;
  - `/coches/nuevo`: formulario de creación;
  - `/coches/:id`: detalle de un coche (el id es numérico);
  - `/coches/:id/editar`: formulario de edición;
  - cualquier otra dirección: página «no encontrada», con un enlace para volver al listado.
- `/coches/nuevo` no se confunde con un id, y `/coches/abc` o `/coches/-1` llevan a la página no encontrada.
- Las rutas de crear y editar están marcadas como solo para administradores (`requiereAdmin`). En esta iteración solo se marcan: la comprobación en la interfaz llega con la sesión (iteración 11), y la autorización real se sigue aplicando siempre en el backend.
- **Acceso por URL y navegación.** Se puede entrar directamente a cualquier ruta escribiendo su dirección, y los botones atrás y adelante del navegador recorren el historial de forma coherente.
- **Título de la pestaña.** Cambia con cada pantalla («Concesionario · Coches», «Concesionario · Nuevo coche», etc.).
- **Estructura común.** Todas las pantallas comparten una cabecera con la marca «Concesionario» (que lleva al listado), un menú con la opción «Coches» y un botón «Iniciar sesión» provisional que lleva a `/login`. El contenido de cada ruta aparece debajo.
- **Avisos.** Existe un servicio para mostrar mensajes breves de éxito, error y aviso, con una duración adecuada a cada tipo.
- **Confirmación.** Existe un servicio que muestra un diálogo de confirmación y devuelve `true` si el usuario acepta y `false` si cancela o cierra el diálogo. Se usará antes de eliminar un coche.
- Las pantallas de las rutas son todavía provisionales («Pantalla en construcción»).

### Requisitos técnicos

- Vue Router con historial del navegador. El router se crea con una función que recibe el historial, para poder usar uno en memoria en los tests.
- PrimeVue 4 (licencia MIT), con el tema Aura y sus iconos, registrado globalmente junto con los servicios de avisos y de confirmación. Los componentes se importan donde se usan.
- Los componentes de la aplicación no usan directamente la API de PrimeVue para avisos y confirmaciones: usan los composables `useNotificaciones` y `useConfirmacion`.
- Los tests simulan `matchMedia`, que jsdom no implementa y PrimeVue usa en el menú.

### Fuera de alcance

- Sesión, protección real de rutas y zona de usuario en la cabecera (iteración 11).
- Contenido de las pantallas: listado, detalle y formularios (iteraciones 12 a 15).

## PLAN

1. Crear `src/router/rutas.js` (rutas y metadatos) y `src/router/index.js` (`crearRouter`, con el título de la pestaña).
2. Crear las vistas provisionales: `ListadoView`, `LoginView`, `DetalleView`, `FormularioCocheView` y `NoEncontradoView`.
3. Crear los composables `useNotificaciones` y `useConfirmacion`.
4. Reescribir `App.vue` con la cabecera (Menubar), el botón de sesión, `RouterView`, `Toast` y `ConfirmDialog`.
5. Registrar el router y PrimeVue (tema, Toast y confirmación) en `main.js`, y añadir `style.css` y un favicon.
6. Preparar los tests: simulación de `matchMedia` y una utilidad para montar la aplicación con router en memoria.
7. Crear `tests/router.test.js`, `tests/app.test.js` y `tests/avisos.test.js`; adaptar `tests/setup.test.js`.
8. Ejecutar `npm test` y `npm run build`, y comprobar a mano la navegación con `npm run dev`.

Decisiones: `:id(\d+)` en las rutas para que solo coincidan ids numéricos y no haya conflicto con `/coches/nuevo`; PrimeVue 4 en lugar de la 5 por su licencia MIT; los composables aíslan a los componentes de la API de la biblioteca; el botón de sesión es provisional y se sustituirá en la iteración 11.
Riesgo: las versiones muy recientes de Vue Router y Pinia podrían cambiar alguna API; se comprueba con los tests y el build.

## TEST_PLAN

| Caso | Resultado esperado | Resultado obtenido |
|---|---|---|
| Ruta `/` | Muestra el listado |  |
| Ruta `/login` | Muestra el login |  |
| Ruta `/coches/nuevo` | Formulario de creación (no se confunde con un id) |  |
| Ruta `/coches/5` | Detalle, con el id `5` como parámetro |  |
| Ruta `/coches/12/editar` | Formulario de edición, con el id `12` |  |
| Rutas `/coches/abc`, `/coches/5/borrar`, `/coches/-1`, `/no-existe` | Página no encontrada |  |
| Metadatos de administrador | Solo `coche-nuevo` y `coche-editar` los tienen |  |
| Entrar directamente por una URL | Muestra la pantalla de esa ruta |  |
| Atrás y adelante | Recorren el historial en orden |  |
| Título de la pestaña | Cambia con cada pantalla |  |
| Marca y menú | Se ven en todas las pantallas |  |
| Pulsar «Coches» o la marca | Cambia de pantalla sin recargar |  |
| Dirección inexistente | Mensaje y enlace para volver al listado |  |
| Botón «Iniciar sesión» | Lleva a `/login` |  |
| Aviso de éxito y de error | Se muestran con su texto |  |
| Confirmación: aceptar | La promesa devuelve `true` |  |
| Confirmación: cancelar | La promesa devuelve `false` |  |
| `npm run build` | Sin errores |  |
| Comprobación manual con `npm run dev` | La navegación funciona y no hay errores en la consola |  |

### Tests automáticos

- `tests/router.test.js` (13 tests): rutas, metadatos, acceso por URL, historial y título.
- `tests/app.test.js` (7 tests): cabecera, menú, cambio de pantalla, página no encontrada y botón de sesión.
- `tests/avisos.test.js` (4 tests): avisos y diálogo de confirmación.
- `tests/setup.test.js` (8 tests): adaptado a los nuevos plugins.

**Resultado de la ejecución:** (pendiente: se rellena después de ejecutar `npm test`, `npm run build` y la comprobación manual).

## AI_LOG

### Herramienta usada

- Herramienta: Claude Code
- Modelo: Claude Sonnet 5.5 (sesión en la nube)
- Tipo: asistente de código en la nube

### Uso realizado

Se usó la IA para:

- proponer las rutas, la estructura de la pantalla y la elección de la biblioteca de componentes;
- **redactar la SPEC, el PLAN y el TEST_PLAN** (por petición del estudiante, que los revisa y los hace suyos);
- generar el router, las vistas provisionales, los composables, la estructura de la aplicación y los tests;
- comprobar la apariencia con una captura en el navegador.

### Prompt importante 1

«vamos con la iteración 10». Resultado: router con las rutas de la aplicación, PrimeVue, avisos y confirmación reutilizables, y sus tests.

### Decisiones de diseño propuestas por la IA

Revisadas por el estudiante, que las acepta todas.

- PrimeVue 4 (MIT) con el tema Aura, en lugar de la versión 5.
- Rutas con id numérico (`:id(\\d+)`) y una ruta final que captura todo lo demás.
- Composables que envuelven los avisos y la confirmación.
- Botón de sesión provisional en la cabecera.

### Se rechazó o descartó

- Vuetify y otras bibliotecas: descartadas por ser más pesadas para lo que necesita la aplicación.

### Correcciones manuales

- Ninguna.

## COMMITS RELACIONADOS

- `86b1ad1` - Iteración 10: router y biblioteca de componentes
