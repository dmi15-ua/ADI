# AI_SUMMARY

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
