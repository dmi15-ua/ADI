# ARCHITECTURE

## Backend

- Supabase (BaaS) en un proyecto online (supabase.com), gestionado desde su web.
- Autenticación: Supabase Auth (JWT).
- Base de datos: Postgres. El esquema se aplica manualmente pegando scripts SQL en el SQL Editor de Supabase; los scripts están versionados en `sql/` (001_..., 002_...) y se ejecutan en orden.
- Seguridad: Row Level Security (RLS) en todas las tablas.
- Capa de servicios en JavaScript (ES modules) que aísla el API de Supabase. El cliente futuro solo conoce estas funciones.

## Tests

- Vitest contra el proyecto Supabase online (tests de integración sobre la capa de servicios). Los tests limpian los datos que crean. Se desactiva la confirmación de email en Auth.
- Validación de entrada con Zod en la capa de servicios.

## Tablas

### perfil
id (PK, FK auth.users), nombre, telefono, rol ('cliente' | 'admin'), created_at

### marca
id (PK), nombre (único), pais

### coche
id (PK), marca_id (FK), modelo, precio, km, anio, combustible (enum: gasolina, diesel, electrico), transmision (enum: manual, automatico), potencia_cv, descripcion, equipamiento (jsonb), disponible (bool), created_at
CHECK: precio > 0, km >= 0, potencia_cv > 0, anio entre 1950 y año actual + 1

### foto_coche
id (PK), coche_id (FK, on delete cascade), url, orden, es_principal

### cita
id (PK), usuario_id (FK), coche_id (FK), inicio (timestamptz), fin (inicio + 30 min), estado (enum: pendiente, confirmada, cancelada), nota_cliente
EXCLUDE USING gist (coche_id WITH =, tstzrange(inicio, fin) WITH &&) WHERE (estado <> 'cancelada')

### favorito
usuario_id, coche_id, fecha_guardado. PK (usuario_id, coche_id)

## Capa de servicios (src/services)

- authService: registrar, login, logout
- perfilService: obtenerPerfil, actualizarPerfil
- cocheService: crearCoche, buscarCoches(filtros, pagina), obtenerCoche(id) con fotos, actualizarCoche, eliminarCoche
- fotoService: listarFotos, anadirFoto, eliminarFoto
- citaService: solicitarCita, listarMisCitas, cancelarCita
- favoritoService: anadirFavorito, listarFavoritos, quitarFavorito

## Estructura de carpetas

- src/services: capa de servicios
- src/lib/supabaseClient.js: cliente Supabase
- src/validation: esquemas Zod
- sql: scripts SQL numerados (esquema, RLS y datos de prueba)
- tests: tests de integración
- docs: documentación SDD

## Convenciones

- Nombres de tablas y columnas en español, snake_case, sin tildes ni ñ.
- Los servicios devuelven datos o lanzan un Error con mensaje claro.

## Decisiones

- Sin sede: el solape se evita por coche.
- Duración de cita fija de 30 min.
- Las fotos se guardan como URL, sin Storage.
