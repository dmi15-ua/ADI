# Iteración 19 - Implementación parcial con React (login, listado y borrado)

## SPEC

### Objetivo

Cumplir el apartado adicional «Implementación parcial con otro framework»: en un **proyecto separado**, implementar con **React** el listado y el borrado del recurso principal (los coches) sobre el **mismo backend de Supabase**, con la autenticación necesaria para borrar, **reutilizando los servicios** que no dependen del framework y **explicando las diferencias** en componentes y gestión del estado respecto a Vue. No se repite el resto del frontend.

### Requisitos funcionales

- **Proyecto separado.** Carpeta `frontend-react/` junto a `frontend-vue/`, con su propio `package.json`, instalación, ejecución (`npm run dev`, puerto 5174), tests (`npm test`) y compilación (`npm run build`). Usa las mismas variables `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` (solo la clave pública).
- **Sesión.**
  - Al arrancar se restaura la sesión guardada por supabase-js; hasta saber si la hay, se muestra «Cargando…» y ningún botón de sesión.
  - Un visitante ve «Iniciar sesión»; un usuario con sesión ve su nombre (o su email si no tiene perfil), la etiqueta «Admin» si lo es y «Cerrar sesión».
  - Cerrar sesión quita al usuario y sus datos de la interfaz aunque falle la llamada al servidor.
- **Login.** Formulario con email y contraseña, validado con el mismo esquema que el backend (errores «Email no válido» y «La contraseña es obligatoria», cada uno junto a su campo, sin llamar al servidor). Si el servidor rechaza (credenciales incorrectas, sin conexión…) se muestra el mensaje en español, se conserva lo escrito y se puede reintentar. Mientras entra, el botón está desactivado. «Cancelar» vuelve al listado.
- **Listado.** Coches disponibles en tarjetas (foto principal o «Sin foto», marca y modelo, precio, año y kilometraje, combustible y transmisión) con **paginación en el servidor** (9 por página): botones de página, anterior y siguiente (desactivados en los extremos) e informe «Mostrando 1-9 de 25 coches».
  - Mientras carga por primera vez: indicador y texto. Al cambiar de página, los coches anteriores se mantienen atenuados.
  - Sin coches: «No hay coches disponibles en este momento.» (no es un error).
  - Si falla la carga: mensaje comprensible con «Reintentar», que vuelve a pedir la misma página.
- **Quién puede eliminar.** Solo los administradores ven el botón «Eliminar» de cada tarjeta. A un visitante se le invita a iniciar sesión como administrador; a un usuario normal se le explica que su cuenta no tiene permisos. La autorización real la aplica Supabase (RLS).
- **Eliminar.**
  - Pide confirmación: «¿Seguro que quieres eliminar {marca} {modelo}? Esta acción no se puede deshacer y también se eliminarán sus fotos.» El foco empieza en «Cancelar». Cancelar, pulsar Escape o pulsar fuera del diálogo no eliminan nada.
  - Al confirmar se elimina y aparece «Coche eliminado»; el listado se vuelve a pedir, de modo que el coche desaparece y el total se actualiza sin recargar la página.
  - Mientras se elimina, todos los botones de eliminar están desactivados y el del coche indica «Eliminando…».
  - Si falla (sin permiso, sin conexión, el coche ya no existe), aparece «No se pudo eliminar el coche» con la causa en español, el coche sigue en el listado y se puede reintentar.
  - Si se elimina el único coche de la última página, pasa a la página anterior; si se eliminan todos, aparece el mensaje de lista vacía.
- **Documentación de las diferencias.** `frontend-react/README.md` explica con una tabla las diferencias con Vue en componentes, estado local, efectos, estado compartido, lógica reutilizable, confirmación, biblioteca de componentes, navegación y tests.

### Requisitos técnicos

- Vite + React 19 + `@vitejs/plugin-react`; Vitest + Testing Library + jsdom para los tests.
- **Servicios reutilizados:** `src/servicios` (cliente de Supabase, validación con Zod, `authService`, `cocheService`, `perfilService`) y `src/utils` (`errores.js`, `formato.js`) son **copias idénticas** de las del proyecto Vue. Se copian (no se enlazan) para que cada proyecto se instale y ejecute por separado, y un test comprueba que siguen siendo idénticas.
- Sesión: `SesionContext` (Context de React) con usuario, perfil, rol y las acciones `entrar` y `salir`.
- Listado: hook `useCoches` (estado, carga, paginación, descarte de respuestas antiguas y salto a la última página si la pedida ya no existe).
- Componentes: `App`, `LoginForm`, `ListadoCoches`, `TarjetaCoche`, `Paginador`, `EstadoCarga` y `DialogoConfirmacion` (accesible: `role="dialog"`, foco y Escape).

### Fuera de alcance

- Detalle, creación, edición, búsqueda, fotos, registro de usuarios y router (el enunciado no exige repetirlos).
- Guardar la página actual en la URL.
- Biblioteca de componentes (se hizo en el proyecto Vue).

## PLAN

1. Crear `frontend-react/` (`package.json`, `vite.config.js`, `index.html`, `.env.example`, `.gitignore`) y copiar `src/servicios` y `src/utils` del proyecto Vue.
2. Crear `src/contexto/SesionContext.jsx` y `src/hooks/useCoches.js`.
3. Crear los componentes (`EstadoCarga`, `DialogoConfirmacion`, `Paginador`, `TarjetaCoche`, `LoginForm`, `ListadoCoches`), `App.jsx`, `main.jsx` y `estilos.css`.
4. Crear los tests: `servicios-iguales`, `sesion`, `useCoches`, `login` y `listado` (con servicios mockeados).
5. Escribir `frontend-react/README.md` con la instalación y la comparación con Vue.
6. Ejecutar `npm test` y `npm run build` en `frontend-react/`.
7. Probar a mano con el Supabase real.

Decisiones: se copian los servicios en lugar de importarlos del otro proyecto, para que cada carpeta funcione sola; un test vigila que la copia no se desincronice; no se usa router ni biblioteca de componentes, porque solo hay dos pantallas y esos apartados ya están hechos en Vue; la sesión va en un Context (se necesita en toda la aplicación) y el listado en un hook (solo lo usa una pantalla); el diálogo de confirmación es propio y accesible; los tests consultan lo que ve el usuario (roles y textos) en lugar de detalles de implementación; el comportamiento (estados, mensajes, página anterior tras borrar) es el mismo que en Vue para que la comparación sea justa.
Riesgo: si cambia la capa de servicios del proyecto Vue y no se copia, los proyectos divergen; el test lo detecta.

## TEST_PLAN

| Caso | Resultado esperado | Resultado obtenido |
|---|---|---|
| Arranque con y sin sesión guardada | Muestra «Cargando…» y, después, «Iniciar sesión» (o el usuario con «Cerrar sesión») |  |
| Restaurar una sesión de administrador / de usuario normal / sin perfil | Nombre y «Admin» / sin «Admin» / se muestra el email y se trata como usuario normal |  |
| Login correcto | Entra, vuelve al listado y muestra al usuario |  |
| Login con el formulario vacío o con un email mal escrito | Errores junto a los campos y no se llama al servidor |  |
| Login con credenciales incorrectas / sin conexión | Mensaje en español, se conserva lo escrito y se puede reintentar |  |
| Login: botón mientras entra y «Cancelar» | Desactivado mientras entra; Cancelar vuelve al listado |  |
| Cerrar sesión | Desaparece el usuario y vuelve «Iniciar sesión»; sin botones de eliminar |  |
| Listado con datos | 9 tarjetas con precio, año, kilometraje y etiquetas; paginador e informe «Mostrando 1-9 de 25 coches» |  |
| Coche sin foto | Muestra «Sin foto» |  |
| Cambiar de página (números, anterior, siguiente) | Pide esa página; anterior y siguiente se desactivan en los extremos; la última tiene menos coches |  |
| Cargando por primera vez / cambiando de página | Indicador; en el cambio de página los coches anteriores siguen atenuados |  |
| Listado vacío | «No hay coches disponibles en este momento.», sin error |  |
| Fallo al cargar y «Reintentar» | Mensaje comprensible; al reintentar muestra la lista |  |
| Quién ve «Eliminar»: visitante / usuario normal / administrador | Solo el administrador; a los demás se les explica por qué |  |
| Pulsar «Eliminar» | Diálogo con el nombre del coche y el aviso de que no se puede deshacer; foco en «Cancelar»; sin borrar todavía |  |
| Cancelar, Escape y pulsar fuera | No se elimina nada ni se vuelve a pedir el listado |  |
| Confirmar | «Coche eliminado», el coche desaparece y el total se actualiza |  |
| Mientras se elimina | Botones de eliminar desactivados y «Eliminando…» |  |
| El servidor rechaza / sin conexión / coche ya borrado | Aviso con la causa; el coche sigue; se puede reintentar |  |
| Eliminar el único coche de la última página / todos los coches / uno que no es el último | Pasa a la página anterior / lista vacía / se queda en la misma página |  |
| Recorrido completo: visitante → login → eliminar → cerrar sesión | Tras cerrar sesión desaparecen los botones de eliminar |  |
| Copias de los servicios | Idénticas a las del proyecto Vue |  |
| `npm run build` en `frontend-react` | Sin errores |  |
| Comprobación manual con el Supabase real: iniciar sesión como administrador | Entra y aparece «Admin» |  |
| Comprobación manual: eliminar un coche de prueba | Desaparece del listado y de la base de datos |  |
| Comprobación manual: iniciar sesión como usuario normal | No aparecen botones de eliminar |  |
| Comprobación manual: recargar la página con la sesión iniciada | La sesión se restaura sin volver a pedir las credenciales |  |
| Comprobación manual: permisos en Supabase (RLS) | Con un usuario normal, intentar borrar un coche desde la consola lo rechaza la base de datos |  |

### Tests automáticos

En `frontend-react/` (se ejecutan con `npm test`):

- `tests/servicios-iguales.test.js` (22 tests): las copias de los servicios existen y son idénticas a las del proyecto Vue.
- `tests/sesion.test.jsx` (10 tests): el contexto de sesión (restaurar, perfil, entrar, salir, errores).
- `tests/useCoches.test.jsx` (9 tests): el hook del listado (carga, páginas, respuestas antiguas, errores, página inexistente, recargar).
- `tests/login.test.jsx` (11 tests): cabecera, formulario de login y cierre de sesión, con la aplicación completa.
- `tests/listado.test.jsx` (27 tests): listado, estados, quién ve «Eliminar», eliminación, página tras eliminar y un recorrido completo.
- Comprobación de que los tests detectan fallos: al mostrar el botón de eliminar a todos y al dejar de recargar el listado tras eliminar, fallan los tests correspondientes.
- Además, la IA comprobó el flujo en un navegador real contra un Supabase simulado (visitante, login con errores, diálogo con foco y Escape, rechazo por permisos, eliminación, recarga con sesión restaurada, última página y cierre de sesión); esa prueba no sustituye a la comprobación manual con tu Supabase real. El único error de consola fue el 403 que el simulador devuelve a propósito para probar el rechazo.

**Resultado de la ejecución:** (pendiente: se rellena después de ejecutar `npm install` y `npm test` en `frontend-react` —deben salir 5 archivos y 79 tests—, `npm run build` y las comprobaciones manuales).

## AI_LOG

### Herramienta usada

- Herramienta: Claude Code
- Modelo: Claude Sonnet 5.5 (sesión en la nube)
- Tipo: asistente de código en la nube

### Uso realizado

Se usó la IA para:

- proponer el diseño (proyecto separado, servicios copiados con un test que vigila las copias, Context para la sesión y hook para el listado, sin router ni biblioteca de componentes);
- **redactar la SPEC, el PLAN y el TEST_PLAN** (por petición del estudiante, que los revisa y los hace suyos);
- generar el proyecto React, los tests y el README con la comparación con Vue;
- comprobar el flujo en un navegador real contra un Supabase simulado.

### Prompt importante 1

«vamos con la iteración 19». Resultado: proyecto `frontend-react` con login, listado paginado y borrado con confirmación, y la comparación con Vue.

### Decisiones de diseño propuestas por la IA

[REVISAR: confirma que las aceptas o anota las que cambiaste]

- Proyecto separado con los servicios copiados (y un test que comprueba que son idénticos).
- La sesión en un Context y el listado en un hook.
- Sin router ni biblioteca de componentes.
- Diálogo de confirmación propio y accesible.
- Mismo comportamiento que en Vue para que la comparación sea justa.

### Se rechazó o descartó

- Importar los servicios directamente de `../frontend-vue`: descartado, cada proyecto debe poder instalarse y ejecutarse por separado.
- Usar `react-router` y una biblioteca de componentes: descartado, solo hay dos pantallas y esos apartados ya están en el proyecto Vue.
- Un estado global (Redux, Zustand…): descartado, un Context y un hook bastan para esta parte.

### Correcciones manuales

- [COMPLETAR: cambios que hayas hecho tú, o «Ninguna»]

## COMMITS RELACIONADOS

- `HASH_19` - (se rellena al hacer el commit)
