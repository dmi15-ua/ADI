# Iteración 15 - Editar un coche

## SPEC

### Objetivo

Permitir a un administrador modificar los datos de un coche ya existente, reutilizando el formulario de la iteración 14, enviando al servidor solo lo que ha cambiado y reflejando el resultado en la ficha y en el listado sin recargar la página.

### Requisitos funcionales

- **Acceso.** La pantalla `/coches/:id/editar` solo es para administradores (protección de la iteración 11): un visitante es llevado al login y, tras entrar, vuelve a la edición; un usuario normal ve «No tienes permiso». La autorización real la sigue aplicando Supabase.
- **Cómo se llega.** Los administradores ven un botón «Editar» en la ficha del coche y en cada tarjeta del listado. Los usuarios normales y los visitantes no lo ven.
- **Carga de datos.** Al abrir la pantalla se piden los datos actuales del coche y con ellos se rellena el formulario. Mientras cargan se muestra un indicador; si falla la carga se muestra el error con un botón «Reintentar»; si el coche no existe se muestra «Coche no encontrado» con un enlace al listado. En ninguno de estos casos aparece el formulario.
- **Formulario.** Es el mismo de la iteración 14 (mismos campos, mismas reglas de validación y mismos mensajes), con el título «Editar {marca} {modelo}» y el botón «Guardar cambios». Se puede cambiar cualquier campo, incluida la marca y la disponibilidad del coche.
- **Guardar.** Solo se envía al servidor lo que ha cambiado:
  - Si no se ha cambiado nada, se avisa («No hay cambios que guardar») y no se llama al servidor.
  - Si hay cambios válidos, se guardan, aparece el aviso «Coche actualizado» y se lleva a la ficha del coche, que muestra los datos nuevos.
  - Se puede **borrar** la descripción o el equipamiento que tenía el coche (dejando el campo vacío), cosa que al crear no hacía falta.
  - Un campo vacío y un campo sin valor se consideran iguales (por ejemplo, un coche sin descripción y una descripción vacía no son un cambio).
  - Mientras se guarda, los botones están desactivados.
- **Errores del servidor.** Igual que al crear: mensaje comprensible dentro del formulario («No tienes permiso para realizar esta acción», «No se pudo conectar con el servidor», o el mensaje del backend, como «Coche no encontrado o sin permisos» cuando el coche ya no existe o Supabase lo impide), y el formulario conserva lo escrito para corregirlo y reintentar.
- **Cancelar.**
  - Sin cambios, vuelve de inmediato a donde se estaba: a la ficha o al listado (en la misma página). Si se entró directamente a la dirección de edición, va a la ficha del coche.
  - Con cambios sin guardar, pide confirmación («Cambios sin guardar… ¿Quieres descartarlos?», con «Seguir editando» y «Descartar cambios»). Si se sigue editando se conserva lo escrito; si se descarta, se vuelve sin guardar nada. Si el usuario deshace lo que había escrito, no cuenta como cambio.
- **Reflejo del cambio.** La ficha y el listado muestran el coche modificado la próxima vez que se abren, sin recargar la página manualmente.

### Requisitos técnicos

- La función `diferencias(original, nuevos)` (`src/utils/cambios.js`) calcula los campos modificados; trata `null`, `undefined` y el texto vacío como iguales y compara las listas por contenido y orden.
- `FormularioCoche` incorpora la propiedad `modo` («crear» o «editar»). Al editar, la descripción y el equipamiento vacíos se envían (como `''` y `[]`) para poder borrarlos; al crear, siguen sin enviarse. El botón «Cancelar» emite además los datos actuales del formulario, para poder saber si hay cambios sin guardar.
- La tienda `coches` incorpora la acción `actualizar`, que usa el servicio `actualizarCoche` de la práctica 1 (que ya valida un subconjunto de campos y exige al menos uno).
- `FormularioCocheView` sirve para crear y para editar: si recibe un `id` carga el coche y edita; si no, crea. Usa `useConfirmacion` para el aviso de cambios sin guardar.
- `DetalleView` y `CocheCard` muestran el botón «Editar» solo si la tienda de sesión indica que el usuario es administrador.

### Fuera de alcance

- Eliminar un coche (iteración 16), buscar (17) y gestionar fotos (18).
- Detectar que otra persona ha modificado el mismo coche mientras se edita (el último cambio guardado prevalece).
- Avisar de cambios sin guardar al cerrar la pestaña o usar los botones del navegador; solo se avisa al pulsar «Cancelar».

## PLAN

1. Crear `src/utils/cambios.js` con `diferencias`.
2. Añadir la acción `actualizar` a `src/stores/coches.js`.
3. Ampliar `src/components/FormularioCoche.vue`: propiedad `modo` y evento `cancelar` con los datos actuales.
4. Reescribir `src/views/FormularioCocheView.vue` para crear y editar (carga del coche, diferencias, guardado, confirmación al cancelar y vuelta al sitio de origen).
5. Añadir el botón «Editar» (solo administradores) en `src/views/DetalleView.vue` y `src/components/CocheCard.vue`.
6. Crear `tests/cambios.test.js` y `tests/editar-coche.test.js`; ampliar `tests/formulario-coche.test.js` y `tests/coches.store.test.js`; añadir `actualizarCoche` a los mocks de los servicios en los tests existentes.
7. Ejecutar `npm test` y `npm run build`.
8. Probar a mano con el Supabase real.

Decisiones: se reutiliza el formulario y la pantalla de la iteración 14, para no duplicar validaciones; se envían solo los campos modificados (menos datos, y no se pisan campos que no se han tocado); se pide confirmación solo si hay cambios reales; tras guardar se lleva a la ficha, que confirma el resultado; al cancelar se vuelve al sitio de origen (ficha o listado) con el historial del navegador; el botón de editar se oculta a quien no es administrador, pero la seguridad la da Supabase (RLS), no la interfaz.
Riesgo: si dos administradores editan a la vez el mismo coche, prevalece el último guardado; se asume en esta práctica.

## TEST_PLAN

| Caso | Resultado esperado | Resultado obtenido |
|---|---|---|
| Acceso: administrador / usuario normal / visitante | Formulario con los datos actuales / «No tienes permiso» / login con vuelta a la edición |  |
| Datos cargados en el formulario | Marca, modelo, precio, descripción, equipamiento… con los valores del coche; título «Editar Marca Modelo» |  |
| Coche inexistente | «Coche no encontrado» con enlace al listado, sin formulario |  |
| Error al cargar el coche | Mensaje con «Reintentar», que vuelve a pedirlo |  |
| Cambiar modelo y precio y guardar | Se envían solo esos dos campos, aparece «Coche actualizado» y se ve la ficha con los datos nuevos |  |
| Marcar el coche como no disponible | Se envía solo `disponible: false` |  |
| Borrar descripción y equipamiento | Se envían vacíos y el coche queda sin ellos |  |
| Guardar sin cambiar nada | Aviso «No hay cambios que guardar» y no se llama al servidor |  |
| Datos no válidos (precio 0) | Mensaje en el campo y no se llama al servidor |  |
| Mientras guarda | Botones desactivados |  |
| Cambio reflejado | La ficha y el listado muestran el coche modificado sin recargar |  |
| El servidor rechaza por permisos | Mensaje comprensible y el formulario conserva lo escrito |  |
| Sin conexión y reintento | Mensaje y, al reintentar, se guarda |  |
| El coche ya no existe al guardar | Se muestra el mensaje del backend |  |
| Cancelar sin cambios | Vuelve sin preguntar (ficha, o listado en su misma página; ficha si se entró directamente) |  |
| Cancelar con cambios | Pide confirmación; «Seguir editando» conserva lo escrito y «Descartar cambios» vuelve sin guardar |  |
| Escribir y volver a dejar el valor original, y cancelar | No cuenta como cambio: no pregunta |  |
| Botón «Editar» en la ficha y en el listado | Lo ve un administrador y lleva a la edición; no lo ven usuarios normales ni visitantes |  |
| Función `diferencias` | Solo los campos cambiados; vacío = sin valor; listas por contenido; 0 y false no son vacío |  |
| Tienda: acción `actualizar` | Llama al servicio con id y cambios; propaga los errores |  |
| `npm run build` | Sin errores |  |
| Comprobación manual con el Supabase real: editar un coche como administrador | El cambio se guarda y se ve en la ficha y en el listado |  |
| Comprobación manual: borrar la descripción de un coche | El coche queda sin descripción |  |
| Comprobación manual: usuario normal y visitante | No ven el botón «Editar» ni pueden abrir la dirección de edición |  |
| Comprobación manual: permisos en Supabase (RLS) | Con un usuario normal, intentar modificar un coche (por ejemplo desde la consola) lo rechaza la base de datos |  |

### Tests automáticos

- `tests/cambios.test.js` (8 tests): cálculo de las diferencias.
- `tests/editar-coche.test.js` (25 tests): acceso, carga, guardado, errores del servidor, cancelar y botones «Editar», con la aplicación completa.
- `tests/formulario-coche.test.js` (33 tests): se añade el modo editar.
- `tests/coches.store.test.js` (19 tests): se añade la actualización.
- Los tests de las iteraciones anteriores se adaptan a los cambios (`actualizarCoche` en los mocks) sin variar su comportamiento.
- Además, la IA comprobó el flujo completo en un navegador real contra un Supabase simulado (editar desde el listado, sin cambios, cancelar con confirmación, rechazo por permisos, guardado con solo los campos cambiados, reflejo en ficha y listado y borrado de campos opcionales); esa prueba no sustituye a la comprobación manual con tu Supabase real.

**Resultado de la ejecución:** (pendiente: se rellena después de ejecutar `npm test` —deben salir 19 archivos y 260 tests—, `npm run build` y las comprobaciones manuales).

## AI_LOG

### Herramienta usada

- Herramienta: Claude Code
- Modelo: Claude Sonnet 5.5 (sesión en la nube)
- Tipo: asistente de código en la nube

### Uso realizado

Se usó la IA para:

- proponer el diseño (reutilizar el formulario y la pantalla de la iteración 14, enviar solo las diferencias y confirmar antes de descartar cambios);
- **redactar la SPEC, el PLAN y el TEST_PLAN** (por petición del estudiante, que los revisa y los hace suyos);
- generar el código y los tests;
- comprobar el flujo completo en un navegador real contra un Supabase simulado.

### Prompt importante 1

«vamos con la iteración 15». Resultado: edición de coches para administradores, con envío de solo los campos cambiados y confirmación al cancelar con cambios.

### Decisiones de diseño propuestas por la IA

[REVISAR: confirma que las aceptas o anota las que cambiaste]

- Reutilizar el formulario de la iteración 14 en modo «editar».
- Enviar solo los campos que cambian.
- Pedir confirmación al cancelar únicamente si hay cambios reales.
- Al cancelar, volver al sitio de origen (ficha o listado en su misma página).
- Botón «Editar» visible solo para administradores; la seguridad real es la RLS de Supabase.

### Se rechazó o descartó

- Una pantalla de edición independiente con su propio formulario: descartada, duplicaba la validación.
- Enviar siempre todos los campos: descartado, porque pisaría datos que no se han tocado y no permite saber si hubo cambios.
- Avisar de cambios sin guardar también al cerrar la pestaña o usar «atrás»: queda fuera de alcance por complejidad.

### Correcciones manuales

- [COMPLETAR: cambios que hayas hecho tú, o «Ninguna»]

## COMMITS RELACIONADOS

- `HASH_15` - (se rellena al hacer el commit)
