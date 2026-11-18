# Iteración 16 - Eliminar un coche con confirmación

## SPEC

### Objetivo

Permitir a un administrador eliminar un coche del catálogo, desde el listado y desde la ficha, siempre tras una confirmación explícita, y dejar la interfaz en un estado coherente después (sin el coche y sin páginas vacías).

### Requisitos funcionales

- **Quién puede.** Solo los administradores ven el botón «Eliminar» (en cada tarjeta del listado y en la ficha, junto a «Editar»). Los usuarios normales y los visitantes no lo ven. La autorización real la aplica Supabase (RLS): aunque alguien lo intentara por otra vía, la base de datos lo rechaza.
- **Confirmación.** Al pulsar «Eliminar» no se borra nada: se abre un diálogo «Eliminar coche» con el mensaje «¿Seguro que quieres eliminar {marca} {modelo}? Esta acción no se puede deshacer y también se eliminarán sus fotos.» y los botones «Cancelar» y «Eliminar» (este último en rojo). Si se cancela o se cierra el diálogo, no ocurre nada.
- **Eliminación.** Al confirmar se elimina el coche y sus fotos (en cascada, en la base de datos) y aparece el aviso «Coche eliminado». Mientras se elimina, el botón de ese coche muestra que está trabajando y todos los botones de eliminar quedan desactivados, para evitar peticiones repetidas.
- **Desde el listado.** El coche desaparece sin recargar la página: se vuelve a pedir la página actual al servidor, de modo que los demás coches suben de sitio y el total («Mostrando 1-9 de N coches») se actualiza. Casos especiales:
  - si se elimina el único coche de la última página, se pasa a la página anterior (la URL se actualiza);
  - si se elimina el último coche del catálogo, aparece «No hay coches disponibles en este momento.»;
  - si no es el último de su página, se queda en la misma página.
- **Desde la ficha.** Tras eliminar se lleva al listado, y la ficha eliminada **no** queda en el historial: con «atrás» no se vuelve a una página de un coche que ya no existe.
- **Errores.** Si falla (sin permiso, sin conexión, el coche ya no existe porque lo borró otra persona…) aparece un aviso «No se pudo eliminar el coche» con la causa en español, el coche sigue donde estaba y se puede volver a intentar. En la ficha, el usuario se queda en ella.

### Requisitos técnicos

- La tienda `coches` incorpora la acción `eliminar(id)`, que usa el servicio `eliminarCoche` de la práctica 1, y `eliminandoId`, el coche que se está borrando en ese momento.
- El composable `useEliminarCoche` reúne la lógica común (pedir confirmación con `useConfirmacion`, eliminar, avisar con `useNotificaciones`) y devuelve si el coche se eliminó; cada pantalla decide qué hacer después. Lo usan `CocheCard` y `DetalleView`.
- `CocheCard` emite el evento `eliminado`; `ListadoView` lo recoge y vuelve a cargar la página actual con la misma regla de «página que ya no existe» que ya usaba al cambiar de página.
- `DetalleView` usa `router.replace` (no `push`) para ir al listado.

### Fuera de alcance

- Eliminar varios coches a la vez o deshacer la eliminación (la SPEC dice que no se puede deshacer).
- Eliminar fotos sueltas (iteración 18).
- Eliminar desde la pantalla de edición.
- Borrado lógico (marcar como eliminado en lugar de borrar).

## PLAN

1. Añadir `eliminar` y `eliminandoId` a `src/stores/coches.js`.
2. Crear `src/composables/useEliminarCoche.js`.
3. Añadir el botón «Eliminar» a `src/components/CocheCard.vue` (con el evento `eliminado`) y a `src/views/DetalleView.vue`.
4. En `src/views/ListadoView.vue`, extraer `cargarPagina` y recargar la página actual al recibir `eliminado`.
5. Crear `tests/eliminar-coche.test.js`; ampliar `tests/coches.store.test.js`; añadir `eliminarCoche` a los mocks de los servicios de los tests existentes.
6. Ejecutar `npm test` y `npm run build`.
7. Probar a mano con el Supabase real.

Decisiones: la confirmación es obligatoria y avisa de que no se puede deshacer y de que se borran las fotos; se vuelve a pedir la página al servidor en lugar de quitar la tarjeta a mano, porque así el total, la paginación y la última página quedan siempre correctos; en la ficha se usa `replace` para que «atrás» no lleve a una ficha inexistente; mientras hay un borrado en curso se desactivan todos los botones de eliminar para evitar dobles envíos; la lógica se comparte en un composable para no duplicarla entre listado y ficha.
Riesgo: el borrado es definitivo; por eso la confirmación nombra el coche. Si otra persona borra el mismo coche a la vez, el servidor responde «no encontrado» y se muestra ese mensaje.

## TEST_PLAN

| Caso | Resultado esperado | Resultado obtenido |
|---|---|---|
| Quién ve «Eliminar»: administrador / usuario normal / visitante | Solo el administrador, en el listado y en la ficha |  |
| Pulsar «Eliminar» | Aparece el diálogo con el nombre del coche y el aviso de que no se puede deshacer; todavía no se borra |  |
| Cancelar el diálogo | No se elimina nada ni se vuelve a pedir el listado |  |
| Confirmar desde el listado | Aviso «Coche eliminado»; el coche desaparece y el total se actualiza sin recargar |  |
| Mientras se elimina | El botón indica que trabaja y los botones de eliminar están desactivados |  |
| El servidor rechaza por permisos | Aviso con «No tienes permiso para realizar esta acción»; el coche sigue en el listado |  |
| Sin conexión y reintento | Aviso de conexión; al reintentar se elimina |  |
| El coche ya no existe (lo borró otra persona) | Se muestra el mensaje del servidor |  |
| Eliminar el único coche de la última página | Pasa a la página anterior y la URL se actualiza |  |
| Eliminar el último coche del catálogo | Aparece «No hay coches disponibles en este momento.» |  |
| Eliminar un coche que no es el último de su página | Se queda en la misma página |  |
| Confirmar desde la ficha | Aviso, vuelve al listado y el coche ya no está |  |
| «Atrás» tras eliminar desde la ficha | No vuelve a la ficha eliminada |  |
| Cancelar o fallar desde la ficha | Se queda en la ficha (y explica el error si lo hubo) |  |
| Tienda: `eliminar` y `eliminandoId` | Llama al servicio con el id, marca el coche en curso, lo libera siempre y propaga los errores |  |
| `npm run build` | Sin errores |  |
| Comprobación manual con el Supabase real: eliminar un coche como administrador | Desaparece del listado y de la base de datos |  |
| Comprobación manual: el coche tenía fotos | Sus filas de `foto_coche` también desaparecen (borrado en cascada) |  |
| Comprobación manual: eliminar el último coche de la última página | Pasa a la página anterior |  |
| Comprobación manual: usuario normal y visitante | No ven el botón «Eliminar» |  |
| Comprobación manual: permisos en Supabase (RLS) | Con un usuario normal, intentar borrar un coche (por ejemplo desde la consola) lo rechaza la base de datos y el coche sigue ahí |  |

### Tests automáticos

- `tests/eliminar-coche.test.js` (17 tests): quién ve el botón, eliminar desde el listado (confirmación, cancelar, confirmar, estado «eliminando», errores), el listado tras eliminar (última página, catálogo vacío, misma página) y eliminar desde la ficha (incluido que «atrás» no vuelve a la ficha eliminada), con la aplicación completa.
- `tests/coches.store.test.js` (22 tests): se añade la eliminación.
- Los tests de las iteraciones anteriores se adaptan a los cambios (`eliminarCoche` en los mocks) sin variar su comportamiento.
- Además, la IA comprobó el flujo en un navegador real contra un Supabase simulado (confirmación, cancelar, rechazo por permisos, eliminación, paso a la página anterior, eliminar desde la ficha y «atrás»); esa prueba no sustituye a la comprobación manual con tu Supabase real.
- Comprobación de que el test del historial detecta el fallo: al cambiar `replace` por `push` en la ficha, ese test falla.

**Resultado de la ejecución:** (pendiente: se rellena después de ejecutar `npm test` —deben salir 20 archivos y 280 tests—, `npm run build` y las comprobaciones manuales).

## AI_LOG

### Herramienta usada

- Herramienta: Claude Code
- Modelo: Claude Sonnet 5.5 (sesión en la nube)
- Tipo: asistente de código en la nube

### Uso realizado

Se usó la IA para:

- proponer el diseño (composable compartido, confirmación nombrando el coche, recarga de la página actual en lugar de quitar la tarjeta a mano, `replace` en la ficha);
- **redactar la SPEC, el PLAN y el TEST_PLAN** (por petición del estudiante, que los revisa y los hace suyos);
- generar el código y los tests;
- comprobar el flujo en un navegador real contra un Supabase simulado.

### Prompt importante 1

«vamos con la iteración 16». Resultado: eliminación de coches con confirmación, desde el listado y la ficha, con manejo de errores y de la paginación.

### Decisiones de diseño propuestas por la IA

[REVISAR: confirma que las aceptas o anota las que cambiaste]

- Confirmación obligatoria con el nombre del coche y el aviso de que no se puede deshacer.
- Volver a pedir la página actual tras eliminar, en lugar de quitar la tarjeta a mano.
- En la ficha, volver al listado con `replace`.
- Desactivar todos los botones de eliminar mientras hay un borrado en curso.
- Lógica compartida en el composable `useEliminarCoche`.

### Se rechazó o descartó

- Quitar la tarjeta del listado a mano: descartado, porque descuadra el total y la última página.
- Borrado lógico (marcar como eliminado): descartado, el backend de la práctica 1 borra de verdad.
- Ofrecer «deshacer»: descartado, el borrado es definitivo en la base de datos.

### Correcciones manuales

- [COMPLETAR: cambios que hayas hecho tú, o «Ninguna»]

## COMMITS RELACIONADOS

- `HASH_16` - (se rellena al hacer el commit)
