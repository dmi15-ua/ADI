# Concesionario de vehículos: backend con Supabase

Backend de una aplicación web para un concesionario de compraventa de vehículos. Práctica 1 de ADI. Está implementado sobre **Supabase** y expone una **capa de servicios** en JavaScript (`src/services`) que aísla al futuro frontend de la API de Supabase. Todavía no hay frontend.

## Funcionalidades

- **Usuarios:** registro, login y logout con JWT; ver y editar el perfil propio.
- **Coches (recurso principal):** crear, ver su ficha (con marca y fotos), buscar con filtros y paginación, editar y eliminar. Escribir solo pueden los administradores.
- **Fotos de un coche (recurso secundario):** listar, añadir y eliminar.
- **Citas de prueba de conducción:** solicitar, ver las propias y cancelar, sin solapamientos.
- **Favoritos:** guardar, listar y quitar coches.

## Requisitos

- Node.js 20.19 o superior (se ha desarrollado con Node 22).
- Una cuenta gratuita en [supabase.com](https://supabase.com).

## Puesta en marcha

1. **Crea un proyecto en Supabase** (se recomienda uno exclusivo para esta práctica: los tests crean y borran datos).
2. **Desactiva la confirmación de email:** en *Authentication → Sign In / Providers → Email*, desactiva *Confirm email*.
3. **Copia las claves** de *Project Settings → API Keys*: la URL del proyecto, la clave `anon` (o *publishable*) y la `service_role` (o *secret*).
4. **Crea el archivo `.env`** a partir de `.env.example`:
   ```
   SUPABASE_URL=https://xxxx.supabase.co
   SUPABASE_ANON_KEY=
   SUPABASE_SERVICE_ROLE_KEY=
   ```
   La `service_role` solo se usa en los tests. No la subas a ningún repositorio.
5. **Crea el esquema:** en *SQL Editor → New query*, pega y ejecuta, **en este orden**, el contenido de:
   1. `sql/002_perfil.sql`
   2. `sql/003_coches.sql`
   3. `sql/004_indices_busqueda.sql`
   4. `sql/007_citas.sql`
   5. `sql/008_favoritos.sql`

   Los scripts no se pueden repetir sobre la misma base de datos. Si necesitas empezar de cero, crea un proyecto nuevo o borra las tablas y los tipos antes de volver a ejecutarlos.
6. **Instala las dependencias:**
   ```bash
   npm install
   ```

## Ejecutar los tests

```bash
npm test
```

Los tests de integración usan el proyecto de Supabase configurado en `.env`. Crean usuarios, marcas, coches, citas y favoritos de prueba con nombres únicos y los **borran al terminar**. Se ejecutan en serie. Si se lanzan muchas veces seguidas, Supabase puede aplicar límites de registros por hora.

| Archivo | Qué comprueba |
|---|---|
| `tests/setup.test.js` | Variables de entorno y conexión con Supabase |
| `tests/auth-perfil.test.js` | Registro, login, perfil propio y su protección |
| `tests/coches.test.js` | Marcas, crear coche y ficha de coche |
| `tests/busqueda.test.js` | Filtros, orden y paginación |
| `tests/coches-edicion.test.js` | Editar y eliminar coches |
| `tests/fotos.test.js` | Fotos de un coche |
| `tests/citas.test.js` | Citas, solapamientos y permisos |
| `tests/favoritos.test.js` | Favoritos y permisos |

## Cómo usar los servicios

```js
import { login } from './src/services/authService.js'
import { buscarCoches, obtenerCoche } from './src/services/cocheService.js'
import { solicitarCita } from './src/services/citaService.js'

await login({ email: 'ana@correo.com', password: 'Password123!' })

const { datos, total, totalPaginas } = await buscarCoches({
  combustible: 'electrico',
  precio_max: 30000,
  orden: 'precio_asc',
  pagina: 1,
  porPagina: 10
})

const ficha = await obtenerCoche(datos[0].id) // incluye marca y fotos
await solicitarCita({ coche_id: ficha.id, inicio: '2026-11-20T10:00:00Z' })
```

La lista completa de funciones está en `docs/ARCHITECTURE.md`.

## Administradores

Nadie puede hacerse administrador desde la aplicación. Para crear uno, regístralo y ejecuta en el SQL Editor:

```sql
update public.perfil set rol = 'admin' where id = '<id del usuario>';
```

## Documentación (metodología SDD)

- `docs/PROJECT_SPEC.md`: qué aplicación se desarrolla y qué queda fuera de alcance.
- `docs/ARCHITECTURE.md`: decisiones técnicas, tablas, políticas de acceso y servicios.
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

## Segundo backend

El backend alternativo con Node y Express es un proyecto independiente (`backend-express`), con su propio repositorio y su propia documentación.
