# ARCHITECTURE

## Backend

- **Supabase (BaaS)** en un proyecto online (supabase.com), gestionado desde su web, sin Supabase CLI ni Docker.
- **Autenticación:** Supabase Auth con tokens **JWT**. Supabase Auth genera el JWT al hacer login (`sesion.access_token`); `supabase-js` lo guarda y lo envía en la cabecera `Authorization: Bearer` en cada petición. En la BD, `auth.uid()` devuelve el id del usuario del token y las políticas RLS lo usan.
- **Base de datos:** Postgres. El esquema se aplica manualmente pegando scripts SQL numerados en el **SQL Editor** de Supabase. Los scripts están versionados en `sql/` y se ejecutan en orden.
- **Seguridad:** Row Level Security (RLS) en todas las tablas, más permisos de columna donde hace falta (por ejemplo, un usuario solo puede editar `nombre` y `telefono` de su perfil).
- **Capa de servicios** en JavaScript (ES modules) en `src/services/`. Aísla la API de Supabase: el futuro frontend solo conocerá estas funciones.
- **Validación en dos niveles:** Zod en los servicios (mensajes claros) y `CHECK`, claves foráneas, restricciones únicas y de exclusión en la BD (red de seguridad frente a quien use el cliente directamente).

## Frontend

- Todavía no desarrollado (queda fuera de esta práctica).

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
│   └── iterations/       01-setup ... 08-favoritos
├── sql/                  scripts SQL numerados (002, 003, 004, 007, 008)
├── src/
│   ├── lib/              cliente Supabase, errores, usuario actual, resumirCoche
│   ├── validation/       esquemas Zod (usuario, coche, busqueda, foto, cita)
│   └── services/         capa de servicios
├── tests/                tests de integración (Vitest)
│   └── helpers/          clientes Supabase y creación de usuarios de prueba
├── .env.example
└── README.md
```
Los números de los scripts SQL coinciden con los de la iteración. Las iteraciones 01, 05 y 06 no necesitan SQL.

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
- **Pendiente / fuera de alcance:** que un administrador confirme o gestione citas, subida de ficheros a Storage, frontend.
