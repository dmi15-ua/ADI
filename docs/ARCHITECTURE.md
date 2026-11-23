# ARCHITECTURE

## Backend

- **Supabase (BaaS)** en un proyecto online (supabase.com), gestionado desde su web, sin Supabase CLI ni Docker.
- **Autenticación:** Supabase Auth con tokens **JWT**. Supabase Auth genera el JWT al hacer login (`sesion.access_token`); `supabase-js` lo guarda y lo envía en la cabecera `Authorization: Bearer` en cada petición. En la BD, `auth.uid()` devuelve el id del usuario del token y las políticas RLS lo usan.
- **Base de datos:** Postgres. El esquema se aplica manualmente pegando scripts SQL numerados en el **SQL Editor** de Supabase. Los scripts están versionados en `sql/` y se ejecutan en orden.
- **Seguridad:** Row Level Security (RLS) en todas las tablas, más permisos de columna donde hace falta (por ejemplo, un usuario solo puede editar `nombre` y `telefono` de su perfil).
- **Capa de servicios** en JavaScript (ES modules) en `src/services/`. Aísla la API de Supabase: el frontend solo conoce estas funciones (usa una copia en `frontend-vue/src/servicios`).
- **Validación en dos niveles:** Zod en los servicios (mensajes claros) y `CHECK`, claves foráneas, restricciones únicas y de exclusión en la BD (red de seguridad frente a quien use el cliente directamente).

## Frontend

Aplicación de una sola página (SPA) en **Vue 3** con **Vite**, en `frontend-vue/`. Usa **Pinia** (estado compartido), **Vue Router**, **PrimeVue** (biblioteca de componentes, tema Aura claro, textos en español) y **Zod** (validación). Se conecta al backend de Supabase mediante una copia de la capa de servicios de la práctica 1.

### Capas y responsabilidades

```
Vistas y componentes  →  Estado compartido (Pinia) / composables  →  Servicios  →  Supabase
   (presentación)            (datos y operaciones)                  (acceso al backend)
```

**1. Vistas y componentes (presentación e interacción).** Cada vista corresponde a una ruta y se apoya en componentes con una responsabilidad clara; ninguna concentra toda la aplicación.

| Vista (`src/views`) | Ruta | Qué hace |
|---|---|---|
| `ListadoView` | `/` | Barra de búsqueda, tarjetas de coches, paginador, estados de carga/error/vacío; botón «Nuevo coche» (admin) |
| `DetalleView` | `/coches/:id` | Ficha completa y galería; botones editar y eliminar y gestión de fotos (admin) |
| `FormularioCocheView` | `/coches/nuevo`, `/coches/:id/editar` | Crear y editar con el mismo formulario; solo admin |
| `LoginView`, `RegistroView` | `/login`, `/registro` | Formularios de sesión validados |
| `SinPermisoView`, `NoEncontradoView` | `/sin-permiso`, cualquier otra | Avisos de acceso denegado y de página inexistente |

| Componente (`src/components`) | Responsabilidad |
|---|---|
| `CocheCard` | Tarjeta de un coche en el listado, con acciones de admin |
| `FiltrosCoches` | Barra de búsqueda: borrador de filtros; emite `buscar` (no consulta nada) |
| `FormularioCoche` | Campos y validación de un coche, para crear y editar; emite `guardar` y `cancelar` |
| `GaleriaFotos` | Foto grande y miniaturas, con marcador si una imagen no carga |
| `GestorFotos` | Lista, alta y baja de fotos (admin); emite `anadir` y `eliminar` |
| `EstadoCarga` | Muestra uno de: cargando, error con «Reintentar», vacío o el contenido |
| `App.vue` | Cabecera con la sesión, avisos (`Toast`), diálogos de confirmación y la vista actual |

**2. Estado compartido (Pinia, `src/stores`).** Información que necesitan varias partes de la aplicación:

| Tienda | Contiene | Operaciones |
|---|---|---|
| `sesion` | usuario, perfil, `iniciada`, `autenticado`, `esAdmin`, `nombre` | `iniciar` (restaurar la sesión guardada), `entrar`, `registrarse`, `salir` |
| `coches` | página actual del listado, total, filtros, detalle del coche abierto, estados de carga y error de cada uno, `eliminandoId` | `cargar`, `reintentar`, `cargarDetalle`, `refrescarDetalle`, `crear`, `actualizar`, `eliminar`, `anadirFoto`, `eliminarFoto` |
| `marcas` | lista de marcas, cargando, error | `cargar` (una sola vez, compartida por el formulario y los filtros) |

El **estado local** se queda en cada componente: los campos y errores de un formulario, el borrador de los filtros, qué miniatura está seleccionada o qué imágenes han fallado. La tienda `coches` descarta las respuestas antiguas cuando se piden dos cosas seguidas (por ejemplo, dos páginas).

**3. Acceso al backend (`src/servicios`).** Copia de la capa de servicios de la práctica 1 (`lib/`, `validation/`, `services/`), con tres cambios: el cliente de Supabase lee `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` (navegador) en lugar de `process.env`, `authService` añade `obtenerSesion` (restaurar la sesión al recargar) y un mensaje de validación se hizo más claro. No se copian los servicios de citas y favoritos, porque la interfaz no los usa. **Solo las tiendas importan los servicios**: las vistas, los componentes y los composables no conocen Supabase ni sus tablas (los componentes sí importan los esquemas Zod, para validar los formularios en el cliente).

**4. Navegación (`src/router`).** Una ruta por vista (tabla anterior), con la página y los filtros en la URL (`/?texto=ibiza&marca=2&precio_max=15000&orden=precio_asc&pagina=2`), de modo que se pueden compartir y funcionan atrás y adelante. Una guardia (`beforeEach`) espera a saber si hay sesión guardada y protege las rutas con `meta.requiereAdmin`: un visitante es llevado a `/login?redirect=…` (y vuelve a la ruta tras entrar) y un usuario normal a `/sin-permiso`. Un usuario con sesión no ve `/login` ni `/registro`. El título de la pestaña cambia con la pantalla. `:id(\d+)` evita que `/coches/nuevo` se confunda con un id.

**5. Utilidades y composables.**

| Pieza | Función |
|---|---|
| `utils/errores.js` | Traduce los errores de Supabase y de red a mensajes comprensibles en español; los de nuestros servicios ya vienen en español |
| `utils/filtros.js` | Lee y escribe los filtros de la URL, ignorando lo no válido |
| `utils/cambios.js` | Calcula qué campos ha modificado el usuario al editar (solo se envía eso) |
| `utils/formato.js` | Precio, kilometraje y etiquetas de combustible y transmisión |
| `useNotificaciones`, `useConfirmacion` | Avisos y diálogos de confirmación (promesa: aceptar o cancelar), sin depender de la API de PrimeVue |
| `useEliminarCoche`, `useGestionFotos` | Confirmar, eliminar/añadir, avisar y refrescar; compartidos entre pantallas |
| `useVolverAlListado` | Volver al listado en la misma página si se venía de él |

### Sesión y autorización

- **Dónde se guarda la sesión:** `supabase-js` guarda el token JWT en el `localStorage` del navegador y lo restaura al recargar (`obtenerSesion`). La tienda `sesion` guarda en memoria una copia del usuario y de su perfil (nombre y rol) solo para pintar la interfaz.
- **Qué cambia al cerrar sesión:** `salir` llama a `logout` de Supabase (borra el token) y vacía usuario y perfil **aunque falle la llamada**; la cabecera vuelve a «Iniciar sesión», desaparecen las acciones de administrador y se lleva al listado público.
- **Autorización:** la interfaz oculta las acciones a quien no puede hacerlas (`esAdmin`), pero **la que cuenta es la RLS de Supabase**, que sigue rechazando cualquier escritura de un no administrador.

### Estados, errores y validación

- Toda carga muestra **cargando**; un **error** (con «Reintentar») se distingue de una **lista vacía**; en las páginas con datos previos, mientras llega la nueva se mantienen atenuados.
- Los errores se muestran en español, también los de validación y permisos del backend, y el formulario conserva lo escrito.
- **Validación en dos niveles**: en el cliente con los esquemas Zod de la capa de servicios (los mismos del backend, para que las reglas no se desincronicen) y en el backend. Tras crear, editar o eliminar, el listado y el detalle se vuelven a pedir al abrirse o se refrescan, sin recargar la página.

### Tests del frontend

- **Vitest + @vue/test-utils + jsdom**: pruebas de funciones, tiendas, componentes y de la aplicación completa (rutas, sesión y flujos) con los servicios **simulados**, de modo que no tocan la base de datos (25 archivos, 376 tests).
- jsdom no implementa `matchMedia` ni `ResizeObserver`, que PrimeVue usa: `tests/preparar-entorno.js` los simula, y también sustituye por defecto el servicio de marcas.
- Las comprobaciones contra el **backend real** son manuales (recorrido completo de la iteración 20) y los tests de integración del backend.

### Implementación parcial con React (`frontend-react/`)

Proyecto separado con login, listado paginado y borrado, sobre el mismo backend. Reutiliza `src/servicios` y `src/utils` como **copia idéntica** (un test comprueba que sigue siéndolo). La sesión va en un Context de React y el listado en un hook `useCoches`; no usa router ni biblioteca de componentes. Sus diferencias con Vue (componentes, estado local y compartido, efectos, navegación, tests) están en `frontend-react/README.md`.

### Decisiones de diseño del frontend

- **Capas separadas** (vistas → tiendas → servicios): cambiar el backend solo afecta a `servicios/`.
- **Copia de la capa de servicios** en lugar de importarla del otro proyecto: cada carpeta se instala y ejecuta por separado.
- **Pinia también para los datos del servidor** (listado, detalle, marcas), para simplificar, con descarte de respuestas antiguas.
- **Filtros y página en la URL**, para compartir, recargar y usar atrás/adelante; la búsqueda se hace en el servidor.
- **Un solo formulario** para crear y editar; al editar solo se envía lo modificado y se pide confirmación si se cancela con cambios.
- **Confirmación obligatoria** al eliminar (coche y foto), porque el borrado es definitivo y en cascada.
- **Refrescar sin vaciar** la ficha tras cambiar las fotos, para que no parpadee.
- **La interfaz oculta, el backend decide**: el rol solo sirve para pintar; la seguridad real es la RLS.
- **Fotos como URL**, igual que en el backend; las que no cargan se señalan.
- **Tema claro fijo**: el modo oscuro automático de PrimeVue dejaba los textos ilegibles.

## Tests

- **Vitest** contra el proyecto Supabase online (tests de integración sobre la capa de servicios y sobre la BD).
- Los tests crean usuarios, marcas y coches únicos, y los borran al terminar con la `service_role key` (solo se usa en `tests/`, nunca en `src/`).
- Se ejecutan en serie (`fileParallelism: false`) porque comparten la misma BD.
- Para hacer admin a un usuario de prueba se actualiza `perfil.rol` con la `service_role`, igual que se haría a mano en la BD.

## Tablas

### perfil
`id` (PK, FK a `auth.users`, cascade), `nombre` (2-100 caracteres), `telefono` (opcional, 9-15 dígitos, `+` y espacios), `rol` (`cliente` | `admin`, por defecto `cliente`), `created_at`.
Se crea automáticamente con un trigger al registrarse un usuario. Los perfiles son privados.

### marca
`id` (PK), `nombre` (único, 2-50), `pais` (opcional).

### coche
`id` (PK), `marca_id` (FK), `modelo`, `precio` (> 0), `km` (>= 0), `anio` (1950-2100 en BD; en el servicio hasta año actual + 1), `combustible` (`gasolina` | `diesel` | `electrico`), `transmision` (`manual` | `automatico`), `potencia_cv` (> 0), `descripcion` (opcional), `equipamiento` (jsonb, lista de textos), `disponible` (por defecto `true`), `created_at`.
Índices en `precio`, `combustible`, `transmision`, `disponible` y `marca_id`.

### foto_coche
`id` (PK), `coche_id` (FK, cascade), `url` (http/https), `orden`, `es_principal`.
Índice único parcial: como mucho una foto principal por coche. Las fotos se guardan como URL (sin Supabase Storage).

### cita
`id` (PK), `usuario_id` (FK a `auth.users`, cascade), `coche_id` (FK, cascade), `inicio`, `fin`, `estado` (`pendiente` | `confirmada` | `cancelada`), `nota_cliente` (opcional, máx. 500), `created_at`.
- `CHECK (fin - inicio = 30 minutos)`.
- `EXCLUDE USING gist (coche_id WITH =, tstzrange(inicio, fin) WITH &&) WHERE (estado <> 'cancelada')`: un coche no puede tener dos citas activas que se solapen (requiere la extensión `btree_gist`).

### favorito
`usuario_id` (FK a `auth.users`, cascade), `coche_id` (FK, cascade), `fecha_guardado`. PK compuesta `(usuario_id, coche_id)`.

### Relaciones
- marca 1:N coche
- coche 1:N foto_coche
- usuario 1:1 perfil
- usuario 1:N cita, coche 1:N cita
- usuario N:M coche a través de favorito

## Políticas de acceso (RLS)

| Tabla | Lectura | Escritura |
|---|---|---|
| perfil | solo el propio | solo el propio, y solo `nombre` y `telefono` |
| marca, coche, foto_coche | pública (incluye visitantes sin sesión) | solo administradores (`es_admin()`) |
| cita | solo las propias | insertar: a nombre propio, pendiente, en el futuro y coche disponible. Actualizar: solo `estado`, y solo para cancelar una cita propia. Sin borrado |
| favorito | solo los propios | insertar y borrar solo los propios. Sin actualización |

`es_admin()` es una función SQL (`security definer`) que consulta `perfil.rol` del usuario autenticado. Nadie puede concederse el rol admin desde la aplicación: se asigna a mano en la BD (`update perfil set rol = 'admin' where id = '...'`).

## Capa de servicios (`src/services`)

| Servicio | Funciones | Acceso |
|---|---|---|
| authService | `registrar`, `login`, `logout` | público / sesión |
| perfilService | `obtenerPerfil(id)`, `actualizarPerfil(id, cambios)` | solo el propio perfil |
| marcaService | `crearMarca`, `listarMarcas` | crear: admin; listar: público |
| cocheService | `crearCoche`, `obtenerCoche(id)`, `buscarCoches(filtros)`, `actualizarCoche(id, cambios)`, `eliminarCoche(id)` | escribir: admin; leer: público |
| fotoService | `listarFotos(cocheId)`, `anadirFoto(cocheId, datos)`, `eliminarFoto(id)` | escribir: admin; leer: público |
| citaService | `solicitarCita`, `listarMisCitas`, `cancelarCita(id)` | sesión |
| favoritoService | `anadirFavorito(cocheId)`, `listarFavoritos`, `quitarFavorito(cocheId)` | sesión |

Todos los servicios aceptan como último parámetro un cliente Supabase opcional (por defecto, uno compartido). Así los tests pueden actuar como varios usuarios a la vez.

`buscarCoches` admite filtros por marca, combustible, transmisión, rango de precio y texto en el modelo, con orden y paginación (`pagina`, `porPagina`), y devuelve `{ datos, pagina, porPagina, total, totalPaginas }`.

## Estructura de carpetas

```
backend-supabase/
├── docs/                 documentación SDD
│   ├── PROJECT_SPEC.md, ARCHITECTURE.md, AI_SUMMARY.md
│   └── iterations/       01-setup ... 20-cierre (01-08 backend, 09-20 frontend)
├── sql/                  scripts SQL numerados (002, 003, 004, 007, 008) y datos_demo.sql (datos de ejemplo)
├── src/                  backend (práctica 1)
│   ├── lib/              cliente Supabase, errores, usuario actual, resumirCoche
│   ├── validation/       esquemas Zod (usuario, coche, busqueda, foto, cita)
│   └── services/         capa de servicios
├── tests/                tests de integración del backend (Vitest)
│   └── helpers/          clientes Supabase y creación de usuarios de prueba
├── frontend-vue/         frontend principal (práctica 3)
│   ├── src/              servicios/ stores/ views/ components/ composables/ router/ utils/
│   ├── tests/            tests del frontend (Vitest + @vue/test-utils)
│   └── .env.example
├── frontend-react/       implementación parcial con React (login, listado y borrado)
├── .env.example
└── README.md
```
Los números de los scripts SQL coinciden con los de la iteración. Las iteraciones 01, 05 y 06 no necesitan SQL; las del frontend (09-20) tampoco. `datos_demo.sql` no es un script de esquema: carga datos de ejemplo y se puede repetir.

## Convenciones

- Tablas y columnas en español, `snake_case`, sin tildes ni `ñ` (`anio`).
- Los servicios reciben y devuelven objetos con los mismos nombres que las columnas.
- Los servicios devuelven datos o lanzan un `Error` con un mensaje claro en español. Los códigos de Postgres se traducen en `src/lib/errores.js` (`42501` → "No autorizado", `23505`, `23503`, `23514`, `23P01`).
- Cuando la RLS impide una operación sin dar error (0 filas afectadas), el servicio lo detecta y lanza el error.

## Decisiones de diseño

- **Supabase online desde la web en vez de local con CLI:** más simple de configurar; el esquema se mantiene reproducible con los scripts de `sql/`.
- **Sin sedes:** el solapamiento de citas se controla por coche.
- **Cita de duración fija (30 min):** `fin` se calcula en el servicio y un `CHECK` lo verifica.
- **El solapamiento lo garantiza la BD** con una restricción de exclusión, para evitar condiciones de carrera entre dos usuarios simultáneos.
- **Perfiles privados** y **catálogo público de lectura.**
- **Cancelar es el "borrado" de una cita**, para conservar el histórico.
- **Borrado en cascada:** al eliminar un coche se eliminan sus fotos, citas y favoritos; al eliminar un usuario, sus perfil, citas y favoritos.
- **Foto principal:** el servicio desmarca la anterior antes de insertar la nueva; el índice único protege la BD. No es una transacción.
- **Mismo mensaje para "no encontrado" y "sin permisos"** al editar o borrar, para no revelar si un id existe a quien no es admin.
- **`resumirCoche`** (`src/lib/resumirCoche.js`) se comparte entre `buscarCoches` y `listarFavoritos` para obtener la foto principal.
- **Pendiente / fuera de alcance:** que un administrador confirme o gestione citas, subida de ficheros a Storage, interfaz para citas y favoritos.
