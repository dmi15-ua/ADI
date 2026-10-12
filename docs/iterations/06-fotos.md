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
| Admin añade foto | Foto creada, orden 0, no principal | OK |
| Orden automático | Las siguientes van al final (1, 2) | OK |
| Orden indicado | Se respeta | OK |
| Nueva foto principal | La anterior deja de serlo; solo una principal | OK |
| Cliente añade foto | Error "No autorizado" | OK |
| Sin sesión añade foto | Error "No autorizado" | OK |
| Cliente intenta cambiar la principal | Error; la principal no cambia | OK |
| Coche inexistente al añadir | Error "Coche no encontrado" | OK |
| Id de coche no válido | Error de validación | OK |
| Datos no válidos (8 casos) | Error de validación | OK |
| Listar fotos | Ordenadas por orden | OK |
| Listar sin sesión | Funciona | OK |
| Listar coche sin fotos | Lista vacía | OK |
| Listar coche inexistente | Error "Coche no encontrado" | OK |
| Fotos en la ficha y en la búsqueda | Galería ordenada y foto_principal correcta | OK |
| Admin elimina foto | Desaparece del listado, las demás se mantienen | OK |
| Cliente o sin sesión elimina | Error; la foto sigue | OK |
| Eliminar foto inexistente / dos veces | Error "no encontrada" | OK |
| Eliminar con id no válido | Error de validación | OK |
| Eliminar la principal y marcar otra | Se puede | OK |

### Tests automáticos

- `tests/fotos.test.js`: cubre todos los casos. Borra al final los coches (y sus fotos), marcas y usuarios que crea.

**Resultado de la ejecución:** `npm test`: `tests/fotos.test.js` pasa. Todas las pruebas de la suite completa pasan tras añadir esta iteración.

## AI_LOG

### Herramienta usada

- Herramienta: Claude Code
- Modelo: Claude Sonnet 5.5 (sesión en la nube)
- Tipo: asistente de código en la nube; yo ejecuto los scripts SQL, los tests y los commits en mi equipo

### Uso realizado

Se usó la IA para:

- redactar SPEC, PLAN y TEST_PLAN;
- generar `fotoService.js` (listar, añadir y eliminar), la validación de fotos y los tests.

### Prompt importante 1

«vamos con la 6». Resultado: servicio de fotos, validación y tests, sin script SQL.

### Decisiones del estudiante

Se aceptó:

- La foto principal anterior se desmarca desde el servicio, no con un trigger, para no cambiar el comportamiento de la iteración 03 (el índice único sigue protegiendo la BD).
- No se marca como principal automáticamente la primera foto.
- URLs solo `http://` o `https://`.
- Las fotos son URLs, sin Supabase Storage.

Se rechazó o descartó:

- Un trigger en la BD para la foto principal: descartado para no reabrir la iteración 03.

### Correcciones manuales

- Ninguna registrada.

## COMMITS RELACIONADOS

- `HASH` - Iteración 06: fotos de los coches (listar, añadir y eliminar)
