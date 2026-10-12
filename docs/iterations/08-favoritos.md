# Iteración 08 - Favoritos

## SPEC

### Objetivo

Permitir a un usuario registrado guardar coches en su lista de favoritos, consultarla y quitar coches de ella.

### Requisitos funcionales

- `anadirFavorito(cocheId)` (requiere sesión): guarda el coche en los favoritos del usuario autenticado y devuelve el favorito (`usuario_id`, `coche_id`, `fecha_guardado`).
  - falla si el coche no existe ("Coche no encontrado");
  - falla si ya estaba guardado ("El coche ya está en tus favoritos");
  - se puede guardar un coche que no esté disponible;
  - dos usuarios distintos pueden guardar el mismo coche.
- `listarFavoritos()` (requiere sesión): devuelve solo los favoritos del usuario, del más reciente al más antiguo. Cada elemento es `{ fecha_guardado, coche }`, donde `coche` incluye su marca (`id`, `nombre`) y `foto_principal`. Sin favoritos, lista vacía.
- `quitarFavorito(cocheId)` (requiere sesión): quita el coche de los favoritos del usuario; falla con "El coche no está en tus favoritos" si no estaba. Después de quitarlo se puede volver a guardar.
- Sin sesión, los tres servicios fallan con "Debes iniciar sesión".
- Un usuario no puede ver, crear ni borrar favoritos de otro.

### Validaciones

- `cocheId` entero positivo.

### Requisitos técnicos

- Tabla `favorito` con clave primaria compuesta `(usuario_id, coche_id)`, que impide duplicados en la propia BD.
- RLS: `select`, `insert` y `delete` solo sobre filas propias; no hay `update` (un favorito no se edita).
- Si se elimina un coche o un usuario, se eliminan sus favoritos (`on delete cascade`).
- La función que resume un coche con su foto principal se mueve a `src/lib/resumirCoche.js` para compartirla entre `buscarCoches` y `listarFavoritos` (sin cambiar el comportamiento de `buscarCoches`).

### Fuera de alcance

- Paginar el listado de favoritos, ordenar o filtrar los favoritos, indicar en el catálogo qué coches son favoritos del usuario, notificar cuando un favorito cambie de precio.

## PLAN

1. Escribir y ejecutar `sql/008_favoritos.sql` en el SQL Editor.
2. Extraer `resumirCoche` a `src/lib/resumirCoche.js` y usarlo desde `src/services/cocheService.js`.
3. Crear `src/services/favoritoService.js`.
4. Crear `tests/favoritos.test.js` (cada test crea sus propios coches).
5. Ejecutar `npm test` completo (la refactorización de `cocheService` debe mantener en verde los tests de búsqueda), rellenar resultados y hacer commit.
6. Actualizar `docs/ARCHITECTURE.md` con la tabla `favorito`.

Decisiones: la clave primaria compuesta evita duplicados sin una restricción aparte; el duplicado se traduce a un mensaje claro a partir del código Postgres `23505`; la lista se devuelve completa, sin paginar.

## TEST_PLAN

| Caso | Resultado esperado | Resultado obtenido |
|---|---|---|
| Añadir favorito | Se devuelve con usuario, coche y fecha | |
| Coche no disponible | Se puede guardar | |
| Añadir dos veces | Error "ya está en tus favoritos" | |
| Dos usuarios, mismo coche | Ambos pueden | |
| Sin sesión | Error "Debes iniciar sesión" | |
| Coche inexistente / id no válido | Errores específicos | |
| Listar favoritos | Del más reciente al más antiguo, con marca y foto principal | |
| Favoritos de otro usuario | No aparecen | |
| Sin favoritos | Lista vacía | |
| Listar sin sesión | Error | |
| Quitar favorito | Desaparece de la lista | |
| Volver a guardarlo | Se puede | |
| Quitar el favorito de otro | Error; el favorito sigue | |
| Quitar dos veces / nunca fue favorito / id no válido / sin sesión | Errores específicos | |
| BD: guardar a nombre de otro, leer o borrar los de otro, acceso sin sesión | No se permite | |
| Eliminar un coche o un usuario | Se eliminan sus favoritos | |
| Tests de búsqueda tras la refactorización | Siguen en verde | |

### Tests automáticos

- `tests/favoritos.test.js`: cubre los casos anteriores. Borra al final los coches (y sus favoritos), marcas y usuarios que crea.
- `tests/busqueda.test.js`: sin cambios, comprueba que `buscarCoches` sigue funcionando tras mover `resumirCoche`.

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
