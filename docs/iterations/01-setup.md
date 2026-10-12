# Iteración 01 - Setup del proyecto y proyecto Supabase online

## SPEC

### Objetivo

Dejar el proyecto preparado para desarrollar y probar el backend: proyecto Supabase online creado desde su web, cliente configurado y suite de tests ejecutable con un solo comando.

### Requisitos

- El proyecto es un paquete Node con ES modules (`"type": "module"`).
- Existe un proyecto en supabase.com, gestionado desde su web (sin Supabase CLI).
- Las claves se leen de `.env` (no versionado) y existe un `.env.example` sin valores reales.
- Existe `src/lib/supabaseClient.js` que exporta una función para crear el cliente de Supabase.
- `npm test` ejecuta Vitest y pasa.
- En Auth está desactivada la confirmación de email, para poder registrar usuarios de prueba.
- El esquema de BD se aplicará con scripts SQL numerados en la carpeta `sql/` (vacía en esta iteración).
- Los tests se ejecutan en serie (comparten la misma BD).

### Requisitos técnicos

- Dependencias: `@supabase/supabase-js`, `zod`, `dotenv`. Dev: `vitest`.
- `.gitignore` incluye `node_modules` y `.env`.
- La `service_role key` solo se usa en `tests/`, nunca en `src/`.

### Fuera de alcance

- Tablas y políticas RLS.
- Servicios de usuarios, coches, citas o favoritos.

## PLAN

1. Crear el proyecto en supabase.com y anotar URL, anon key y service_role key.
2. Desactivar "Confirm email" en Authentication.
3. `npm init -y`, añadir `"type": "module"` e instalar dependencias.
4. Crear `.env`, `.env.example` y la carpeta `sql/`.
5. Crear `src/lib/supabaseClient.js`.
6. Crear `tests/helpers/clientes.js` (cliente anónimo y cliente admin).
7. Crear `vitest.config.js` con ejecución en serie.
8. Crear `tests/setup.test.js`.
9. Añadir el script `test` a `package.json`.

Decisión: se usa Supabase online desde la web, sin CLI. El esquema se versiona como scripts SQL en `sql/` y se pega en el SQL Editor, para que sea reproducible.

Riesgos: límites de Auth en el plan gratuito; los tests dejan datos en una BD compartida, por lo que deberán limpiar lo que crean; el proyecto gratuito se pausa tras inactividad.

## TEST_PLAN

| Caso | Resultado esperado | Resultado obtenido |
|---|---|---|
| `npm test` con `.env` correcto | Todos los tests pasan | |
| `npm test` sin `.env` | Falla indicando variables ausentes | |

### Tests automáticos

- `tests/setup.test.js`:
  - las variables de entorno están definidas;
  - el endpoint de salud de Auth (`/auth/v1/health`) responde 200;
  - el cliente anónimo puede llamar a `auth.getSession()` sin error.

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
