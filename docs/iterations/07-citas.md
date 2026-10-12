# Iteración 07 - Citas para pruebas de conducción

## SPEC

### Objetivo

Permitir a un usuario registrado solicitar una cita para probar un coche, consultar sus citas y cancelarlas, garantizando que un mismo coche no tenga dos citas a la vez.

### Requisitos funcionales

- `solicitarCita({ coche_id, inicio, nota_cliente? })` (requiere sesión):
  - crea una cita a nombre del usuario autenticado, en estado `pendiente` y con duración fija de 30 minutos (`fin = inicio + 30 min`);
  - `inicio` puede ser un `Date` o un texto de fecha ISO;
  - falla si el coche no existe ("Coche no encontrado") o no está disponible ("El coche no está disponible");
  - falla si el horario se solapa con otra cita activa del mismo coche.
- `listarMisCitas()` (requiere sesión): devuelve solo las citas del usuario, ordenadas por fecha, con el modelo y la marca del coche. Sin citas, lista vacía.
- `cancelarCita(id)` (requiere sesión): cancela una cita propia que no esté ya cancelada. Una cita cancelada libera su horario.
- Sin sesión, los tres servicios fallan con "Debes iniciar sesión".
- Un usuario no puede ver, cancelar ni modificar las citas de otro.
- El usuario no puede confirmar su cita, cambiar su fecha ni borrarla (solo cancelarla).

### Reglas de negocio

- Una cita se solapa con otra si comparten coche y sus intervalos se cruzan. Dos citas consecutivas (una acaba cuando empieza la otra) no se solapan. Las citas canceladas no cuentan.
- La misma hora en coches distintos es válida.
- No se pueden pedir citas en el pasado.
- Si se elimina un coche, se eliminan sus citas; si se elimina un usuario, se eliminan las suyas (decisión pendiente desde la iteración 05).

### Validaciones

- `coche_id` entero positivo. `inicio` obligatorio, fecha válida y futura. `nota_cliente` opcional, máximo 500 caracteres.
- No se pueden indicar `usuario_id` ni `estado` (campos desconocidos rechazados).

### Requisitos técnicos

- Tabla `cita` con restricción de exclusión (`btree_gist`) sobre coche y rango de tiempo, que se aplica a citas no canceladas.
- CHECK de duración: `fin - inicio = 30 minutos`.
- Las reglas de seguridad también están en la BD (RLS y permisos de columna), no solo en los servicios: insertar solo a nombre propio, en estado pendiente, en el futuro y para un coche disponible; actualizar solo `estado` y solo para cancelar.
- Mensaje claro para la violación de la restricción de exclusión (código Postgres `23P01`).

### Fuera de alcance

- Que un administrador confirme o gestione citas, horario laboral del concesionario, varias sedes, recordatorios por email, paginar el listado de citas.

## PLAN

1. Escribir y ejecutar `sql/007_citas.sql` en el SQL Editor.
2. Ampliar `src/lib/errores.js` con el código `23P01`.
3. Crear `src/lib/usuarioActual.js`, `src/validation/cita.js` y `src/services/citaService.js`.
4. Crear `tests/citas.test.js`: cada test crea su propio coche, y las horas se calculan a 7 días vista para ser siempre futuras.
5. Ejecutar `npm test`, rellenar resultados y hacer commit.
6. Actualizar `docs/ARCHITECTURE.md` con la tabla `cita`.

Decisiones: la duración fija permite calcular `fin` en el servicio y comprobarla con un CHECK; el solapamiento lo garantiza la BD (un servicio no puede evitar una condición de carrera entre dos usuarios simultáneos); cancelar es el "borrado" de una cita, para conservar el histórico.
Riesgos: la extensión `btree_gist` debe poder activarse en el proyecto (en Supabase se activa con `create extension`).

## TEST_PLAN

| Caso | Resultado esperado | Resultado obtenido |
|---|---|---|
| Solicitar cita | Cita pendiente de 30 min a nombre del usuario | OK |
| Fecha como texto ISO y nota opcional | Funciona | OK |
| Sin sesión | Error "Debes iniciar sesión" | OK |
| Coche inexistente / no disponible | Errores específicos | OK |
| Datos no válidos (7 casos) | Error de validación | OK |
| Misma hora, mismo coche | Error "ya existe una cita" | OK |
| Solapamiento parcial (antes y después) | Error | OK |
| Citas consecutivas | Válidas | OK |
| Misma hora, coches distintos | Válida | OK |
| Cita cancelada libera el horario | Se puede reservar de nuevo | OK |
| Listar mis citas | Solo las propias, ordenadas, con coche y marca | OK |
| Usuario sin citas | Lista vacía | OK |
| Listar sin sesión | Error | OK |
| Cancelar cita propia | Estado cancelada | OK |
| Cancelar cita ajena | Error; la cita sigue pendiente | OK |
| Cancelar dos veces / inexistente / id no válido / sin sesión | Errores específicos | OK |
| BD: cita a nombre de otro, ya confirmada, en el pasado, coche no disponible, duración incorrecta, sin sesión | Error de la BD | OK |
| BD: confirmar, cambiar fecha o borrar la propia cita | No se permite | OK |
| Eliminar un coche | Se eliminan sus citas | OK |

### Tests automáticos

- `tests/citas.test.js`: cubre todos los casos. Borra al final los coches (y sus citas), marcas y usuarios que crea.

**Resultado de la ejecución:** `npm test`: `tests/citas.test.js` pasa, incluidos los casos de solapamiento y los de seguridad en la BD. Todas las pruebas de la suite completa pasan tras añadir esta iteración.

## AI_LOG

### Herramienta usada

- Herramienta: Claude Code
- Modelo: Claude Sonnet 5.5 (sesión en la nube)
- Tipo: asistente de código en la nube; yo ejecuto los scripts SQL, los tests y los commits en mi equipo

### Uso realizado

Se usó la IA para:

- redactar SPEC, PLAN y TEST_PLAN;
- generar `sql/007_citas.sql` (restricción de exclusión con `btree_gist`, `CHECK` de duración y RLS), los servicios de citas, la validación y los tests.

### Prompt importante 1

«vamos con la 7». Resultado: tabla `cita`, servicios `solicitarCita`, `listarMisCitas` y `cancelarCita`, y tests.

### Decisiones del estudiante

Se aceptó:

- Duración fija de 30 minutos, con `fin` calculado en el servicio y verificado por un `CHECK`.
- El solapamiento lo garantiza la BD con una restricción de exclusión sobre coche y rango de tiempo, para evitar condiciones de carrera.
- Cancelar es el «borrado» de una cita.
- Al eliminar un coche se eliminan sus citas (resuelve la duda pendiente de la iteración 05).
- RLS que impide crear citas ajenas, ya confirmadas, en el pasado o de coches no disponibles.

Se rechazó o descartó:

- Que un administrador gestione o confirme citas: queda fuera del alcance.

### Correcciones manuales

- Ninguna registrada.

## COMMITS RELACIONADOS

- `HASH` - Iteración 07: citas con control de solapamientos
