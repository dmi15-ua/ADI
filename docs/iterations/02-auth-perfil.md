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
| Registro correcto | Se crea usuario y perfil con rol cliente | |
| Email no válido | Error de validación | |
| Contraseña corta | Error de validación | |
| Nombre vacío | Error de validación | |
| Teléfono no válido | Error de validación | |
| Email duplicado | Error | |
| Login correcto | Devuelve JWT de 3 partes | |
| Login con contraseña incorrecta | Error | |
| Ver perfil propio | Devuelve el perfil | |
| Ver perfil ajeno | Error | |
| Ver perfil sin sesión | Error | |
| Editar perfil propio | Datos actualizados | |
| Editar perfil ajeno | Error y datos intactos | |
| Datos de edición no válidos | Error de validación | |
| Cambiar rol vía servicio | Error | |
| Cambiar rol vía cliente directo | Error de la BD | |
| Ver perfil tras logout | Error | |

### Tests automáticos

- `tests/auth-perfil.test.js`: cubre todos los casos anteriores. Los usuarios de prueba se borran al final con el cliente admin.

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
