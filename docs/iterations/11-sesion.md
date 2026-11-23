# Iteración 11 - Sesión: registro, login y logout

## SPEC

### Objetivo

Permitir crear una cuenta, iniciar y cerrar sesión desde la interfaz, mostrar quién es el usuario autenticado y proteger las pantallas de administrador, de modo que al cerrar sesión deje de mostrarse información privada. Los usuarios que se registran en la aplicación son los que después pueden iniciar sesión.

### Requisitos funcionales

- **Registro.** La pantalla `/registro` tiene un formulario con nombre, email, contraseña, repetición de la contraseña y teléfono (opcional).
  - Antes de llamar al servidor se validan los campos con las mismas reglas que aplica el backend: nombre de al menos 2 caracteres, email con formato válido, contraseña de al menos 8 caracteres y teléfono (si se indica) de 9 a 15 caracteres entre dígitos, `+` y espacios. Además, las dos contraseñas deben coincidir. Cada error se muestra junto a su campo y, mientras haya errores, no se envía nada.
  - Al crear la cuenta, la base de datos crea automáticamente su perfil con el rol de usuario normal (`cliente`).
  - Si Supabase devuelve una sesión (confirmación de email desactivada), el usuario queda dentro, aparece un aviso de bienvenida y se va al listado. Si hay que confirmar el email, se muestra un mensaje que lo explica y no se inicia sesión.
  - Si el email ya está registrado, se muestra «Ya existe una cuenta con ese email» y se puede corregir. Si no hay conexión, un mensaje lo explica.
  - Mientras se crea la cuenta, el botón queda desactivado y muestra que está trabajando.
- **Login.** La pantalla `/login` tiene un formulario con email y contraseña.
  - Antes de llamar al servidor se valida que el email tenga un formato válido y que la contraseña no esté vacía.
  - Con credenciales correctas se inicia la sesión, aparece un aviso de bienvenida y se va a la pantalla que se había pedido (parámetro `redirect`) o, si no hay, al listado. Solo se aceptan direcciones internas de la aplicación como destino; una dirección externa se ignora.
  - Con credenciales incorrectas se muestra un mensaje comprensible («Email o contraseña incorrectos») y se permanece en el login, pudiendo volver a intentarlo. Si no hay conexión, un mensaje lo explica.
  - Mientras se comprueban las credenciales, el botón queda desactivado y muestra que está trabajando.
  - Desde el login hay un enlace al registro y desde el registro, uno al login.
- **Quién está dentro.** La cabecera muestra, cuando hay sesión, el nombre del usuario (o su email si no tiene perfil), una etiqueta «Admin» si es administrador y el botón «Cerrar sesión». Sin sesión muestra los botones «Registrarse» e «Iniciar sesión». Mientras se comprueba si hay una sesión guardada, muestra un indicador de carga.
- **Persistencia.** Si se recarga la página o se cierra y abre el navegador, la sesión se mantiene, porque `supabase-js` guarda la sesión en el `localStorage` del navegador. Al arrancar se restaura esa sesión una sola vez.
- **Logout.** «Cerrar sesión» cierra la sesión en Supabase (borrando la sesión guardada en el navegador), vacía la información del usuario en la memoria de la aplicación, muestra un aviso y lleva al listado. Si el servidor falla, la interfaz deja igualmente de mostrar los datos del usuario y se avisa del error.
- **Rutas protegidas.** Las pantallas de crear y editar un coche:
  - sin sesión llevan al login, recordando a dónde se iba;
  - con un usuario que no es administrador llevan a una pantalla «No tienes permiso»;
  - con un administrador se muestran.
  Quien ya ha iniciado sesión y entra en `/login` o en `/registro` es redirigido al listado.
- **Administrador.** Un usuario es administrador si el campo `rol` de su perfil vale `admin`. Nadie puede hacerse administrador desde la aplicación: el rol se asigna en la base de datos. Si no se puede leer el perfil, el usuario sigue dentro, pero se trata como usuario normal.
- La protección de la interfaz es solo una comodidad: la autorización real sigue comprobándose siempre en el backend (RLS).

### Requisitos técnicos

- Tienda de Pinia `sesion` con el usuario, el perfil y los indicadores `iniciada` y `cargando`, y las acciones `iniciar`, `entrar`, `registrarse` y `salir`. Los componentes solo usan la tienda, nunca los servicios de autenticación directamente.
- La sesión (token) la guarda `supabase-js` en el `localStorage`; la tienda guarda en memoria una copia del usuario y del perfil, que se pierde al recargar y se reconstruye al iniciar.
- Guardia global del router, que antes de cada navegación espera a que se haya restaurado la sesión.
- La validación de los formularios reutiliza los esquemas `loginSchema` y `registroSchema` de la capa de servicios, y el registro usa el servicio `registrar` de la práctica 1.
- `src/utils/errores.js` traduce los errores de Supabase y de red (credenciales, email repetido, límite de intentos, conexión...) a mensajes comprensibles; los de validación y permisos de los servicios ya vienen en español. Se reutilizará en el resto de pantallas.
- La edición del perfil no se implementa en el frontend, como permite el enunciado.

### Fuera de alcance

- Edición del perfil y recuperación de contraseña.
- Renovación automática de un token caducado más allá de la que ya hace `supabase-js`.
- Las acciones de administrador dentro del listado y del detalle (iteraciones 12 a 16).

## PLAN

1. Crear `src/utils/errores.js` (`mensajeDeError`).
2. Crear la tienda `src/stores/sesion.js` (con `registrarse`).
3. Crear las pantallas `SinPermisoView` y `RegistroView`, y sus rutas.
4. Añadir la guardia al router (`src/router/index.js`), que recibe la instancia de Pinia, y adaptar `main.js`.
5. Crear `LoginView` con la validación, los errores, el estado de carga y el enlace al registro.
6. Reescribir `App.vue` para mostrar la zona de sesión de la cabecera y el cierre de sesión.
7. Adaptar `tests/helpers.js` y `tests/router.test.js`; crear `tests/sesion.store.test.js`, `tests/errores.test.js`, `tests/login.test.js` y `tests/registro.test.js`; ampliar `tests/app.test.js`.
8. Ejecutar `npm test` y `npm run build`.
9. Hacer el recorrido manual con el Supabase real: registrar un usuario nuevo, cerrar sesión, iniciar sesión con él y convertirlo en administrador desde la base de datos.

Decisiones: la sesión no se guarda en la base de datos sino en el `localStorage` del navegador (lo hace `supabase-js`); la tienda solo guarda una copia en memoria; tras registrarse con éxito el usuario queda dentro sin tener que volver a escribir sus datos; la guardia espera a restaurar la sesión para no mostrar el login por error al recargar; el destino tras el login solo puede ser una ruta interna, para evitar redirecciones a sitios externos; la contraseña solo se exige no vacía en el login (la regla de longitud mínima se aplica al registrar).
Riesgo: si el perfil no se puede leer, un administrador se vería como usuario normal; se acepta, porque es lo más seguro. Si el proyecto de Supabase tiene activada la confirmación de email, el registro no inicia sesión (está contemplado).

## TEST_PLAN

| Caso | Resultado esperado | Resultado obtenido |
|---|---|---|
| Registro: formulario vacío | Muestra los errores y no llama al servidor |  |
| Registro: nombre corto, email no válido, contraseña de menos de 8, contraseñas distintas, teléfono no válido | Error en el campo correspondiente y no llama al servidor |  |
| Registro: teléfono opcional | Se envía sin teléfono; con teléfono, se envía |  |
| Registro correcto con sesión | El usuario queda dentro, va al listado y ve su nombre en la cabecera |  |
| Registro que exige confirmar el email | Explica que hay que confirmar y no inicia sesión |  |
| Registro con email ya registrado | Mensaje «Ya existe una cuenta con ese email» |  |
| Registro sin conexión y botón mientras trabaja | Mensaje de conexión; botón desactivado |  |
| Login: formulario vacío y email con formato incorrecto | Errores junto a cada campo y no llama al servidor |  |
| Login correcto | Entra, va al listado, la cabecera muestra el nombre y sale el aviso de bienvenida |  |
| Login con contraseña incorrecta | Mensaje «Email o contraseña incorrectos», se queda en el login y se puede reintentar |  |
| Login sin conexión y botón mientras trabaja | Mensaje de conexión; botón desactivado |  |
| Volver a donde se iba / destino externo | Va a la pantalla pedida; un destino externo se ignora |  |
| Enlaces entre login y registro, y botón «Registrarse» | Llevan a la otra pantalla |  |
| Restauración de la sesión guardada | Sin sesión, con sesión y perfil, con rol admin, sin perfil, con fallo; solo una consulta |  |
| Tienda: entrar, registrarse y salir | Guarda y borra el usuario y el perfil; si falla el servidor al salir, la memoria queda vacía |  |
| Pantallas públicas sin sesión | Se ven (incluido el registro) |  |
| Pantalla de administrador sin sesión | Lleva al login con `redirect` |  |
| Pantalla de administrador como usuario normal / administrador | «No tienes permiso» / se muestra |  |
| Entrar en `/login` o `/registro` con sesión | Redirige al listado |  |
| Cabecera sin sesión / usuario normal / administrador | Botones de acceso / nombre y salir / etiqueta Admin |  |
| Cabecera mientras se comprueba la sesión | Indicador de carga |  |
| Cerrar sesión | La cabecera pierde los datos, se vuelve al listado y sale el aviso |  |
| Cerrar sesión con fallo del servidor | Avisa y la interfaz no muestra datos del usuario |  |
| Traducción de mensajes de error | Los de Supabase y de red se traducen; los demás se respetan |  |
| `npm run build` | Sin errores |  |
| Recorrido manual con el Supabase real: registrar un usuario nuevo | Queda dentro, o se le pide confirmar el email si está activado |  |
| Recorrido manual: cerrar sesión e iniciar sesión con ese usuario, y recargar | Entra con él y la sesión se mantiene al recargar |  |
| Recorrido manual: administrador | Tras darle rol admin en la base de datos, aparece la etiqueta Admin y se accede a `/coches/nuevo` |  |
| Sesión guardada en el navegador | Existe una clave `sb-...-auth-token` en el `localStorage` tras entrar y desaparece tras salir |  |

### Tests automáticos

- `tests/registro.test.js` (14 tests): validación, creación de la cuenta, confirmación de email y errores.
- `tests/login.test.js` (13 tests): formulario, errores, estado de carga, destino tras el login y enlace al registro.
- `tests/sesion.store.test.js` (15 tests): tienda de sesión con los servicios simulados.
- `tests/router.test.js` (22 tests): rutas, navegación y protección de rutas.
- `tests/app.test.js` (14 tests): estructura de la aplicación y zona de sesión de la cabecera.
- `tests/errores.test.js` (10 tests): traducción de mensajes.
- `tests/avisos.test.js` (4 tests) y `tests/setup.test.js` (8 tests): sin cambios de comportamiento.

**Resultado de la ejecución:** (pendiente: se rellena después de ejecutar `npm test`, `npm run build` y el recorrido manual con el Supabase real).

## AI_LOG

### Herramienta usada

- Herramienta: Claude Code
- Modelo: Claude Sonnet 5.5 (sesión en la nube)
- Tipo: asistente de código en la nube

### Uso realizado

Se usó la IA para:

- proponer el diseño de la sesión (tienda, guardia del router y mensajes de error);
- **redactar la SPEC, el PLAN y el TEST_PLAN** (por petición del estudiante, que los revisa y los hace suyos);
- generar la tienda, las pantallas de registro y de login, la cabecera, la guardia y los tests;
- comprobar el flujo completo (registro, login, recarga y logout) en un navegador real contra un Supabase simulado.

### Prompt importante 1

«vamos con la iteración 11, cuando se haga login se va a guardar en supabase o solo será en memoria». Resultado: explicación de dónde vive la sesión (`localStorage` del navegador y una copia en memoria en la tienda).

### Prompt importante 2

«quiero hacerlo con registro y que esos sean los que puedan hacer login». Resultado: la iteración 11 pasa a incluir la pantalla de registro, y los usuarios registrados son los que luego inician sesión.

### Decisiones de diseño propuestas por la IA

Revisadas por el estudiante, que las acepta todas.

- La sesión no se guarda en la base de datos: la gestiona `supabase-js` en el `localStorage`.
- La tienda guarda en memoria una copia del usuario y del perfil.
- Tras registrarse con éxito, el usuario queda dentro (si Supabase devuelve sesión).
- La guardia del router espera a restaurar la sesión antes de decidir.
- Pantalla «No tienes permiso» para usuarios que no son administradores.
- El destino tras el login solo puede ser una ruta interna.

### Se rechazó o descartó

- Dejar el registro fuera del frontend (el enunciado lo permite): descartado por decisión del estudiante.
- Guardar el token a mano en `localStorage` desde la tienda: descartado, porque `supabase-js` ya lo hace.

### Correcciones manuales

- Ninguna.

## COMMITS RELACIONADOS

- `2c5507f` - Iteración 11: registro, login y logout
