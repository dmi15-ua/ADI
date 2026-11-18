# Iteración 13 - Detalle de un coche

## SPEC

### Objetivo

Mostrar a cualquier visitante la ficha completa de un coche, con más información que el listado (descripción, equipamiento, ficha técnica y todas sus fotos), y distinguiendo los estados de carga, coche inexistente y error.

### Requisitos funcionales

- **Ficha.** La pantalla `/coches/:id` muestra el coche con ese id. No hace falta haber iniciado sesión. Presenta:
  - marca y modelo, precio en euros y etiquetas de combustible, transmisión y disponibilidad («Disponible» o «No disponible»);
  - la ficha técnica: año, kilometraje, potencia (en CV), combustible y transmisión;
  - la descripción, o «Sin descripción.» si no tiene;
  - el equipamiento, o «No se ha indicado el equipamiento.» si está vacío.
- **Galería de fotos.** Muestra una foto grande y una miniatura de cada foto, ordenadas como las devuelve el backend. Al empezar se ve la foto principal (o la primera si ninguna lo es). Al pulsar una miniatura cambia la foto grande, y la miniatura activa se distingue. Si solo hay una foto no hay miniaturas, y si no hay ninguna se avisa de que el coche no tiene fotos. Las fotos tienen texto alternativo con la marca y el modelo.
- **Título de la pestaña.** Incluye el coche que se está viendo.
- **Volver al listado.** Un botón «Volver al listado» lleva de vuelta al listado. Si se llegó desde el listado, se vuelve a la misma página en la que se estaba (por ejemplo, `/?pagina=2`). Si se entró directamente por la URL, lleva a la primera página del listado.
- **Estados de la carga.**
  - Cargando: un indicador con el texto «Cargando coche...». Al pasar de un coche a otro no se ve el anterior mientras carga el nuevo.
  - **Coche que no existe:** mensaje «Coche no encontrado» con un enlace para ver todos los coches. No se trata como un error y no ofrece reintentar.
  - **Error al cargar:** mensaje comprensible (por ejemplo, el de falta de conexión) con un botón «Reintentar», que vuelve a pedir el mismo coche.
  - Si se piden dos coches seguidos, solo cuenta la respuesta del último, aunque la primera tarde más.
- **Ids no válidos.** Un id que no sea un número entero positivo (`/coches/abc`) lleva a la página «no encontrada» de la aplicación, por la propia ruta.
- Un coche no disponible se puede ver por su dirección, indicando que no está disponible.

### Requisitos técnicos

- La tienda `coches` incorpora el detalle: `detalle`, `cargandoDetalle`, `errorDetalle` y `detalleNoEncontrado`, y las acciones `cargarDetalle` y `reintentarDetalle`. Está en la tienda y no en el componente para que la edición (iteración 15) y el borrado (16) trabajen sobre los mismos datos y mantengan coherentes el detalle y el listado.
- La ruta pasa el id como propiedad (`props: true`) a `DetalleView`.
- Componentes: `DetalleView` (la pantalla) y `GaleriaFotos` (presentación de las fotos). Se reutiliza `EstadoCarga`.
- «Volver al listado» usa la página anterior que guarda el historial del navegador (`history.state.back`) y solo vuelve atrás si era el listado.
- El servicio `obtenerCoche` de la práctica 1 devuelve el coche con su marca y sus fotos en una sola consulta.

### Fuera de alcance

- Editar y eliminar el coche (iteraciones 15 y 16) y gestionar las fotos (18).
- Solicitar citas y guardar favoritos desde la ficha.

## PLAN

1. Añadir el detalle a la tienda `src/stores/coches.js`.
2. Crear `src/components/GaleriaFotos.vue`.
3. Reescribir `src/views/DetalleView.vue`.
4. Preparar un coche de detalle de prueba en `tests/helpers.js`, y adaptar los tests de la aplicación, del listado y de la tienda.
5. Crear `tests/galeria.test.js` y `tests/detalle.test.js`, y ampliar `tests/coches.store.test.js`.
6. Ejecutar `npm test` y `npm run build`.
7. Comprobar a mano con el Supabase real: la ficha de un coche con y sin fotos, un id que no existe, volver al listado desde una página distinta de la primera y un error de red.

Decisiones: el detalle vive en la tienda para compartirlo con la edición y el borrado; se distingue «no existe» de «ha fallado» a partir del mensaje del servicio; se vacía el detalle anterior al cargar otro, para no mostrar datos del coche equivocado; «Volver al listado» usa la página anterior del historial, para no perder la página del listado.
Riesgo: la distinción de «coche no encontrado» depende del texto del mensaje del servicio de la práctica 1; si cambiase, dejaría de distinguirse. Los tests lo cubren.

## TEST_PLAN

| Caso | Resultado esperado | Resultado obtenido |
|---|---|---|
| Datos de la ficha: marca, modelo, precio, año, kilometraje, potencia, combustible y transmisión | Se muestran con su formato |  |
| Descripción y equipamiento | Se muestran; si faltan, un texto que lo indica |  |
| Disponibilidad | «Disponible» o «No disponible» |  |
| Galería: foto principal y miniaturas | Empieza en la principal y se puede cambiar de foto; la activa se distingue |  |
| Una sola foto / sin fotos | Sin miniaturas / aviso de que no tiene fotos |  |
| Un visitante sin sesión | Puede ver la ficha |  |
| Título de la pestaña | Incluye marca y modelo |  |
| Primera carga | Indicador y «Cargando coche...» |  |
| Coche que no existe | «Coche no encontrado» con enlace al listado, sin «Reintentar» |  |
| Error al cargar | Mensaje comprensible y botón «Reintentar» |  |
| Reintentar | Vuelve a pedir el coche y lo muestra |  |
| Pasar de un coche a otro por la URL | Carga el nuevo y no muestra el anterior |  |
| Dos coches pedidos seguidos | Solo cuenta el último |  |
| Volver al listado desde la página 2 | Vuelve a `/?pagina=2` mostrando esa página |  |
| Volver al listado con entrada directa | Lleva al listado |  |
| Id no numérico (`/coches/abc`) | Página «no encontrada» |  |
| `npm run build` | Sin errores |  |
| Comprobación manual con el Supabase real: ficha con fotos y sin fotos | Se ve como se ha descrito |  |
| Comprobación manual: id que no existe y error de red | «Coche no encontrado» y, sin red, error con «Reintentar» |  |
| Comprobación manual: volver al listado desde otra página | Se mantiene la página |  |

### Tests automáticos

- `tests/detalle.test.js` (14 tests): ficha, estados de la carga y volver al listado (este último con el historial real del navegador).
- `tests/galeria.test.js` (7 tests): galería de fotos.
- `tests/coches.store.test.js` (15 tests): tienda de coches, con el listado y el detalle.
- `tests/app.test.js` (14 tests): adaptado al detalle real.
- El resto de archivos de tests no cambian de comportamiento.

**Resultado de la ejecución:** (pendiente: se rellena después de ejecutar `npm test`, `npm run build` y las comprobaciones manuales).

## AI_LOG

### Herramienta usada

- Herramienta: Claude Code
- Modelo: Claude Sonnet 5.5 (sesión en la nube)
- Tipo: asistente de código en la nube

### Uso realizado

Se usó la IA para:

- proponer el diseño de la ficha, la galería y los estados;
- **redactar la SPEC, el PLAN y el TEST_PLAN** (por petición del estudiante, que los revisa y los hace suyos);
- generar la tienda ampliada, la galería, la pantalla y los tests;
- comprobar el aspecto y los estados (ficha, coche inexistente, error, sin fotos y volver al listado) en un navegador real contra un Supabase simulado.

### Prompt importante 1

«vamos con la 13». Resultado: detalle de un coche con galería de fotos y los estados de carga, no encontrado y error.

### Decisiones de diseño propuestas por la IA

[REVISAR: confirma que las aceptas o anota las que cambiaste]

- El detalle vive en la tienda de coches, compartida con la edición y el borrado.
- «Coche no encontrado» se distingue de un error al cargar.
- Se vacía el detalle anterior al cargar otro coche.
- «Volver al listado» conserva la página del listado usando el historial.
- Galería propia, simple, con miniaturas.

### Se rechazó o descartó

- Un diálogo o panel en el propio listado en lugar de una pantalla: descartado, porque una dirección propia permite compartir y recargar la ficha.
- La librería `Galleria` de PrimeVue: descartada por ser más compleja de lo que se necesita.

### Correcciones manuales

- [COMPLETAR: cambios que hayas hecho tú, o «Ninguna»]

## COMMITS RELACIONADOS

- `HASH_13` - (se rellena al hacer el commit)
