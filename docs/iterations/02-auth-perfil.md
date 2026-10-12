# Iteración 02 - Autenticación y perfil de usuario

## SPEC

### Objetivo

Permitir registrarse, iniciar y cerrar sesión con JWT, y ver y editar el perfil propio.

### Requisitos funcionales

- `registrar({ email, password, nombre, telefono? })` crea el usuario en Supabase Auth y, automáticamente, su perfil con rol `cliente`.
- `login({ email, password })` devuelve el usuario y la sesión; `sesion.access_token` es el JWT.
- `logout()` cierra la sesión.
- `obtenerPerfil(id)` devuelve el perfil solo si es el del usuario autenticado.
- `actualizarPerfil(id, cambios)` permite editar `nombre` y `telefono` solo del perfil propio.
- Los perfiles son **privados**: nadie ve ni edita el perfil de otro.
- El rol no puede modificarse desde el cliente.

### Validaciones

- email con formato válido; contraseña de al menos 8 caracteres.
- nombre de 2 a 100 caracteres.
- teléfono opcional: 9 a 15 caracteres entre dígitos, `+` y espacios.
- `actualizarPerfil` rechaza campos desconocidos (p. ej. `rol`) y objetos vacíos.

### Requisitos técnicos

- Tabla `perfil` (id FK a `auth.users`, nombre, telefono, rol, created_at) con trigger de creación automática.
- RLS activada; permisos de columna: solo `nombre` y `telefono` son editables.
- Validación con Zod en la capa de servicios; la BD tiene además sus propios CHECK.
- Los servicios aceptan un cliente Supabase opcional para poder probar con varios usuarios.

### Fuera de alcance

- Recuperar contraseña, verificar email, perfiles públicos, rol admin asignable por la app (se asignará manualmente en la BD).

## PLAN

1. Escribir y ejecutar `sql/002_perfil.sql` en el SQL Editor.
2. Ampliar `src/lib/supabaseClient.js` con `obtenerClientePorDefecto()`.
3. Crear `src/validation/usuario.js` (esquemas Zod).
4. Crear `src/services/authService.js` y `src/services/perfilService.js`.
5. Crear `tests/helpers/usuarios.js` y `tests/auth-perfil.test.js`.
6. Ejecutar `npm test`, rellenar resultados y hacer commit.

Decisión: el perfil se crea con un trigger en la BD para que no pueda quedar un usuario sin perfil.
Riesgo: límites de Auth en la nube (registros por IP) si se ejecutan los tests muchas veces seguidas.

## TEST_PLAN

| Caso | Resultado esperado | Resultado obtenido |
|---|---|---|
| Registro correcto | Se crea usuario y perfil con rol cliente | OK |
| Email no válido | Error de validación | OK |
| Contraseña corta | Error de validación | OK |
| Nombre vacío | Error de validación | OK |
| Teléfono no válido | Error de validación | OK |
| Email duplicado | Error | OK |
| Login correcto | Devuelve JWT de 3 partes | OK |
| Login con contraseña incorrecta | Error | OK |
| Ver perfil propio | Devuelve el perfil | OK |
| Ver perfil ajeno | Error | OK |
| Ver perfil sin sesión | Error | OK |
| Editar perfil propio | Datos actualizados | OK |
| Editar perfil ajeno | Error y datos intactos | OK |
| Datos de edición no válidos | Error de validación | OK |
| Cambiar rol vía servicio | Error | OK |
| Cambiar rol vía cliente directo | Error de la BD | OK |
| Ver perfil tras logout | Error | OK |

### Tests automáticos

- `tests/auth-perfil.test.js`: cubre todos los casos anteriores. Los usuarios de prueba se borran al final con el cliente admin.

**Resultado de la ejecución:** `npm test`: `tests/auth-perfil.test.js` con 17 tests pasados a la primera. Todos los casos de la tabla tienen su test automático.

## AI_LOG

### Herramienta usada

- Herramienta: Claude Code
- Modelo: Claude Sonnet 5.5 (sesión en la nube)
- Tipo: asistente de código en la nube; yo ejecuto los scripts SQL, los tests y los commits en mi equipo

### Uso realizado

Se usó la IA para:

- redactar SPEC, PLAN y TEST_PLAN;
- generar `sql/002_perfil.sql` (tabla, trigger y RLS), los servicios de auth y perfil, las validaciones con Zod y los tests.

### Prompt importante 1

Se continuó con la iteración 02 (autenticación y perfil) tras pasar los 3 tests de la 01. Resultado: SQL, servicios, validaciones y tests de la iteración.

### Decisiones del estudiante

Se aceptó:

- Perfiles privados (cada usuario solo ve y edita el suyo).
- Trigger que crea el perfil al registrarse.
- Permisos de columna: solo se pueden editar `nombre` y `telefono`, el rol nunca.
- Servicios con cliente Supabase opcional como último parámetro, para probar con varios usuarios.
- Validación con Zod en los servicios y `CHECK` en la BD.

Se rechazó o descartó:

- Ninguno registrado.

### Correcciones manuales

- Ninguna: los tests pasaron sin cambios. Ejecuté `002_perfil.sql` en el SQL Editor y comprobé en el Table Editor que existía la tabla `perfil` con sus 2 políticas RLS.

## COMMITS RELACIONADOS

- `HASH` - Iteración 02: autenticación con JWT y perfil de usuario
