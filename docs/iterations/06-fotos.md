# Iteración 06 - Fotos de los coches

## SPEC

### Objetivo

Gestionar la galería de fotos de cada coche: cualquiera puede verla y un administrador puede añadir y eliminar fotos. Es el primer recurso secundario completo (listar, crear y borrar).

### Requisitos funcionales

- `listarFotos(cocheId)` (público): devuelve las fotos del coche ordenadas por `orden`. Un coche sin fotos devuelve una lista vacía; un coche inexistente falla con "Coche no encontrado".
- `anadirFoto(cocheId, { url, orden?, es_principal? })` (solo admin):
  - si no se indica `orden`, la foto se coloca al final;
  - si `es_principal` es verdadero, la anterior foto principal del coche deja de serlo (un coche tiene como mucho una principal);
  - devuelve la foto creada; si el coche no existe falla con "Coche no encontrado".
- `eliminarFoto(fotoId)` (solo admin): borra la foto; si no existe o no hay permisos, falla con "Foto no encontrada o sin permisos".
- Un cliente normal o un usuario sin sesión no puede añadir ni eliminar fotos (y no puede cambiar la foto principal).
- Las fotos se reflejan en `obtenerCoche` (galería completa) y en `buscarCoches` (`foto_principal`).

### Validaciones

- `url`: obligatoria, empieza por `http://` o `https://`, sin espacios, máximo 2000 caracteres.
- `orden`: entero no negativo. `es_principal`: booleano.
- Ids enteros positivos. Campos desconocidos (por ejemplo `coche_id`) rechazados.

### Requisitos técnicos

- Sin cambios en la BD: la tabla `foto_coche`, el índice de una sola principal y las políticas RLS ya existen desde la iteración 03.
- Las fotos se guardan como URL; la subida de ficheros a Supabase Storage queda fuera del alcance.

### Fuera de alcance

- Subir ficheros de imagen, reordenar fotos existentes, marcar como principal una foto ya creada, límite de fotos por coche.

## PLAN

1. Crear `src/validation/foto.js`.
2. Crear `src/services/fotoService.js` con `listarFotos`, `anadirFoto` y `eliminarFoto`.
3. Crear `tests/fotos.test.js` (cada test crea su propio coche).
4. Ejecutar `npm test`, rellenar resultados y hacer commit.

Decisiones: la foto principal anterior se desmarca desde el servicio y no con un trigger, para no cambiar el comportamiento de la iteración 03 (el índice único sigue protegiendo la BD); no se marca automáticamente como principal la primera foto, porque `buscarCoches` ya usa la primera si no hay ninguna marcada.
Riesgo: desmarcar la principal y crear la nueva son dos operaciones, no una transacción. Como la URL se valida antes, es poco probable que falle la segunda.

## TEST_PLAN

| Caso | Resultado esperado | Resultado obtenido |
|---|---|---|
| Admin añade foto | Foto creada, orden 0, no principal | |
| Orden automático | Las siguientes van al final (1, 2) | |
| Orden indicado | Se respeta | |
| Nueva foto principal | La anterior deja de serlo; solo una principal | |
| Cliente añade foto | Error "No autorizado" | |
| Sin sesión añade foto | Error "No autorizado" | |
| Cliente intenta cambiar la principal | Error; la principal no cambia | |
| Coche inexistente al añadir | Error "Coche no encontrado" | |
| Id de coche no válido | Error de validación | |
| Datos no válidos (8 casos) | Error de validación | |
| Listar fotos | Ordenadas por orden | |
| Listar sin sesión | Funciona | |
| Listar coche sin fotos | Lista vacía | |
| Listar coche inexistente | Error "Coche no encontrado" | |
| Fotos en la ficha y en la búsqueda | Galería ordenada y foto_principal correcta | |
| Admin elimina foto | Desaparece del listado, las demás se mantienen | |
| Cliente o sin sesión elimina | Error; la foto sigue | |
| Eliminar foto inexistente / dos veces | Error "no encontrada" | |
| Eliminar con id no válido | Error de validación | |
| Eliminar la principal y marcar otra | Se puede | |

### Tests automáticos

- `tests/fotos.test.js`: cubre todos los casos. Borra al final los coches (y sus fotos), marcas y usuarios que crea.

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
