# PROJECT_SPEC

## Descripción

Aplicación web para un concesionario de compraventa de vehículos (nuevos y de ocasión). Esta práctica cubre solo el **backend**: los clientes podrán explorar el catálogo, filtrarlo, pedir citas de prueba de conducción y guardar favoritos. Un administrador gestiona el catálogo.

## Problema que resuelve

Centralizar el stock del concesionario y permitir a los clientes consultar vehículos y reservar pruebas de conducción sin llamar por teléfono, evitando citas solapadas sobre un mismo vehículo.

## Tipos de usuario

- **Visitante (sin autenticar):** consulta y filtra el catálogo, ve fichas de vehículos.
- **Cliente (autenticado):** además gestiona su perfil, sus citas y sus favoritos.
- **Administrador:** además crea, edita y elimina vehículos, marcas y fotos.

## Recurso principal

**Coche** (vehículo en venta). Atributos: marca, modelo, precio, kilometraje, año, combustible, transmisión, potencia (CV), descripción, equipamiento, disponibilidad.

## Recursos secundarios

- **Foto de coche:** galería de un coche (una marcada como principal).
- **Cita:** prueba de conducción solicitada por un cliente para un coche en una fecha y hora.
- **Favorito:** coche guardado por un cliente.
- **Marca** y **Perfil** de usuario (datos de apoyo).

## Relaciones

- Una marca tiene muchos coches; un coche pertenece a una marca.
- Un coche tiene muchas fotos.
- Un usuario tiene un perfil, muchas citas y muchos favoritos.
- Una cita une a un usuario con un coche. Un usuario no puede tener el mismo coche dos veces como favorito.

## Funcionalidades principales

- Registro, login y edición de perfil propio (autenticación con JWT).
- Listar coches paginados, filtrando por marca, combustible, transmisión y rango de precio.
- Ver el detalle de un coche con sus fotos.
- Crear, editar y eliminar coches (solo administrador).
- Solicitar una cita de 30 min para un coche, listar las propias y cancelarlas.
- Impedir citas solapadas sobre el mismo coche.
- Añadir, listar y quitar favoritos propios.

## Reglas de negocio

- Un usuario solo ve y gestiona sus propias citas y favoritos.
- No se pueden pedir citas en el pasado ni para coches no disponibles.
- Los datos se validan al crear y editar (precio > 0, km >= 0, año válido, etc.).

## Fuera de alcance

- Frontend (HTML/CSS) en esta práctica.
- Compra y pago con tarjeta, y financiación.
- Sedes o concesionarios múltiples.
- Subida de ficheros a Storage (se guardan URLs de fotos).
- Notificaciones por email.
