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
| Filtrar por marca | Solo coches disponibles de esa marca | |
| Buscar no disponibles | Solo el coche no disponible | |
| Filtrar por combustible | Solo los de ese combustible | |
| Filtrar por tipo de cambio | Solo los de ese cambio | |
| Rango de precio (mín. y máx. incluidos) | Solo los del rango | |
| Solo precio mínimo / solo máximo | Filtra por ese extremo | |
| Varios filtros combinados | Intersección de los filtros | |
| Texto sin distinguir mayúsculas | Encuentra el modelo | |
| Texto `%` o `_` | Sin resultados (literal) | |
| Sin resultados | Lista vacía, total 0, 0 páginas | |
| Marca y foto principal en cada resultado | Presentes; coche sin fotos: null | |
| Búsqueda sin sesión | Funciona | |
| Orden por precio asc/desc y km | Orden correcto | |
| Valores por defecto de paginación | Página 1, 10 por página | |
| Total y número de páginas | Correctos | |
| Páginas consecutivas | No se solapan y cubren todo | |
| Página fuera de rango | Lista vacía, total intacto | |
| Última página incompleta | Menos elementos que porPagina | |
| Parámetros no válidos (12 casos) | Error de validación | |

### Tests automáticos

- `tests/busqueda.test.js`: cubre todos los casos anteriores. Borra al final los coches, marcas y usuarios que crea.

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
