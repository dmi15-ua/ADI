# Iteración 09 - Setup del frontend en Vue

## SPEC

### Objetivo

Dejar preparado el proyecto del frontend dentro del mismo repositorio que el backend, de modo que arranque, se conecte a Supabase a través de la capa de servicios de la práctica 1 y tenga una suite de tests ejecutable con un solo comando. Al terminar, aún no hay pantallas de negocio: la aplicación solo muestra el título «Concesionario».

### Requisitos funcionales

- **Ubicación y arranque.** El frontend vive en la carpeta `frontend-vue/` del repositorio de la práctica 1. Se arranca con `npm run dev` (desde esa carpeta) y muestra el título «Concesionario» en el navegador.
- **Construcción y pruebas.** `npm run build` genera el frontend sin errores y `npm test` ejecuta los tests y pasan.
- **Configuración de Supabase.** La URL y la clave se leen de las variables `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`, definidas en un archivo `.env` que no se versiona. Existe un `.env.example` sin valores.
- **Qué clave se usa.** En el navegador solo se usa la clave pública (`anon` / *publishable*). La `service_role` no puede aparecer en el frontend, porque se salta las políticas de seguridad de la base de datos y cualquier persona podría leerla.
- **Si falta la configuración.** Si no están definidas las dos variables, la aplicación lanza un error con un mensaje claro que dice qué falta y cómo solucionarlo, en lugar de fallar de forma confusa.
- **Acceso al backend.** Los componentes no llamarán directamente a Supabase ni conocerán sus detalles. Usarán la capa de servicios de la práctica 1 (autenticación, perfil, marcas, coches y fotos, con sus validaciones), copiada en `frontend-vue/src/servicios/` y adaptada al navegador.

### Requisitos técnicos

- Vue 3 con Vite y Pinia. También se instalan las dependencias que usarán las iteraciones siguientes: Vue Router, PrimeVue y su tema. Para los tests: Vitest, Vue Test Utils y jsdom.
- La capa de servicios se **copia** (no se importa de `../src`), porque la del backend usa `dotenv` y `process.env`, que no funcionan en el navegador. Las diferencias con la original son:
  - el cliente de Supabase lee `import.meta.env` en lugar de `process.env`;
  - `authService` añade `obtenerSesion`, para restaurar la sesión guardada al recargar la página;
  - un mensaje de validación de la marca del coche es más claro para el formulario.
- Los tests de los servicios usan un cliente de Supabase falso, sin red ni base de datos.

### Fuera de alcance

- Pantallas, rutas, tiendas de estado y biblioteca de componentes (iteraciones siguientes).
- Cambios en el backend.

## PLAN

1. Crear `frontend-vue/` con `package.json` e instalar las dependencias.
2. Crear `vite.config.js` (plugin de Vue y entorno `jsdom` para los tests), `index.html`, `.env.example` y `.gitignore`.
3. Copiar la capa de servicios del backend a `frontend-vue/src/servicios/` (`lib`, `validation` y `services`) y adaptar el cliente de Supabase.
4. Añadir `obtenerSesion` a `authService.js`.
5. Crear `src/main.js` (con Pinia) y un `App.vue` mínimo.
6. Crear `tests/helpers.js` (cliente falso) y `tests/setup.test.js`.
7. Ejecutar `npm test` y `npm run build`, y comprobar a mano que `npm run dev` muestra el título.

Decisiones: el frontend vive en una carpeta del mismo repositorio para continuar la documentación SDD; los servicios se copian porque el original no funciona en el navegador; el cliente falso permite probar sin conexión.
Riesgo: la copia puede quedar desfasada si se cambia el backend; se anota como limitación conocida.

## TEST_PLAN

| Caso | Resultado esperado | Resultado obtenido |
|---|---|---|
| `npm run dev` | Muestra el título «Concesionario» en el navegador | OK |
| `npm run build` | Genera `dist/` sin errores | OK |
| La aplicación se monta con Pinia | Muestra el título | OK |
| Faltan las variables de entorno | Error con un mensaje claro | OK |
| Variables definidas | Se crea el cliente y se reutiliza | OK |
| `buscarCoches` con un cliente falso | Devuelve la página, el total y la foto principal, y pide el rango correcto | OK |
| `buscarCoches` con filtros no válidos | Falla sin llamar a la base de datos | OK |
| `listarMarcas` | Devuelve las marcas | OK |
| `obtenerSesion` | `null` sin sesión; el usuario si la hay | OK |
| `login` con un email no válido | Falla sin llamar a Supabase | OK |

### Tests automáticos

- `tests/setup.test.js` (8 tests): aplicación, configuración de Supabase y capa de servicios, con un cliente de Supabase falso.

**Resultado de la ejecución:** `npm test`: 1 archivo, 8 tests pasados. `npm run build`: correcto, sin errores. `npm run dev` con el `.env` configurado: la aplicación arranca y muestra el título «Concesionario».

## AI_LOG

### Herramienta usada

- Herramienta: Claude Code
- Modelo: Claude Sonnet 5.5 (sesión en la nube)
- Tipo: asistente de código en la nube

### Uso realizado

Se usó la IA para:

- proponer la estructura del frontend y las decisiones técnicas;
- **redactar la SPEC, el PLAN y el TEST_PLAN** (por petición del estudiante, que los revisa y los hace suyos);
- copiar y adaptar la capa de servicios de la práctica 1 al navegador;
- generar la configuración del proyecto y los tests.

### Prompt importante 1

«quiero que empecemos a trabajar en la nueva práctica, añadiendo las nuevas funcionalidades al código que ya tenemos» y «quiero que las spec las hagas tú, y prefiero la opción de copiarla ya que es más simple». Resultado: esta SPEC, con los servicios copiados.

### Decisiones de diseño propuestas por la IA

Revisadas por el estudiante, que las acepta todas.

- Vue 3 + Vite, con Pinia para el estado compartido.
- Carpeta `frontend-vue/` dentro del repositorio de la práctica 1.
- Servicios copiados y adaptados al navegador, con las claves en variables `VITE_*`.
- Tests con un cliente de Supabase falso.

### Se rechazó o descartó

- Importar los servicios directamente de `../src`: descartado por depender de `dotenv` y de módulos del backend (decisión del estudiante).

### Correcciones manuales

- Creé el archivo `.env` de `frontend-vue/` con la URL y la clave pública (`anon`) de mi proyecto de Supabase, copiándolas del panel.
- Ninguna.

## COMMITS RELACIONADOS

- `486dbd0` - Iteración 09: setup del frontend en Vue
