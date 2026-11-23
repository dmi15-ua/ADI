# Concesionario de vehículos

Aplicación web para un concesionario de compraventa de vehículos (ADI, UA).

- **Práctica 1 — backend** con **Supabase** (Postgres + Auth + RLS) y una **capa de servicios** en JavaScript (`src/`).
- **Práctica 3 — frontend** en **Vue 3** (`frontend-vue/`) conectado a ese backend, y una **implementación parcial con React** (`frontend-react/`).

> El segundo backend de la práctica 1 (Node + Express) es un proyecto independiente (`backend-express`), con su propio repositorio y documentación. El frontend se conecta solo al backend de Supabase.

## Contenido del repositorio

```
├── src/ tests/ sql/        backend de la práctica 1 (servicios, tests de integración y scripts SQL)
├── frontend-vue/           frontend principal en Vue (práctica 3)
├── frontend-react/         implementación parcial con React: login, listado y borrado
├── docs/                   documentación SDD: PROJECT_SPEC, ARCHITECTURE, AI_SUMMARY e iterations/
└── README.md
```

## Requisitos

- Node.js 20.19 o superior (se ha desarrollado con Node 22).
- Una cuenta gratuita en [supabase.com](https://supabase.com).

## 1. Preparar el backend (Supabase)

1. **Crea un proyecto en Supabase** (se recomienda uno exclusivo: los tests del backend crean y borran datos).
2. **Desactiva la confirmación de email:** *Authentication → Sign In / Providers → Email → Confirm email* (si no, el registro no inicia sesión).
3. **Copia las claves** de *Project Settings → API Keys*: la URL del proyecto, la clave `anon` (o *publishable*) y la `service_role` (o *secret*, solo la usan los tests del backend).
4. **Crea el esquema:** en *SQL Editor → New query*, pega y ejecuta **en este orden** el contenido de:
   1. `sql/002_perfil.sql`
   2. `sql/003_coches.sql`
   3. `sql/004_indices_busqueda.sql`
   4. `sql/007_citas.sql`
   5. `sql/008_favoritos.sql`

   Los scripts no se pueden repetir sobre la misma base de datos. Para empezar de cero, crea un proyecto nuevo o borra las tablas y los tipos.
5. **Carga los datos de ejemplo** (opcional pero recomendable): ejecuta `sql/datos_demo.sql`. Crea 5 marcas, 14 coches y sus fotos, y se puede repetir sin duplicar nada. Ver [Datos de ejemplo](#datos-de-ejemplo).

## 2. Frontend en Vue (`frontend-vue/`)

```bash
cd frontend-vue
npm install
cp .env.example .env      # rellena VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY
npm run dev               # http://localhost:5173
```

Las dos variables salen de *Project Settings → API Keys*: **la URL del proyecto y la clave pública** (`anon`/`publishable`). **Nunca pongas la `service_role` en el frontend**: llega al navegador de cualquiera. El archivo `.env` está en `.gitignore`; `.env.example` es la plantilla sin credenciales.

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm test` | Tests automáticos (Vitest + @vue/test-utils) |
| `npm run build` | Compilación de producción en `dist/` (el aviso de tamaño del paquete es solo informativo) |
| `npm run preview` | Sirve la compilación de producción |

### Qué se puede hacer

| Quién | Qué puede hacer |
|---|---|
| **Visitante** | Ver el catálogo (listado paginado), buscar y filtrar, ver el detalle y la galería de fotos, registrarse e iniciar sesión. |
| **Cliente** (con sesión) | Lo mismo, mostrando su nombre y pudiendo cerrar sesión. No ve ninguna acción de administración. |
| **Administrador** | Además: crear, editar y eliminar coches (con confirmación) y añadir o eliminar sus fotos. |

La interfaz oculta las acciones a quien no puede hacerlas, pero **la autorización real la aplica Supabase (RLS)**: aunque alguien se saltara la interfaz, la base de datos rechazaría la operación.

Rutas: `/` (listado y búsqueda), `/coches/:id` (detalle), `/coches/nuevo` y `/coches/:id/editar` (solo administradores), `/login`, `/registro`.

## 3. Frontend parcial con React (`frontend-react/`)

Proyecto separado que implementa **login, listado paginado y borrado** con React, contra el mismo backend, reutilizando la capa de servicios.

```bash
cd frontend-react
npm install
cp .env.example .env      # las mismas dos variables que en frontend-vue
npm run dev               # http://localhost:5174
npm test
```

Su propio [README](frontend-react/README.md) explica la organización y las diferencias con Vue (componentes y gestión del estado).

## Usuarios de prueba y datos de ejemplo

### Datos de ejemplo

`sql/datos_demo.sql` crea marcas (Seat, Renault, Volkswagen, Toyota, Tesla), **14 coches** y 27 fotos:

- 13 coches disponibles → el listado tiene **2 páginas** (9 + 4).
- Un coche **sin fotos** (Renault Clio) para ver el marcador «Sin foto».
- Un coche **no disponible** (Seat Ateca) que no aparece en el listado.
- Combustibles, transmisiones y precios variados (de 10.900 € a 38.900 €) para probar los filtros.

Las fotos son imágenes de marcador de posición de `placehold.co`: hace falta internet para verlas (si no cargan, la aplicación muestra un aviso en su lugar).

### Usuarios

Los usuarios los crea Supabase Auth. Hay dos formas:

**A. Desde la propia aplicación** (más simple): abre `/registro` y crea dos cuentas, por ejemplo

| Email | Contraseña | Será |
|---|---|---|
| `admin@concesionario.test` | `Admin1234!` | administrador |
| `cliente@concesionario.test` | `Cliente1234!` | cliente |

**B. Desde Supabase:** *Authentication → Users → Add user → Create new user* (marcando *Auto Confirm User*).

Toda cuenta nueva es **cliente**. **Nadie puede hacerse administrador desde la aplicación**: hay que promoverla en el *SQL Editor*:

```sql
update public.perfil
set rol = 'admin'
where id = (select id from auth.users where email = 'admin@concesionario.test');
```

Después de promoverla, cierra sesión y vuelve a entrar para que la interfaz lea el nuevo rol.

## Repetir las pruebas

### Automáticas

| Dónde | Comando | Resultado esperado | Necesita Supabase |
|---|---|---|---|
| Backend (raíz) | `npm install` y `npm test` | todos los tests pasan (usa el `.env` de la raíz, con la `service_role`) | sí (crea y borra datos de prueba) |
| `frontend-vue/` | `npm install` y `npm test` | **25 archivos, 376 tests** | no (servicios simulados) |
| `frontend-react/` | `npm install` y `npm test` | **5 archivos, 79 tests** | no (servicios simulados) |

Si el frontend de React se copia sin la carpeta `frontend-vue`, 11 de sus tests aparecen como «skipped»: son los que comparan las copias de los servicios con las de Vue.

Para el backend de la raíz, crea un `.env` a partir de `.env.example`:

```
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

### Manuales

Cada iteración tiene su TEST_PLAN en `docs/iterations/`. El **recorrido completo con el backend real** (iniciar sesión, crear, localizar en el listado, ver el detalle, editar, eliminar y cerrar sesión) está en `docs/iterations/20-cierre.md`, con los datos y usuarios necesarios.

## Apartados adicionales implementados

| Apartado | Dónde |
|---|---|
| Búsqueda integrada con la paginación | Iteración 17: filtros por modelo, marca, combustible, transmisión y precio, y orden; en el servidor, con la búsqueda en la URL |
| Navegación mediante un router | Iteración 10 (`vue-router`): una ruta por vista, protegida por rol, con atrás/adelante coherente |
| Biblioteca de componentes | Iteración 10 en adelante (PrimeVue): formularios, avisos, confirmaciones, listas y paginador |
| Gestión de un recurso secundario | Iteración 18: fotos del coche (listar, añadir y eliminar, solo administradores) |
| Implementación parcial con otro framework | Iteración 19: `frontend-react/` (login, listado y borrado) |

## Limitaciones conocidas

- **Citas y favoritos** existen en el backend, pero el frontend no tiene interfaz para ellos.
- **Fotos**: son direcciones (URL), no ficheros subidos. Solo se puede marcar la principal al añadir una foto; no se puede cambiar después ni reordenar.
- El listado y la búsqueda muestran **solo coches disponibles**.
- La búsqueda por texto solo mira el **modelo**.
- Si dos administradores editan el mismo coche a la vez, **prevalece el último que guarda**.
- Al editar, solo se avisa de cambios sin guardar al pulsar «Cancelar» (no al cerrar la pestaña o usar «atrás»).
- Los **tests automáticos del frontend usan servicios simulados**; el contacto con el backend real se comprueba con el recorrido manual y con los tests del backend.
- Registro y edición del perfil: el registro existe, **la edición del perfil no** tiene interfaz.
- En `frontend-react` la página actual no se guarda en la URL (no hay router).
- Las fotos de ejemplo necesitan conexión a internet.

## Documentación (metodología SDD)

- `docs/PROJECT_SPEC.md`: qué aplicación se desarrolla y su alcance.
- `docs/ARCHITECTURE.md`: decisiones técnicas, tablas, RLS, servicios y la organización del frontend.
- `docs/AI_SUMMARY.md`: resumen del uso de la IA.
- `docs/iterations/`: una iteración por funcionalidad, cada una con SPEC, PLAN, TEST_PLAN, AI_LOG y commits relacionados.

| Iteración | Contenido |
|---|---|
| 01 | Setup del proyecto y de Supabase |
| 02 | Autenticación y perfil |
| 03 | Marcas y coches: crear y obtener |
| 04 | Búsqueda con filtros y paginación |
| 05 | Editar y eliminar coches |
| 06 | Fotos |
| 07 | Citas |
| 08 | Favoritos |
| 09 | Setup del frontend en Vue |
| 10 | Router y biblioteca de componentes |
| 11 | Sesión: registro, login y logout |
| 12 | Listado paginado de coches |
| 13 | Detalle de un coche |
| 14 | Crear un coche |
| 15 | Editar un coche |
| 16 | Eliminar un coche con confirmación |
| 17 | Búsqueda y filtros integrados con la paginación |
| 18 | Fotos del coche (recurso secundario) |
| 19 | Implementación parcial con React |
| 20 | Cierre: recorrido completo, documentación y datos de ejemplo |

Las iteraciones 01 a 08 son del backend (práctica 1); de la 09 en adelante, del frontend (práctica 3).

## Cómo usar los servicios del backend

```js
import { login } from './src/services/authService.js'
import { buscarCoches, obtenerCoche } from './src/services/cocheService.js'

await login({ email: 'ana@correo.com', password: 'Password123!' })

const { datos, total, totalPaginas } = await buscarCoches({
  combustible: 'electrico',
  precio_max: 30000,
  orden: 'precio_asc',
  pagina: 1,
  porPagina: 10
})

const ficha = await obtenerCoche(datos[0].id) // incluye marca y fotos
```

La lista completa de funciones está en `docs/ARCHITECTURE.md`. El frontend usa una copia de esta capa en `frontend-vue/src/servicios`.
