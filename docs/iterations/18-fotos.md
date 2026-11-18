# Iteración 18 - Fotos del coche (recurso secundario)

## SPEC

### Objetivo

Completar el recurso secundario del backend, las fotos de un coche (`foto_coche`): que un administrador pueda añadir y eliminar fotos desde la ficha del coche, viendo el resultado al instante, sin recargar la página.

### Requisitos funcionales

- **Quién puede.** Solo los administradores ven la sección «Gestionar fotos», en la ficha del coche, debajo de la galería. Los usuarios normales y los visitantes siguen viendo la galería, sin esa sección. La autorización real la aplica Supabase (RLS).
- **Qué es una foto.** Una dirección (URL) de una imagen ya publicada en internet, que empieza por `http://` o `https://`. No se suben archivos: el backend de la práctica 1 guarda direcciones, no imágenes.
- **Lista.** La sección enseña una fila por foto, con su miniatura, su dirección y la etiqueta «Principal» en la que lo es. Si el coche no tiene fotos, lo dice.
- **Añadir una foto.**
  - Se escribe la dirección y, opcionalmente, se marca «Usar como foto principal»; al pulsar «Añadir foto» se guarda al final de las demás.
  - Si se marca como principal, la que lo era deja de serlo.
  - Si la dirección está vacía o no es válida, se explica junto al campo y no se llama al servidor; el aviso desaparece al seguir escribiendo.
  - Al terminar sale «Foto añadida», el formulario se vacía y la foto aparece en la lista y en la galería, sin recargar y sin que la ficha vuelva a mostrar el indicador de carga.
  - Si el servidor lo rechaza (sin permiso, sin conexión…), se muestra el mensaje en español junto al formulario, que conserva la dirección escrita para reintentar.
- **Eliminar una foto.** Cada fila tiene un botón de eliminar que pide confirmación («¿Seguro que quieres eliminar esta foto? Esta acción no se puede deshacer»; si es la principal, avisa de que pasará a mostrarse la primera que quede). Al confirmar sale «Foto eliminada» y desaparece de la lista y de la galería. Si falla, aparece un aviso con la causa y la foto sigue donde estaba.
- **Durante una operación**, los botones de añadir y de eliminar se desactivan para evitar envíos repetidos.
- **Imágenes que no cargan.** Una dirección válida puede no ser una imagen o estar caída. En la lista del administrador esa fila lo indica («No se puede mostrar esta imagen») para poder eliminarla; en la galería, la foto grande y la miniatura se sustituyen por un marcador en lugar del icono de imagen rota.
- **Si la foto se guarda pero falla el refresco de la ficha**, se avisa («Cambio guardado… Recarga la página para verlo»), sin dar a entender que el cambio falló.
- **Reflejo en otras pantallas.** La tarjeta del listado muestra la foto principal (o la primera si ninguna lo es) la próxima vez que se abre el listado.

### Requisitos técnicos

- La tienda `coches` incorpora `anadirFoto` y `eliminarFoto` (que usan el servicio `fotoService` de la práctica 1) y `refrescarDetalle`, que vuelve a pedir el coche abierto sin vaciarlo ni marcar la carga, y descarta el resultado si mientras tanto se abrió otro coche.
- El composable `useGestionFotos` reúne la lógica (estado de «añadiendo» y «eliminando», errores, confirmación, avisos y refresco) para no engordar la pantalla.
- `GestorFotos` (componente) no habla con el servidor: emite `anadir` y `eliminar`, y valida la dirección con el esquema `fotoSchema` del backend.
- `GaleriaFotos` gestiona las imágenes que fallan al cargar.
- `DetalleView` coloca el gestor debajo de la galería solo para administradores.

### Fuera de alcance

- Subir archivos de imagen (Supabase Storage).
- Cambiar la foto principal de una foto ya existente o reordenar las fotos (el servicio de la práctica 1 solo permite hacerlo al añadir una foto).
- Editar la dirección de una foto (se elimina y se añade otra).
- Comprobar en el servidor que la dirección es realmente una imagen.

## PLAN

1. Ampliar la tienda `src/stores/coches.js` (`anadirFoto`, `eliminarFoto`, `refrescarDetalle`).
2. Crear `src/composables/useGestionFotos.js`.
3. Crear `src/components/GestorFotos.vue`.
4. Integrarlo en `src/views/DetalleView.vue` (solo administradores).
5. Hacer que `src/components/GaleriaFotos.vue` gestione las imágenes que no cargan.
6. Crear `tests/gestor-fotos.test.js` y `tests/fotos.test.js`; ampliar `tests/galeria.test.js` y `tests/coches.store.test.js`.
7. Ejecutar `npm test` y `npm run build`.
8. Probar a mano con el Supabase real.

Decisiones: se refresca la ficha sin vaciarla (`refrescarDetalle`) en lugar de recargarla del todo, para que no parpadee el indicador de carga ni se pierda la posición; las fotos son direcciones (como en el backend), no archivos; la lógica de añadir y eliminar va en un composable y el componente solo emite eventos; las imágenes que no cargan se marcan, porque una dirección válida no garantiza que sea una imagen; se confirma antes de eliminar, igual que con los coches; el formulario se vacía solo si la foto se añadió sin error, para no perder lo escrito.
Riesgo: se pueden añadir direcciones de terceros que dejen de existir con el tiempo; el marcador de imagen rota lo hace visible. No hay forma de cambiar la foto principal sin añadir otra, por limitación del servicio de la práctica 1.

## TEST_PLAN

| Caso | Resultado esperado | Resultado obtenido |
|---|---|---|
| Quién ve «Gestionar fotos»: administrador / usuario normal / visitante | Solo el administrador; los demás siguen viendo la galería |  |
| Lista de fotos del coche | Una fila por foto con su miniatura, dirección y «Principal» en la que lo es; sin fotos, lo dice |  |
| Añadir una foto con una dirección válida | Sale «Foto añadida», el formulario se vacía y la foto aparece en la lista y en la galería sin recargar |  |
| Añadir como foto principal | La anterior principal deja de serlo |  |
| Dirección vacía o no válida | Se explica junto al campo y no se llama al servidor; el aviso desaparece al escribir |  |
| Mientras se añade o se elimina | Los botones están desactivados |  |
| El servidor rechaza al añadir | Mensaje en español junto al formulario y se conserva lo escrito |  |
| Reintentar tras un error | Se añade y desaparece el error |  |
| Eliminar: cancelar el diálogo | No se elimina nada |  |
| Eliminar: confirmar | Sale «Foto eliminada» y desaparece de la lista y de la galería |  |
| Eliminar la principal | El aviso lo dice y la galería pasa a mostrar la primera que quede |  |
| Fallo al eliminar o foto ya borrada por otra persona | Aviso con la causa y la foto sigue donde estaba |  |
| La foto se guarda pero falla el refresco de la ficha | Aviso «Cambio guardado… Recarga la página», sin mensaje de error de la operación |  |
| La ficha no parpadea al refrescar | Mientras se refresca, la ficha sigue visible y sin indicador de carga |  |
| Imagen que no carga | Lista, galería y miniatura muestran un marcador en lugar de la imagen rota; en la lista se puede eliminar |  |
| Tienda: `refrescarDetalle`, `anadirFoto`, `eliminarFoto` | Refresca sin vaciar, descarta si se abrió otro coche, no hace nada sin coche abierto; delegan en el servicio |  |
| `npm run build` | Sin errores |  |
| Comprobación manual con el Supabase real: añadir una foto (una URL de imagen pública) | Aparece en la lista y en la galería |  |
| Comprobación manual: añadir como principal | Solo una foto queda como principal en la tabla `foto_coche` |  |
| Comprobación manual: eliminar una foto | Desaparece de la ficha y de la tabla |  |
| Comprobación manual: la tarjeta del listado | Muestra la foto principal (o la primera) tras cambiarla |  |
| Comprobación manual: una dirección que no es una imagen | Se ve el marcador y se puede eliminar |  |
| Comprobación manual: usuario normal y visitante | No ven la sección de gestión |  |
| Comprobación manual: permisos en Supabase (RLS) | Con un usuario normal, intentar insertar o borrar en `foto_coche` desde la consola lo rechaza la base de datos |  |

### Tests automáticos

- `tests/gestor-fotos.test.js` (13 tests): el componente (lista, eliminar, imágenes rotas, añadir, validación, vaciado y errores).
- `tests/fotos.test.js` (18 tests): la gestión completa con la aplicación (quién la ve, añadir, principal, errores, refresco, eliminar).
- `tests/galeria.test.js` (10 tests): se añaden las imágenes que no cargan.
- `tests/coches.store.test.js` (35 tests): se añaden `refrescarDetalle` y las fotos.
- Los tests de las iteraciones anteriores no cambian.
- Comprobación de que los tests detectan fallos: al vaciar la ficha durante el refresco y al quitar el refresco tras añadir o eliminar, fallan los tests correspondientes.
- Además, la IA comprobó el flujo en un navegador real contra un Supabase simulado con imágenes reales (añadir, principal, imagen rota, rechazo por permisos, eliminar con confirmación, tarjeta del listado) y mejoró la galería tras ver una captura con el icono de imagen rota; esa prueba no sustituye a la comprobación manual con tu Supabase real.

**Resultado de la ejecución:** (pendiente: se rellena después de ejecutar `npm test` —deben salir 25 archivos y 376 tests—, `npm run build` y las comprobaciones manuales).

## AI_LOG

### Herramienta usada

- Herramienta: Claude Code
- Modelo: Claude Sonnet 5.5 (sesión en la nube)
- Tipo: asistente de código en la nube

### Uso realizado

Se usó la IA para:

- proponer el diseño (fotos como direcciones, refresco de la ficha sin vaciarla, composable con la lógica y componente que solo emite eventos);
- **redactar la SPEC, el PLAN y el TEST_PLAN** (por petición del estudiante, que los revisa y los hace suyos);
- generar el código y los tests;
- comprobar el flujo en un navegador real contra un Supabase simulado y añadir el marcador de imagen rota en la galería tras ver una captura.

### Prompt importante 1

«vamos con la iteración 18». Resultado: gestión de las fotos del coche (añadir y eliminar) para administradores, con refresco inmediato de la ficha.

### Decisiones de diseño propuestas por la IA

[REVISAR: confirma que las aceptas o anota las que cambiaste]

- Las fotos son direcciones (URL), como en el backend.
- La ficha se refresca sin vaciarla.
- La lógica va en un composable y el componente solo emite eventos.
- Las imágenes que no cargan se marcan en la lista y en la galería.
- Confirmación antes de eliminar.
- El formulario se vacía solo si la foto se añadió sin error.

### Se rechazó o descartó

- Subir archivos con Supabase Storage: descartado, el backend de la práctica 1 guarda direcciones.
- Recargar la ficha completa tras cada cambio: descartado, parpadea y vacía la pantalla.
- Una pantalla aparte para gestionar fotos: descartado, es más cómodo hacerlo en la ficha del coche.

### Correcciones manuales

- [COMPLETAR: cambios que hayas hecho tú, o «Ninguna»]

## COMMITS RELACIONADOS

- `HASH_18` - (se rellena al hacer el commit)
