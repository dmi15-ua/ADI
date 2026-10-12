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
| `npm test` con `.env` correcto | Todos los tests pasan | OK |
| `npm test` sin `.env` | Falla indicando variables ausentes | No probado manualmente |

### Tests automáticos

- `tests/setup.test.js`:
  - las variables de entorno están definidas;
  - el endpoint de salud de Auth (`/auth/v1/health`) responde 200;
  - el cliente anónimo puede llamar a `auth.getSession()` sin error.

**Resultado de la ejecución:** `npm test`: 1 archivo, 3 tests pasados (variables de entorno, `/auth/v1/health` responde 200 y `auth.getSession()` sin error). Antes del resultado correcto hubo dos errores de entorno (ver Correcciones manuales).

## AI_LOG

### Herramienta usada

- Herramienta: Claude Code
- Modelo: Claude Sonnet 5.5 (sesión en la nube)
- Tipo: asistente de código en la nube; yo ejecuto los scripts SQL, los tests y los commits en mi equipo

### Uso realizado

Se usó la IA para:

- proponer la estructura de iteraciones y el contenido de `PROJECT_SPEC` y `ARCHITECTURE`;
- redactar la SPEC, el PLAN y el TEST_PLAN de esta iteración;
- generar el cliente de Supabase, la configuración de Vitest y los tests de conexión;
- explicarme los pasos para crear el proyecto en la web de Supabase.

### Prompt importante 1

Concesionario Web de Vehículos [descripción de la app, funcionalidades y responsabilidades del backend] + «esta es la app que quiero crear». Resultado: la IA relacionó la app con los requisitos de la práctica y propuso recurso principal (coche), recursos secundarios y preguntas abiertas.

### Prompt importante 2

«quiero hacerlo todo desde la web, arregla los scripts y dame los pasos para hacerlo desde la web». Resultado: se regeneraron `01-setup.md` y `ARCHITECTURE.md` sin la CLI de Supabase.

### Decisiones del estudiante

Se aceptó:

- Modelo de datos con `perfil`, `marca`, `coche`, `foto_coche`, `cita` y `favorito`, con valores por defecto: sin sedes, cita de 30 minutos y rol admin.
- Vitest, Zod y `supabase-js` como pila del cliente de servicios.
- Ejecutar los tests en serie porque comparten la base de datos.

Se rechazó o descartó:

- La primera propuesta (Supabase en local con la CLI y Docker): la rechacé y elegí un proyecto de Supabase online gestionado desde su web, sin CLI. El esquema se versiona en `sql/` y se ejecuta en el SQL Editor.

### Correcciones manuales

- Mi versión de Node era antigua y Vitest fallaba con «`node:util` no exporta `styleText`». El primer arreglo propuesto (`npm i -D vitest@2`) falló con «Cannot find native binding» (`rolldown`). Lo resolví instalando Node 22 con nvm, borrando `node_modules` y `package-lock.json` y reinstalando.
- Creé yo el repositorio git (`git init -b main`, remoto de GitHub) y el primer commit; la IA no me había avisado de ese paso al principio.

## COMMITS RELACIONADOS

- `HASH` - Iteración 01: setup del proyecto, cliente Supabase y tests de conexión
