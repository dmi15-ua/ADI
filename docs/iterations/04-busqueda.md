# Iteración 04 - Búsqueda de coches con filtros y paginación

## SPEC

### Objetivo

Permitir a cualquier visitante buscar coches en el catálogo filtrando por sus características y recorriendo los resultados por páginas.

### Requisitos funcionales

- `buscarCoches(filtros)` es público (no requiere sesión).
- Filtros opcionales, combinables entre sí:
  - `marca_id`;
  - `combustible` (gasolina | diesel | electrico);
  - `transmision` (manual | automatico);
  - `precio_min` y `precio_max` (ambos incluidos);
  - `texto`: busca en el modelo, sin distinguir mayúsculas; `%` y `_` se tratan como texto literal;
  - `disponible` (por defecto `true`: el catálogo muestra solo coches en stock).
- Orden (`orden`): `recientes` (por defecto), `precio_asc`, `precio_desc`, `km_asc`.
- Paginación: `pagina` (por defecto 1) y `porPagina` (por defecto 10, máximo 50).
- La respuesta es `{ datos, pagina, porPagina, total, totalPaginas }`.
- Cada coche de `datos` incluye su marca (`id`, `nombre`) y `foto_principal` (URL de la foto principal, o la primera, o `null` si no tiene).
- Una página fuera de rango devuelve `datos` vacío, manteniendo `total`.
- Sin resultados: `datos` vacío, `total` 0 y `totalPaginas` 0.

### Validaciones

- `pagina` entero >= 1; `porPagina` entero entre 1 y 50.
- `precio_min` y `precio_max` no negativos y `precio_min <= precio_max`.
- `combustible`, `transmision` y `orden` solo con valores permitidos.
- `texto` no vacío (máx. 100). `marca_id` entero positivo.
- Filtros desconocidos rechazados.

### Requisitos técnicos

- Una sola consulta a la BD con `count: 'exact'` y `range`.
- Orden estable: el `id` es el segundo criterio de ordenación, para que las páginas no se solapen en caso de empates.
- Índices sobre precio, combustible, transmisión y disponible (`sql/004_indices_busqueda.sql`).

### Fuera de alcance

- Filtros por año, kilometraje o potencia; búsqueda por texto en la descripción; filtros de marca por nombre.

## PLAN

1. Escribir y ejecutar `sql/004_indices_busqueda.sql` en el SQL Editor.
2. Crear `src/validation/busqueda.js`.
3. Añadir `buscarCoches` a `src/services/cocheService.js`.
4. Crear `tests/busqueda.test.js` con datos controlados (dos marcas propias; todas las búsquedas filtran por ellas para no depender del resto de la BD).
5. Ejecutar `npm test`, rellenar resultados y hacer commit.

Decisiones: se devuelve un objeto con metadatos de paginación, no solo la lista; solo se listan coches disponibles por defecto; el texto se escapa para evitar comodines.
Riesgo: el escape de `%` y `_` en `ilike` a través de la API; lo comprueba un test.

## TEST_PLAN

| Caso | Resultado esperado | Resultado obtenido |
|---|---|---|
| Filtrar por marca | Solo coches disponibles de esa marca | OK |
| Buscar no disponibles | Solo el coche no disponible | OK |
| Filtrar por combustible | Solo los de ese combustible | OK |
| Filtrar por tipo de cambio | Solo los de ese cambio | OK |
| Rango de precio (mín. y máx. incluidos) | Solo los del rango | OK |
| Solo precio mínimo / solo máximo | Filtra por ese extremo | OK |
| Varios filtros combinados | Intersección de los filtros | OK |
| Texto sin distinguir mayúsculas | Encuentra el modelo | OK |
| Texto `%` o `_` | Sin resultados (literal) | OK |
| Sin resultados | Lista vacía, total 0, 0 páginas | OK |
| Marca y foto principal en cada resultado | Presentes; coche sin fotos: null | OK |
| Búsqueda sin sesión | Funciona | OK |
| Orden por precio asc/desc y km | Orden correcto | OK |
| Valores por defecto de paginación | Página 1, 10 por página | OK |
| Total y número de páginas | Correctos | OK |
| Páginas consecutivas | No se solapan y cubren todo | OK |
| Página fuera de rango | Lista vacía, total intacto | OK |
| Última página incompleta | Menos elementos que porPagina | OK |
| Parámetros no válidos (12 casos) | Error de validación | OK |

### Tests automáticos

- `tests/busqueda.test.js`: cubre todos los casos anteriores. Borra al final los coches, marcas y usuarios que crea.

**Resultado de la ejecución:** `npm test`: `tests/busqueda.test.js` con 34 tests pasados a la primera. Suite completa en ese momento: 4 archivos, 81 tests pasados.

## AI_LOG

### Herramienta usada

- Herramienta: Claude Code
- Modelo: Claude Sonnet 5.5 (sesión en la nube)
- Tipo: asistente de código en la nube; yo ejecuto los scripts SQL, los tests y los commits en mi equipo

### Uso realizado

Se usó la IA para:

- redactar SPEC, PLAN y TEST_PLAN;
- generar `sql/004_indices_busqueda.sql`, la validación de filtros, `buscarCoches` y los tests con datos controlados.

### Prompt importante 1

«vamos con la 4». Resultado: búsqueda con filtros, orden y paginación, y sus tests.

### Decisiones del estudiante

Se aceptó:

- Por defecto solo coches disponibles.
- `texto` busca solo en el modelo, escapando `%` y `_`.
- `porPagina` máximo 50.
- Orden estable con el `id` como segundo criterio.
- Respuesta `{ datos, pagina, porPagina, total, totalPaginas }`.

Se rechazó o descartó:

- Ninguno registrado.

### Correcciones manuales

- Ninguna: los 34 tests pasaron sin cambios. Ejecuté `004_indices_busqueda.sql` en el SQL Editor.

## COMMITS RELACIONADOS

- `HASH` - Iteración 04: búsqueda de coches con filtros y paginación
