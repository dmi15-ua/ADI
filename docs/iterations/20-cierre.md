# Iteración 20 - Cierre: recorrido completo, documentación y datos de ejemplo

## SPEC

### Objetivo

Cerrar la práctica: dejar la documentación coherente con lo implementado, que cualquier persona pueda **instalar, ejecutar y repetir las pruebas desde cero**, disponer de **un usuario de prueba y datos de ejemplo**, y comprobar con el **backend real** un recorrido completo de la aplicación.

### Requisitos

- **README.md** en la raíz del proyecto, con instrucciones para:
  - preparar el backend (proyecto de Supabase, desactivar la confirmación de email, claves, ejecutar los scripts SQL en orden);
  - instalar y ejecutar el frontend en Vue (y el de React), con las variables de configuración en un **archivo de ejemplo** (`.env.example`) **sin credenciales**, y la advertencia de no usar nunca la `service_role` en el frontend;
  - repetir las pruebas automáticas (comando y resultado esperado de cada proyecto) y las manuales;
  - disponer de **usuarios de prueba** (cómo crearlos y cómo promover a un administrador) y de **datos de ejemplo**;
  - la relación de **apartados adicionales** implementados (búsqueda, router, biblioteca de componentes, recurso secundario, React) y las **limitaciones conocidas**.
- **Datos de ejemplo** en `sql/datos_demo.sql`: 5 marcas, 14 coches y 27 fotos, que se puede ejecutar varias veces sin duplicar datos. Con ellos el listado tiene 13 coches disponibles (2 páginas de 9), un coche sin fotos y uno no disponible. Las fotos son imágenes de marcador de posición (`placehold.co`).
- **Usuarios de prueba**: se crean desde `/registro` (o desde el panel de Supabase) y el administrador se promueve con una sentencia SQL documentada, porque nadie puede hacerse administrador desde la aplicación.
- **Documentación SDD actualizada**:
  - `PROJECT_SPEC.md`: añade el alcance del frontend (qué puede hacer cada tipo de usuario, qué no incluye) y ajusta lo que quedaba «fuera de alcance».
  - `ARCHITECTURE.md`: la organización del frontend: vistas y componentes, estado compartido, acceso al backend, navegación, sesión y autorización, estados y errores, tests y decisiones.
  - `AI_SUMMARY.md`: el uso de la IA en esta práctica (con las partes que debe completar el estudiante marcadas).
  - `frontend-vue/README.md`: la organización de `src/`.
- **Recorrido completo con el backend real** (ver el TEST_PLAN): iniciar sesión, crear un coche, localizarlo en el listado, consultar su detalle, editarlo, gestionar sus fotos, eliminarlo y cerrar sesión; además, las restricciones de acceso. Se indican los datos y usuarios necesarios (un administrador, un cliente y los datos de ejemplo) y los resultados obtenidos.
- **Entrega**: un `.zip` con el código fuente, los archivos de configuración y dependencias, el directorio `.git`, la documentación y el README; **sin** `node_modules`, `dist`, archivos `.env` ni credenciales privadas.
- **Criterio de aceptación**: quien solo tenga el `.zip` y una cuenta de Supabase puede, siguiendo el README, llegar a la aplicación funcionando con datos y usuarios de prueba, y repetir las pruebas.

### Fuera de alcance

- Cambios en el código de la aplicación (esta iteración solo toca documentación, datos y comprobaciones).
- Pruebas automáticas contra el backend real desde el frontend (se hacen a mano, con el recorrido completo).
- Interfaz para citas y favoritos.

## PLAN

1. Escribir `sql/datos_demo.sql` y comprobarlo contra Postgres con el esquema de las iteraciones 02 y 03 (resultado de la comprobación y segunda ejecución sin duplicados).
2. Escribir el `README.md` de la raíz y `frontend-vue/README.md`.
3. Actualizar `docs/PROJECT_SPEC.md`, completar `docs/ARCHITECTURE.md` y ampliar `docs/AI_SUMMARY.md`.
4. Preparar el TEST_PLAN del recorrido completo con el backend real y las comprobaciones de entrega.
5. El estudiante prepara Supabase desde cero siguiendo **solo el README** (esto comprueba que el README es suficiente), ejecuta el recorrido y rellena los resultados.
6. Ejecutar todas las pruebas automáticas (backend, `frontend-vue`, `frontend-react`) y los builds.
7. Preparar el `.zip` de entrega y comprobar su contenido.

Decisiones: los datos de ejemplo son un script SQL (no una funcionalidad de la aplicación) y se pueden repetir, para poder volver a un estado conocido; los usuarios se crean con el registro de la propia aplicación, que además comprueba esa pantalla, y solo la promoción a administrador se hace por SQL; el recorrido completo se hace a mano porque los tests automáticos del frontend usan servicios simulados; el README sigue el orden en que lo necesita quien empieza de cero (backend, frontend, datos y usuarios, pruebas); las limitaciones se listan sin adornos, para que sea fácil saber qué esperar.
Riesgo: las fotos de ejemplo dependen de un servicio externo; si no está disponible, la aplicación muestra el marcador de imagen que no carga (iteración 18), pero los datos siguen siendo válidos.

## TEST_PLAN

| Caso | Resultado esperado | Resultado obtenido |
|---|---|---|
| PREP-1. Crear un proyecto de Supabase nuevo, desactivar la confirmación de email y ejecutar `sql/002`, `003`, `004`, `007` y `008` en orden, siguiendo solo el README | Los scripts se ejecutan sin errores |  |
| PREP-2. Ejecutar `sql/datos_demo.sql` | La consulta final devuelve 5 marcas, 14 coches, 13 disponibles y 27 fotos |  |
| PREP-3. Ejecutar `sql/datos_demo.sql` por segunda vez | Las mismas cifras: no se duplica nada |  |
| PREP-4. Registrar `admin@concesionario.test` y `cliente@concesionario.test` desde `/registro` y promover al primero con la sentencia SQL del README | Ambos inician sesión; `perfil.rol` es `admin` y `cliente` respectivamente |  |
| PREP-5. Crear `frontend-vue/.env` a partir de `.env.example`, `npm install` y `npm run dev` | La aplicación arranca en http://localhost:5173 y muestra el listado |  |
| R01. Abrir `/` sin sesión | 9 tarjetas, «Mostrando 1-9 de 13 coches», un coche muestra «Sin foto» (Renault Clio) y no aparece Seat Ateca; sin botones de «Nuevo coche», «Editar» ni «Eliminar» |  |
| R02. Ir a la página 2 | 4 coches, «Mostrando 10-13 de 13 coches» y `?pagina=2` en la URL |  |
| R03. Iniciar sesión con una contraseña incorrecta | Mensaje «Email o contraseña incorrectos» y se sigue en `/login` |  |
| R04. Iniciar sesión como administrador | Vuelve al listado; la cabecera muestra el nombre, «Admin» y «Cerrar sesión»; aparecen «Nuevo coche», «Editar» y «Eliminar» |  |
| R05. «Nuevo coche»: enviar el formulario vacío | Error en cada campo obligatorio junto a su campo y no se crea nada |  |
| R06. Crear un coche válido (Seat, modelo «Prueba Frontend», 12.345 €, 10.000 km, 2020, gasolina, manual, 100 CV, equipamiento «GPS, Bluetooth») | Aviso «Coche creado» y se muestra su ficha |  |
| R07. Localizarlo en el listado buscando el modelo «Prueba Frontend» | Aparece una sola tarjeta y la URL lleva el parámetro `texto` con lo escrito |  |
| R08. Abrir su detalle desde la tarjeta | La ficha muestra los datos introducidos (precio, kilómetros, año, potencia, combustible, transmisión y equipamiento) |  |
| R09. «Editar»: cambiar el precio a 11.500 € y borrar la descripción; guardar | Formulario con los datos actuales; aviso «Coche actualizado»; la ficha muestra 11.500 € y «Sin descripción» |  |
| R10. «Editar» → cambiar algo → «Cancelar» | Pide confirmación; «Seguir editando» conserva lo escrito y «Descartar cambios» vuelve sin guardar (comprobar que el coche no cambió) |  |
| R11. En la ficha, añadir una foto con la dirección `https://placehold.co/800x500/png?text=Prueba` marcada como principal | Aviso «Foto añadida»; aparece en la lista y en la galería como principal; en la tabla `foto_coche` solo hay una foto principal para ese coche |  |
| R12. Eliminar esa foto (cancelar y luego confirmar) | Cancelar no hace nada; al confirmar sale «Foto eliminada» y desaparece de la ficha y de la tabla |  |
| R13. Volver al listado | La tarjeta del coche muestra 11.500 € sin haber recargado la página manualmente |  |
| R14. Eliminar el coche (cancelar y luego confirmar) | Cancelar no hace nada; al confirmar sale «Coche eliminado», se vuelve al listado y buscar «Prueba Frontend» da «No se han encontrado coches con esos filtros.»; el coche ya no está en la tabla `coche` |  |
| R15. Cerrar sesión | La cabecera vuelve a «Iniciar sesión» y desaparecen las acciones de administrador |  |
| R16. Abrir `/coches/nuevo` escribiendo la dirección, sin sesión | Lleva a `/login`, con el parámetro `redirect` apuntando a `/coches/nuevo` (tras entrar como administrador volvería a esa pantalla) |  |
| R17. Iniciar sesión como `cliente@concesionario.test` | Se ve su nombre sin etiqueta «Admin» y ninguna acción de administración |  |
| R18. Con el cliente, abrir `/coches/nuevo` y `/coches/1/editar` por la dirección | Aparece «No tienes permiso» en ambos casos |  |
| R19. Recargar la página con la sesión iniciada | La sesión se mantiene sin pedir las credenciales |  |
| R20. Permisos reales (RLS): ejecutar `npm test` en la raíz del proyecto | Todos los tests del backend pasan, incluidos los que comprueban que un cliente no puede crear, editar ni eliminar coches ni fotos |  |
| AUT-1. `npm test` en `frontend-vue` | 25 archivos, 376 tests |  |
| AUT-2. `npm test` en `frontend-react` | 5 archivos, 79 tests |  |
| AUT-3. `npm run build` en `frontend-vue` y en `frontend-react` | Sin errores (el aviso de tamaño del paquete es informativo) |  |
| DOC-1. Los documentos coinciden con la aplicación | `PROJECT_SPEC.md`, `ARCHITECTURE.md` y el README describen lo que se ha comprobado en el recorrido |  |
| DOC-2. Todas las iteraciones (01-20) tienen SPEC, PLAN, TEST_PLAN con resultados, AI_LOG y commits relacionados rellenados | Sin marcas `[REVISAR]`, `[COMPLETAR]` ni `HASH_` pendientes |  |
| ENT-1. Comprobar el contenido del `.zip` de entrega | Incluye el código, los archivos de configuración y dependencias, `docs/`, `README.md` y `.git`; no incluye `node_modules`, `dist` ni ningún `.env` |  |
| ENT-2. Descomprimir el `.zip` en una carpeta nueva y seguir el README | `npm install` y `npm test` funcionan en `frontend-vue` y `frontend-react` |  |

### Tests automáticos

- No se añaden tests automáticos en esta iteración: no cambia el código de la aplicación.
- Las pruebas automáticas de las iteraciones anteriores se vuelven a ejecutar al final (casos AUT-1 a AUT-3).
- `sql/datos_demo.sql` se comprobó contra un PostgreSQL 16 local con los scripts `002_perfil.sql` y `003_coches.sql` (con roles y el esquema `auth` simulados): la primera ejecución da 5 marcas, 14 coches (13 disponibles) y 27 fotos; la segunda ejecución da las mismas cifras; ningún coche tiene más de una foto principal; solo el Renault Clio no tiene fotos y solo el Seat Ateca está no disponible; un visitante (`anon`) puede leer pero no insertar; y la sentencia de promoción a administrador del README funciona. **Esto no sustituye a ejecutarlo en tu Supabase** (caso PREP-2 y PREP-3).
- El recorrido completo (R01 a R20) es **manual** y debe hacerse con tu proyecto real de Supabase. Para repetirlo hacen falta: el proyecto con los scripts y los datos de ejemplo, un usuario administrador (`admin@concesionario.test`), un usuario cliente (`cliente@concesionario.test`) y el frontend en marcha (`npm run dev`).

**Resultado de la ejecución:** (pendiente: se rellena al ejecutar los casos PREP, R, AUT, DOC y ENT con tu Supabase real. Anota en cada caso lo que has obtenido y, si algo falla, qué hiciste).

## AI_LOG

### Herramienta usada

- Herramienta: Claude Code
- Modelo: Claude Sonnet 5.5 (sesión en la nube)
- Tipo: asistente de código en la nube

### Uso realizado

Se usó la IA para:

- proponer el contenido y el orden del README y de la documentación de cierre;
- **redactar la SPEC, el PLAN y el TEST_PLAN** (por petición del estudiante, que los revisa y los hace suyos);
- escribir el README, los datos de ejemplo, y las actualizaciones de PROJECT_SPEC, ARCHITECTURE y AI_SUMMARY, comprobando los datos de ejemplo contra un Postgres local;
- preparar el recorrido completo con el backend real y la lista de comprobaciones de entrega.

### Prompt importante 1

«vamos con la iteración 20». Resultado: README, datos de ejemplo, documentación de cierre y recorrido completo con el backend real.

### Decisiones de diseño propuestas por la IA

[REVISAR: confirma que las aceptas o anota las que cambiaste]

- Datos de ejemplo como script SQL idempotente.
- Usuarios creados con el registro de la aplicación; solo la promoción a administrador por SQL.
- Recorrido completo manual, porque los tests del frontend usan servicios simulados.
- README ordenado como lo necesita quien empieza de cero.
- Limitaciones conocidas listadas sin adornos.

### Se rechazó o descartó

- Dar un usuario administrador ya creado con una contraseña en el repositorio: descartado, no se deben guardar credenciales; se documenta cómo crearlo.
- Automatizar el recorrido contra el backend real desde el frontend: descartado por el coste y porque los tests del backend ya cubren la RLS.
- Un único README mezclando el backend y el frontend sin separar: descartado, se separa por pasos (backend, frontend, datos y usuarios, pruebas).

### Correcciones manuales

- [COMPLETAR: cambios que hayas hecho tú, o «Ninguna»]

## COMMITS RELACIONADOS

- `HASH_20` - (se rellena al hacer el commit)
