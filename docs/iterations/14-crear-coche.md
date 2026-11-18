# Iteración 14 - Crear un coche

## SPEC

### Objetivo

Permitir a un administrador dar de alta un coche nuevo desde un formulario con validación, mostrando el resultado de la operación y reflejando el nuevo coche en el catálogo sin recargar la página.

### Requisitos funcionales

- **Acceso.** La pantalla `/coches/nuevo` solo es para administradores. Un visitante es llevado al login (y tras entrar vuelve al formulario), y un usuario normal ve «No tienes permiso» (protección de la iteración 11). Se llega desde el botón «Nuevo coche» del listado. La autorización real la sigue aplicando Supabase.
- **Formulario.** Pide:
  - marca (lista desplegable con las marcas del catálogo, cargadas del servidor);
  - modelo (texto de hasta 100 caracteres);
  - precio (en euros, entero entre 0 y 10.000.000), kilometraje (entero), año y potencia en CV (enteros);
  - combustible (Gasolina, Diésel o Eléctrico) y transmisión (Manual o Automático);
  - descripción (opcional, hasta 2000 caracteres, con contador);
  - equipamiento (opcional, escrito separado por comas);
  - un interruptor «Disponible para la venta», activado por defecto.
- **Validación en el cliente.** Antes de llamar al servidor se comprueban los datos con el mismo esquema que usa el backend:
  - todos los campos obligatorios deben tener valor (mensajes como «Selecciona una marca» o «El precio debe ser un número»);
  - precio mayor que 0, kilometraje no negativo, potencia mayor que 0, año entre 1950 y el año siguiente al actual, modelo no vacío ni solo espacios;
  - los espacios sobrantes del modelo, la descripción y el equipamiento se eliminan, y los campos opcionales vacíos no se envían.
  Cada error se muestra junto a su campo y, mientras haya errores, no se envía nada. El error de un campo desaparece en cuanto se corrige.
- **Guardar.** Al enviar datos válidos se crea el coche, aparece un aviso «Coche creado» y se lleva a la ficha del nuevo coche. Mientras se guarda, los botones están desactivados y el de guardar indica que está trabajando, para evitar envíos repetidos.
- **Errores del servidor.** Si el backend rechaza la operación se muestra un mensaje comprensible dentro del formulario (por ejemplo, «No tienes permiso para realizar esta acción» o «No se pudo conectar con el servidor»; los errores de validación del backend se muestran tal cual) y el formulario conserva lo escrito para poder corregirlo y volver a intentarlo.
- **Cancelar.** «Cancelar» vuelve al listado, a la misma página si se venía de él, sin crear nada.
- **Marcas.** Mientras se cargan, la lista desplegable indica que está cargando. Si falla la carga se muestra el error con un botón «Reintentar». Si no hay ninguna marca, se avisa de que hay que crearla antes de añadir coches (la gestión de marcas queda fuera del frontend).
- **Reflejo del cambio.** El nuevo coche aparece en el listado la próxima vez que se abre, sin recargar la página manualmente.

### Requisitos técnicos

- Componente `FormularioCoche`, reutilizable: recibe las marcas, los estados de carga y de error, los datos iniciales opcionales (para la edición de la iteración 15) y el texto del botón de guardar, y emite `guardar` con los datos ya validados, `cancelar` y `reintentar-marcas`. La pantalla `FormularioCocheView` lo conecta con las tiendas y con la navegación.
- Tienda `marcas`, compartida por las pantallas que necesiten las marcas (este formulario y, más adelante, los filtros): se piden una sola vez, aunque se pidan varias veces a la vez, y se pueden recargar si falló.
- La tienda `coches` incorpora la acción `crear`, que usa el servicio `crearCoche` de la práctica 1.
- La validación reutiliza el esquema `cocheSchema` de la capa de servicios (copiado en la iteración 09), de modo que las reglas son las del backend.
- El composable `useVolverAlListado` (antes dentro del detalle) se comparte entre la ficha y el formulario.
- Los errores de permisos del servicio («No autorizado») se traducen a un mensaje comprensible en `src/utils/errores.js`.
- Los tests simulan en jsdom `ResizeObserver`, que PrimeVue usa en algunos campos.

### Fuera de alcance

- Editar un coche (iteración 15), eliminarlo (16), buscar (17) y gestionar fotos (18).
- Crear, editar o borrar marcas.
- Subir fotos al crear el coche.

## PLAN

1. Añadir la traducción de «No autorizado» en `src/utils/errores.js`.
2. Crear la tienda `src/stores/marcas.js` y añadir `crear` a `src/stores/coches.js`.
3. Extraer `src/composables/useVolverAlListado.js` y usarlo desde `DetalleView`.
4. Crear `src/components/FormularioCoche.vue`.
5. Reescribir `src/views/FormularioCocheView.vue` para la creación.
6. Preparar en `tests/helpers.js` utilidades para rellenar el formulario, y simular `ResizeObserver` en `tests/preparar-entorno.js`.
7. Crear `tests/formulario-coche.test.js`, `tests/marcas.store.test.js` y `tests/crear-coche.test.js`; ampliar `tests/coches.store.test.js`; adaptar `tests/errores.test.js` y `tests/listado.test.js`.
8. Ejecutar `npm test` y `npm run build`.
9. Probar a mano con el Supabase real: como administrador, como usuario normal y como visitante; con datos válidos y no válidos.

Decisiones: el formulario es un componente reutilizable para crear y editar, para no escribirlo dos veces; se valida con el esquema del backend, para que las reglas no se desincronicen; se valida al enviar, y cada error desaparece al corregir su campo; tras crear se lleva a la ficha del nuevo coche, que confirma el resultado; las marcas viven en una tienda compartida, porque las usarán los filtros; los números no admiten decimales, porque el backend espera enteros; el equipamiento se escribe separado por comas por sencillez.
Riesgo: si el backend cambia sus reglas, el esquema copiado se desincroniza; está anotado como limitación en la iteración 09.

## TEST_PLAN

| Caso | Resultado esperado | Resultado obtenido |
|---|---|---|
| Acceso: administrador / usuario normal / visitante | Formulario / «No tienes permiso» / login con vuelta al formulario |  |
| Marcas cargadas en la lista desplegable | Aparecen las del servidor, que se piden una vez |  |
| Formulario vacío | Un error en cada campo obligatorio y no se llama al servidor |  |
| Valores no válidos (precio 0, km negativo, año fuera de rango, potencia 0, modelo con solo espacios) | Mensaje en el campo correspondiente |  |
| Límites válidos del año (1950 y año siguiente) | Se aceptan |  |
| Corregir un campo | Su error desaparece sin volver a enviar |  |
| Datos enviados | Valores limpios, listas separadas, opcionales vacíos sin enviar, disponible por defecto |  |
| Marcar como no disponible | Se envía `disponible: false` |  |
| Crear con datos válidos | Se crea, aparece «Coche creado» y se ve la ficha del nuevo coche |  |
| Nuevo coche en el listado | Aparece al abrir el listado, sin recargar |  |
| Mientras guarda | Botones desactivados |  |
| El servidor rechaza por permisos | Mensaje comprensible y el formulario conserva lo escrito |  |
| Error de validación del backend / sin conexión | Se muestra el mensaje y se puede reintentar |  |
| Reintento tras un error | Crea el coche |  |
| Error al cargar las marcas | Mensaje con «Reintentar», que vuelve a pedirlas |  |
| Sin marcas | Aviso de que hay que crear una |  |
| Cancelar desde el listado / con entrada directa | Vuelve al listado sin crear nada |  |
| Formulario con datos iniciales | Rellena los campos y se puede guardar sin cambios |  |
| Traducción de «No autorizado» | Mensaje comprensible |  |
| `npm run build` | Sin errores |  |
| Comprobación manual con el Supabase real: crear un coche como administrador | El coche se crea y aparece en el listado y en su ficha |  |
| Comprobación manual: errores de validación | Se ven junto a cada campo |  |
| Comprobación manual: usuario normal y visitante | No pueden llegar al formulario |  |
| Comprobación manual: permisos en Supabase (RLS) | Con un usuario normal, intentar crear (por ejemplo desde la consola) lo rechaza la base de datos |  |

### Tests automáticos

- `tests/formulario-coche.test.js` (30 tests): campos, validación, datos que se envían, estados, marcas y datos iniciales.
- `tests/crear-coche.test.js` (14 tests): acceso, creación, errores del servidor y cancelar, con la aplicación completa.
- `tests/marcas.store.test.js` (6 tests): tienda de marcas.
- `tests/coches.store.test.js` (17 tests): se añade la creación.
- `tests/errores.test.js` (11 tests): se añade la traducción de permisos.
- Los tests de las iteraciones anteriores se adaptan a los cambios sin variar su comportamiento.

**Resultado de la ejecución:** (pendiente: se rellena después de ejecutar `npm test`, `npm run build` y las comprobaciones manuales).

## AI_LOG

### Herramienta usada

- Herramienta: Claude Code
- Modelo: Claude Sonnet 5.5 (sesión en la nube)
- Tipo: asistente de código en la nube

### Uso realizado

Se usó la IA para:

- proponer el diseño del formulario reutilizable, la tienda de marcas y la gestión de errores;
- **redactar la SPEC, el PLAN y el TEST_PLAN** (por petición del estudiante, que los revisa y los hace suyos);
- generar el formulario, las tiendas, la pantalla y los tests;
- comprobar el flujo completo (login como administrador, errores, rechazo por permisos, creación y listado) en un navegador real contra un Supabase simulado, y corregir que los errores no desaparecían al corregir un campo.

### Prompt importante 1

«vamos con la iteración 14». Resultado: formulario de creación de coches, con validación, tienda de marcas y manejo de errores.

### Decisiones de diseño propuestas por la IA

[REVISAR: confirma que las aceptas o anota las que cambiaste]

- Un único componente de formulario para crear y editar.
- Validación con el esquema del backend.
- Validación al enviar, con el error de cada campo borrándose al corregirlo.
- Tras crear, se lleva a la ficha del nuevo coche.
- Tienda de marcas compartida.
- Equipamiento escrito separado por comas.

### Se rechazó o descartó

- Validar en cada pulsación de tecla: descartado por molesto; se valida al enviar.
- Quedarse en el formulario tras crear: descartado, porque llevar a la ficha confirma el resultado.

### Correcciones manuales

- [COMPLETAR: cambios que hayas hecho tú, o «Ninguna»]

## COMMITS RELACIONADOS

- `HASH_14` - (se rellena al hacer el commit)
