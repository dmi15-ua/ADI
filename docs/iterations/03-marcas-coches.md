# Iteración 03 - Marcas y coches: crear y obtener

## SPEC

### Objetivo

Disponer del recurso principal (coche) y sus datos de apoyo (marca, fotos): un administrador puede crear marcas y coches, y cualquier persona puede consultar la ficha de un coche con su marca y sus fotos.

### Requisitos funcionales

- `crearMarca({ nombre, pais? })` (solo admin) y `listarMarcas()` (público).
- `crearCoche(datos)` (solo admin). Campos: `marca_id`, `modelo`, `precio`, `km`, `anio`, `combustible` (gasolina | diesel | electrico), `transmision` (manual | automatico), `potencia_cv`, y opcionales `descripcion`, `equipamiento` (lista de textos) y `disponible` (por defecto true).
- `obtenerCoche(id)` (público) devuelve el coche con su marca y sus fotos ordenadas por `orden`.
- Un cliente normal o un usuario sin sesión no puede crear marcas ni coches (error "No autorizado").
- El catálogo (marcas, coches y fotos) es de lectura pública.

### Validaciones

- precio: número mayor que 0 (máximo 10.000.000). km: entero no negativo.
- año: entero entre 1950 y el año actual + 1.
- potencia_cv: entero mayor que 0. modelo: 1 a 100 caracteres.
- combustible y transmisión: solo los valores permitidos.
- Campos desconocidos rechazados. La marca debe existir. El nombre de marca es único (2 a 50 caracteres).
- id de consulta: entero positivo. Coche inexistente: error "Coche no encontrado".
- La BD repite las reglas básicas con CHECK, de modo que no se puedan saltar desde otro cliente.

### Requisitos técnicos

- Tablas `marca`, `coche` y `foto_coche`, enums de combustible y transmisión, función `es_admin()` y RLS.
- Como mucho una foto principal por coche.
- Mensajes de error claros a partir de los códigos de Postgres (`src/lib/errores.js`).

### Fuera de alcance

- Búsqueda y paginación (iteración 04), editar y borrar coches (05), gestión de fotos por servicio (06), editar o borrar marcas.

## PLAN

1. Escribir y ejecutar `sql/003_coches.sql` en el SQL Editor.
2. Crear `src/lib/errores.js`.
3. Crear `src/validation/coche.js`.
4. Crear `src/services/marcaService.js` y `src/services/cocheService.js`.
5. Ampliar `tests/helpers/usuarios.js` con `crearAdminAutenticado` (el rol admin se asigna con la service role).
6. Crear `tests/coches.test.js`.
7. Ejecutar `npm test`, rellenar resultados y hacer commit.

Decisiones: ids numéricos autogenerados; el catálogo es público; el rol admin no se puede conceder desde la app, solo desde la BD; las fotos se insertan en los tests con la service role porque su servicio llega en la iteración 06.

## TEST_PLAN

| Caso | Resultado esperado | Resultado obtenido |
|---|---|---|
| Admin crea marca | Marca creada con id | OK |
| Marca duplicada | Error "ya existe" | OK |
| Nombre de marca no válido | Error de validación | OK |
| Cliente crea marca | Error "No autorizado" | OK |
| Listar marcas sin sesión | Incluye la marca creada | OK |
| Admin crea coche | Coche creado con disponible = true | OK |
| Cliente crea coche | Error "No autorizado" | OK |
| Sin sesión crea coche | Error "No autorizado" | OK |
| Precio 0, negativo o no numérico | Error de validación | OK |
| km negativo | Error de validación | OK |
| Año 1800 o 2999 | Error de validación | OK |
| Combustible o transmisión inválidos | Error de validación | OK |
| Potencia 0, modelo vacío, campo desconocido | Error de validación | OK |
| Sin campos obligatorios | Error | OK |
| Marca inexistente | Error "no existe" | OK |
| Insertar precio negativo saltando el servicio | Error de la BD | OK |
| Obtener coche | Coche con marca y fotos ordenadas | OK |
| Obtener coche sin sesión | Devuelve la ficha | OK |
| Obtener id inexistente | Error "Coche no encontrado" | OK |
| Obtener id no válido | Error de validación | OK |
| Dos fotos principales en un coche | Error de la BD | OK |

### Tests automáticos

- `tests/coches.test.js`: cubre todos los casos. Al terminar borra los coches, marcas y usuarios que ha creado.

**Resultado de la ejecución:** `npm test`: `tests/coches.test.js` con 27 tests. En la primera ejecución fallaron 2 (fotos ordenadas y «no admite dos fotos principales»); tras la corrección del test pasan los 27 y los 47 de toda la suite.

## AI_LOG

### Herramienta usada

- Herramienta: Claude Code
- Modelo: Claude Sonnet 5.5 (sesión en la nube)
- Tipo: asistente de código en la nube; yo ejecuto los scripts SQL, los tests y los commits en mi equipo

### Uso realizado

Se usó la IA para:

- redactar SPEC, PLAN y TEST_PLAN;
- generar `sql/003_coches.sql` (marca, coche, foto_coche, enums, `es_admin()` y RLS), validaciones, servicios y tests;
- diagnosticar los 2 tests fallidos a partir de la salida de `npm test`.

### Prompt importante 1

«vamos con la 3». Resultado: SQL, servicios (`crearMarca`, `listarMarcas`, `crearCoche`, `obtenerCoche`), validaciones y tests.

### Prompt importante 2

Salida de `npm test` con 2 tests fallidos y «dame todo lo que falla completo corregido». Resultado: archivo `tests/coches.test.js` corregido.

### Decisiones del estudiante

Se aceptó:

- Catálogo de lectura pública; solo un administrador escribe, mediante `es_admin()`.
- Rol admin asignable solo desde la BD, no desde la app.
- Ids numéricos autogenerados.
- La tabla `foto_coche` se crea ya aquí aunque su servicio llega en la iteración 06, porque `obtenerCoche` devuelve las fotos.

Se rechazó o descartó:

- Ninguno registrado.

### Correcciones manuales

- El `beforeAll` de «obtener coche» insertaba las dos fotos en un lote sin `es_principal` en todas las filas. `supabase-js` pone a `null` las columnas ausentes en un lote, el insert fallaba sin avisar y fallaban dos tests. Se corrigió añadiendo `es_principal` a todas las filas, comprobando el `error` y exigiendo el código `23505` en el test de la foto principal duplicada.

## COMMITS RELACIONADOS

- `HASH` - Iteración 03: marcas y coches (crear y obtener)
