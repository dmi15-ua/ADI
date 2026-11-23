# AI_SUMMARY

La primera parte resume el uso de la IA en la práctica 1 (backend); la segunda, en la práctica 3 (frontend).

# Práctica 1: backend

## Herramientas usadas

- Claude Code (modelo Claude Sonnet 5.5), en una sesión en la nube.

## Uso principal

- Propuesta de la estructura de iteraciones, del modelo de datos y de las decisiones de diseño (RLS, solapamiento de citas, paginación).
- Redacción de borradores de SPEC, PLAN y TEST_PLAN de cada iteración.
- Generación de los scripts SQL, de los servicios, de las validaciones con Zod y de los tests de cada iteración.
- Diagnóstico de errores a partir de la salida de `npm test`.
- Borradores de ARCHITECTURE, README y AI_SUMMARY.

## Partes hechas o modificadas manualmente

- Creación del proyecto en Supabase desde su web: claves, desactivar la confirmación de email, ejecutar cada script SQL en el SQL Editor y comprobar las tablas.
- Creación de la carpeta del proyecto y del repositorio git, y los commits de cada iteración.
- Actualización de Node (con nvm) para poder ejecutar Vitest.
- Elección de la temática, del modelo de datos y del tipo de backend.
- Ejecución de todos los tests contra la base de datos real (la IA no podía ejecutarlos).

## Problemas encontrados con la IA

- Propuso inicialmente Supabase local con la CLI y Docker; se decidió usar Supabase online desde la web y hubo que rehacer los documentos y los pasos.
- No avisó al principio de que había que hacer `git init` en las carpetas creadas a mano ni de enlazar el repositorio.
- Recomendó una solución para el error de versión de Node (instalar `vitest@2`) que no funcionó; hubo que actualizar Node.
- Iteración 03: un test insertaba fotos en lote sin indicar `es_principal` en todas las filas. `supabase-js` pone a `null` las columnas ausentes en un lote, el insert fallaba sin avisar y fallaban dos tests. Se corrigió añadiendo el campo y comprobando el error en la preparación del test.
- Escribió código y tests que no pudo ejecutar contra la base de datos real, así que los errores solo se detectaron al lanzarlos manualmente.

## Revisión del código generado

- Se ha revisado el código de cada iteración con `git diff` antes de hacer commit.

## Valoración personal

Personalmente pensaba que iba a trabajar mas con la web de Supabase pero al final solola he usado para credenciales e introducir sql.

# Práctica 3: frontend

## Herramientas usadas

- Claude Code (modelo Claude Sonnet 5.5), en una sesión en la nube, durante toda la práctica (iteraciones 09 a 20).

## Uso principal

- **Redacción de la SPEC, el PLAN y el TEST_PLAN de cada iteración** (09 a 20) a petición del estudiante, que los revisaba antes de pedir el código. 
- Propuesta de la arquitectura del frontend (capas, tiendas de Pinia, rutas, composables) y de las decisiones de diseño de cada iteración.
- Generación del código del frontend en Vue, del proyecto parcial en React y de los tests automáticos.
- Comprobación de cada iteración en un navegador real (Chromium con Playwright) contra un Supabase **simulado**, y corrección de lo que fallaba.
- Pruebas «de mutación» manuales: romper el código a propósito para comprobar que los tests lo detectan.
- Borradores de los documentos de las iteraciones, del README, de ARCHITECTURE, PROJECT_SPEC y de los datos de ejemplo (validados contra un Postgres local).

## Partes hechas o modificadas manualmente

- Creación de Supabase, documentacion, pruebas en localhost.

## Problemas encontrados con la IA

- **Interfaz ilegible en modo oscuro:** PrimeVue seguía el modo oscuro del sistema y dejaba textos blancos sobre fondo claro. Lo detectó el estudiante con una captura; se fijó el tema claro.
- **La IA no pudo probar contra el Supabase real:** todo lo comprobó con servicios simulados (tests) y con un Supabase simulado en un navegador. Los errores propios del backend real solo pueden detectarse con las comprobaciones manuales del estudiante.
- **Limitaciones de jsdom:** los tests fallaban porque jsdom no implementa `matchMedia` ni `ResizeObserver`; hubo que simularlos en `tests/preparar-entorno.js`.
- **Errores en los tests escritos por la IA:** por ejemplo, Zod devuelve `descripcion: undefined` en lugar de omitir la clave, un aviso de error desaparecía por el orden en que se ejecutan los observadores, y el historial en memoria del router no guarda la página anterior. Se corrigieron al ejecutarlos.
- **Tests que pasaban «sin probar nada»:** para evitarlo, en varias iteraciones se rompió el código a propósito y se comprobó que los tests fallaban.
- **Instrucciones de carpeta:** al principio hubo confusión con la carpeta donde descomprimir los archivos (se creó una carpeta `frontend-vue` anidada) y con el directorio desde donde ejecutar los comandos de npm.

## Revisión del código generado

- La IA aportó en cada iteración la lista de decisiones de diseño y de lo que descartó, recogida en el AI_LOG de cada iteración (`docs/iterations/`).


