# Iteración 05 - Editar y eliminar coches

## SPEC

### Objetivo

Permitir a un administrador modificar y eliminar coches del catálogo, impidiendo que lo haga cualquier otra persona.

### Requisitos funcionales

- `actualizarCoche(id, cambios)` (solo admin): modifica cualquier subconjunto de los campos del coche (`marca_id`, `modelo`, `precio`, `km`, `anio`, `combustible`, `transmision`, `potencia_cv`, `descripcion`, `equipamiento`, `disponible`). Los campos no indicados no cambian. Devuelve el coche actualizado.
- `eliminarCoche(id)` (solo admin): borra el coche y, en cascada, sus fotos. Devuelve el coche eliminado.
- Un cliente normal o un usuario sin sesión no puede editar ni eliminar, y el coche queda intacto.
- Editar o eliminar un coche inexistente falla con el mensaje "Coche no encontrado o sin permisos". Eliminar dos veces el mismo coche falla la segunda.
- Marcar un coche como vendido se hace con `disponible: false`.

### Validaciones

- `id` entero positivo.
- Los campos editables siguen las mismas reglas que al crear (precio > 0, km >= 0, año válido, combustible y transmisión permitidos, potencia > 0, modelo no vacío, la marca debe existir).
- Debe indicarse al menos un campo; campos desconocidos o no editables (`id`, `created_at`) se rechazan.

### Requisitos técnicos

- Sin cambios en la BD: las políticas RLS de `update` y `delete` de la iteración 03 ya restringen a admin. Con RLS, un usuario sin permiso no recibe un error de Postgres, sino 0 filas afectadas; el servicio lo traduce a un error.
- El esquema de edición se obtiene del de creación (`cocheSchema.partial()`), para no duplicar reglas.

### Fuera de alcance

- Editar marcas; gestión de fotos (iteración 06); qué ocurre con las citas de un coche eliminado (iteración 07).

## PLAN

1. Añadir `actualizarCocheSchema` a `src/validation/coche.js`.
2. Añadir `actualizarCoche` y `eliminarCoche` a `src/services/cocheService.js`.
3. Crear `tests/coches-edicion.test.js` (cada test crea su propio coche).
4. Ejecutar `npm test`, rellenar resultados y hacer commit.

Decisiones: no hay script SQL en esta iteración; el mensaje de "sin permisos" es el mismo que "no encontrado" para no revelar si un id existe a quien no es admin.

## TEST_PLAN

| Caso | Resultado esperado | Resultado obtenido |
|---|---|---|
| Admin cambia precio y disponibilidad | Cambian; el resto se mantiene | |
| Admin cambia descripción y equipamiento | Cambian | |
| Admin cambia la marca | Cambia | |
| Cliente edita | Error; el coche no cambia | |
| Sin sesión edita | Error | |
| Editar coche inexistente | Error "no encontrado" | |
| Editar con id no válido | Error de validación | |
| Datos no válidos (9 casos) | Error de validación | |
| Marca inexistente al editar | Error "no existe" | |
| Admin elimina coche con fotos | Coche y fotos desaparecen | |
| Cliente elimina | Error; el coche sigue | |
| Sin sesión elimina | Error; el coche sigue | |
| Eliminar coche inexistente | Error "no encontrado" | |
| Eliminar dos veces | La segunda falla | |
| Eliminar con id no válido | Error de validación | |

### Tests automáticos

- `tests/coches-edicion.test.js`: cubre todos los casos. Borra al final los coches, marcas y usuarios que crea.

## AI_LOG

### Herramienta usada

- Herramienta:
- Modelo:

### Uso realizado

### Prompts importantes

### Decisiones del estudiante

### Correcciones manuales

## COMMITS RELACIONADOS

- (pendiente)
