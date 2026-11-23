# PROJECT_SPEC

## Descripción

Aplicación web para un concesionario de compraventa de vehículos (nuevos y de ocasión). La aplicación se ha desarrollado en dos partes: el **backend** (práctica 1), implementado con Supabase y expuesto como una capa de servicios en JavaScript, y el **frontend** (práctica 3), una interfaz web en Vue conectada a ese backend. Los clientes pueden explorar el catálogo, filtrarlo, pedir citas de prueba de conducción y guardar sus coches favoritos. Un administrador gestiona el catálogo.

## Problema que resuelve

Centralizar el stock del concesionario y permitir a los clientes consultar vehículos y reservar pruebas de conducción sin llamar por teléfono, evitando que dos citas se solapen sobre el mismo vehículo.

## Tipos de usuario

- **Visitante (sin autenticar):** consulta y filtra el catálogo y ve la ficha de un coche con sus fotos.
- **Cliente (autenticado):** además se registra, inicia sesión, edita su perfil y gestiona sus citas y sus favoritos.
- **Administrador:** además crea, edita y elimina coches, y gestiona marcas y fotos.

## Recurso principal

**Coche** (vehículo en venta): marca, modelo, precio, kilometraje, año, combustible (gasolina, diésel, eléctrico), transmisión (manual, automático), potencia (CV), descripción, equipamiento y disponibilidad.

## Recursos secundarios

- **Foto de coche:** galería de un coche, con una foto principal. Se guardan como URL.
- **Cita:** prueba de conducción solicitada por un cliente para un coche, en una fecha y hora.
- **Favorito:** coche que un cliente guarda para consultarlo más tarde.
- **Marca** y **Perfil** de usuario: datos de apoyo.

## Relaciones

- Una marca tiene muchos coches; un coche pertenece a una marca.
- Un coche tiene muchas fotos.
- Un usuario tiene un perfil, muchas citas y muchos favoritos.
- Una cita une a un usuario con un coche.
- Un favorito une a un usuario con un coche; no se puede guardar dos veces el mismo coche.

## Funcionalidades principales

- Registro, login y logout con JWT; ver y editar el perfil propio.
- Listar coches con filtros (marca, combustible, transmisión, rango de precio y texto), orden y paginación.
- Ver la ficha de un coche con su marca y sus fotos.
- Crear, editar y eliminar coches (solo administrador).
- Listar, añadir y eliminar las fotos de un coche (escribir, solo administrador).
- Solicitar una cita de 30 minutos para un coche, ver las propias y cancelarlas.
- Impedir citas solapadas sobre el mismo coche.
- Guardar coches en favoritos, listarlos y quitarlos.

## Frontend (práctica 3)

Interfaz web en Vue (`frontend-vue/`) para el catálogo, conectada al backend de Supabase. Además, una implementación parcial con React (`frontend-react/`).

### Qué incluye

| Quién | Qué puede hacer en la interfaz |
|---|---|
| **Visitante** | Ver el listado de coches (paginado), buscar y filtrar (modelo, marca, combustible, transmisión, rango de precio y orden), ver el detalle de un coche con su galería de fotos, registrarse e iniciar sesión. |
| **Cliente** | Lo mismo, viendo su nombre en la cabecera y pudiendo cerrar sesión. Ninguna acción de administración. |
| **Administrador** | Además, crear, editar y eliminar coches (con confirmación y validación) y añadir o eliminar las fotos de un coche. |

- **La interfaz oculta las acciones no permitidas, pero la autorización la sigue aplicando el backend** (RLS): un usuario sin permiso no puede modificar el catálogo aunque se salte la interfaz.
- Siempre se distingue entre cargando, error (con «Reintentar»), lista vacía y contenido, y los errores se muestran en español, incluidos los de validación y permisos devueltos por el backend.
- Tras crear, editar, eliminar o cambiar fotos, la interfaz se actualiza sin recargar la página.
- La búsqueda y la página actual viven en la URL, de modo que se pueden compartir y funcionan atrás/adelante.
- Los formularios (login, registro y coche) se validan en el cliente con los mismos esquemas que el backend.

### Qué no incluye (aunque el backend lo tiene)

- Citas de prueba de conducción y favoritos: no tienen interfaz.
- Edición del perfil de usuario.
- Gestión de marcas.
- Mostrar coches no disponibles.

### Implementación parcial con React

Proyecto separado con **inicio de sesión, listado paginado y borrado con confirmación** del recurso principal, sobre el mismo backend y reutilizando la capa de servicios. No repite el resto del frontend.

## Reglas de negocio

- Un usuario solo ve y gestiona su propio perfil, sus citas y sus favoritos.
- El catálogo (marcas, coches y fotos) se puede consultar sin sesión; solo un administrador lo modifica.
- No se pueden pedir citas en el pasado ni para coches no disponibles.
- Una cita cancelada libera su horario. Un cliente no puede confirmar ni modificar sus citas, solo cancelarlas.
- Los datos se validan al crear y editar (por ejemplo, precio mayor que 0, año válido, URL de foto http o https).
- Nadie puede hacerse administrador desde la aplicación: el rol se asigna en la base de datos.
- Un coche eliminado se elimina con sus fotos, citas y favoritos; por eso la interfaz pide confirmación antes de eliminarlo.
- El listado público solo muestra coches disponibles.

## Fuera de alcance

- En el frontend: interfaz para citas y favoritos, edición del perfil, gestión de marcas, subida de ficheros de imagen y gestión de coches no disponibles.
- Compra y pago con tarjeta, y financiación.
- Varias sedes del concesionario.
- Subida de ficheros de imagen a Supabase Storage (las fotos son URL).
- Que un administrador confirme o gestione las citas.
- Recuperación de contraseña, verificación de email y notificaciones por correo.
