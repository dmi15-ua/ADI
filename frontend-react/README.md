# Concesionario de vehículos — implementación parcial con React

Proyecto **separado** del frontend principal (`../frontend-vue`) que implementa con **React** solo una parte de la aplicación, usando el **mismo backend de Supabase**:

- **Inicio y cierre de sesión** (necesarios para poder eliminar).
- **Listado paginado** de coches (paginación en el servidor).
- **Eliminar** un coche (solo administradores, con confirmación).

No se repite el resto del frontend (detalle, crear, editar, búsqueda, fotos, router).

## Instalación y ejecución

Requiere Node 20.19 o superior.

```bash
cd frontend-react
npm install
cp .env.example .env     # y rellena VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY (los mismos que en frontend-vue)
npm run dev              # http://localhost:5174
npm test                 # tests automáticos (Vitest + Testing Library)
npm run build            # compilación de producción
```

Solo se usa la clave pública (`anon`/`publishable`), nunca la `service_role`.

Para probar el borrado hace falta un usuario con rol `admin` (ver el README de la raíz del proyecto).

## Organización

```
src/
  servicios/        COPIA IDÉNTICA de la capa de servicios del frontend en Vue (no depende del framework)
    lib/ validation/ services/
  utils/            errores.js y formato.js (también copiados de frontend-vue)
  contexto/         SesionContext.jsx   sesión: usuario, perfil y rol (Context de React)
  hooks/            useCoches.js        listado paginado (estado + carga + paginación)
  componentes/      ListadoCoches, TarjetaCoche, Paginador, EstadoCarga, DialogoConfirmacion, LoginForm
  App.jsx           cabecera y elección de pantalla (listado o login)
  main.jsx          arranque
tests/              Vitest + @testing-library/react (servicios mockeados, igual que en frontend-vue)
```

### Servicios reutilizados

`src/servicios` y `src/utils` son los mismos archivos que en `frontend-vue/src` (la capa de servicios de la práctica 1, que no depende de ningún framework: cliente de Supabase, validación con Zod, `authService`, `cocheService`, `perfilService`). Se copian en lugar de enlazarse para que cada proyecto se pueda instalar y ejecutar por separado. El test `tests/servicios-iguales.test.js` falla si alguna copia deja de ser idéntica a la del proyecto Vue (cuando los dos proyectos están en la misma carpeta).

## Diferencias con la implementación en Vue

| Aspecto | Vue (`frontend-vue`) | React (`frontend-react`) |
|---|---|---|
| **Componente** | Archivo `.vue` con tres bloques: `<template>` (HTML con directivas `v-if`, `v-for`, `v-model`), `<script setup>` y `<style scoped>`. | Función que devuelve JSX (HTML dentro de JavaScript): condicionales con `&&` y ternarios, listas con `.map()` y `key`, eventos con `onClick`, `className`. Los estilos son un CSS global. |
| **Estado local** | `ref()` / `reactive()` / `computed()`: se modifica el valor y Vue detecta qué depende de él (reactividad). | `useState()` / `useMemo()`: nunca se modifica el valor, se llama a `setX(nuevo)` y React vuelve a ejecutar la función del componente. |
| **Reaccionar a cambios** | `watch(fuente, función, { immediate })`. | `useEffect(función, [dependencias])`, que además devuelve una función de limpieza (se usa para ignorar respuestas de componentes ya desmontados). |
| **Estado compartido** | Tiendas **Pinia** (`sesion`, `coches`, `marcas`): objetos globales con estado y acciones, accesibles desde cualquier componente. | **Context** para la sesión (`SesionProvider` + `useSesion`) y un **hook** (`useCoches`) para el listado: el estado del hook pertenece al componente que lo usa. Como solo una pantalla usa el listado, no hace falta compartirlo. |
| **Lógica reutilizable** | Composables (`useConfirmacion`, `useEliminarCoche`…). | Hooks (`useCoches`, `useSesion`), con la regla de llamarlos siempre en el mismo orden y solo dentro de componentes u otros hooks. |
| **Confirmación de borrado** | `useConfirmacion()` devuelve una promesa y el diálogo (`ConfirmDialog` de PrimeVue) vive en `App.vue`. | Un estado `pendiente` (el coche a eliminar) y un componente `DialogoConfirmacion` propio que se muestra mientras hay un `pendiente`. |
| **Biblioteca de componentes** | PrimeVue (botones, listas, paginador, avisos, diálogos). | Ninguna: CSS propio y componentes sencillos (el apartado de biblioteca de componentes se hizo solo en Vue). |
| **Navegación** | `vue-router`: `/`, `/login`, `/coches/:id`… y la página y los filtros en la URL (`?pagina=2`). | Sin router (solo hay dos pantallas): un estado decide si se ve el listado o el login. La página **no** está en la URL: al recargar se vuelve a la primera. |
| **Tests** | `@vue/test-utils`: se monta el componente y se busca por selectores y componentes. | `@testing-library/react`: se consulta lo que ve el usuario (roles, textos y etiquetas accesibles) con `user-event`. |

Lo que **no** cambia: la capa de servicios, las reglas de validación, los mensajes de error en español, el comportamiento de las pantallas (estados de carga, error con «Reintentar», lista vacía, confirmación antes de eliminar, volver a la página anterior si se elimina el último coche de la última página) y el criterio de seguridad (la interfaz solo oculta el botón; la autorización real es la RLS de Supabase).

## Limitaciones

- La página actual no se guarda en la URL (no hay router).
- Solo listado y borrado, como pide el enunciado; no hay detalle, creación, edición, búsqueda ni fotos.
