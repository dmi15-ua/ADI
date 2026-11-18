import ListadoView from '../views/ListadoView.vue'
import LoginView from '../views/LoginView.vue'
import RegistroView from '../views/RegistroView.vue'
import DetalleView from '../views/DetalleView.vue'
import FormularioCocheView from '../views/FormularioCocheView.vue'
import SinPermisoView from '../views/SinPermisoView.vue'
import NoEncontradoView from '../views/NoEncontradoView.vue'

// meta.requiereAdmin: solo un administrador puede entrar. La interfaz lo comprobará (iteración 11),
// pero la autorización de verdad se sigue aplicando siempre en el backend.
// :id(\\d+) hace que solo coincidan ids numéricos: así /coches/nuevo no se confunde con un id.
export const rutas = [
  { path: '/', name: 'listado', component: ListadoView, meta: { titulo: 'Coches' } },
  { path: '/login', name: 'login', component: LoginView, meta: { titulo: 'Iniciar sesión' } },
  { path: '/registro', name: 'registro', component: RegistroView, meta: { titulo: 'Crear cuenta' } },
  { path: '/coches/nuevo', name: 'coche-nuevo', component: FormularioCocheView, meta: { titulo: 'Nuevo coche', requiereAdmin: true } },
  { path: '/coches/:id(\\d+)', name: 'coche-detalle', component: DetalleView, props: true, meta: { titulo: 'Detalle del coche' } },
  {
    path: '/coches/:id(\\d+)/editar',
    name: 'coche-editar',
    component: FormularioCocheView,
    props: true,
    meta: { titulo: 'Editar coche', requiereAdmin: true }
  },
  { path: '/sin-permiso', name: 'sin-permiso', component: SinPermisoView, meta: { titulo: 'Sin permiso' } },
  { path: '/:resto(.*)*', name: 'no-encontrado', component: NoEncontradoView, meta: { titulo: 'Página no encontrada' } }
]
