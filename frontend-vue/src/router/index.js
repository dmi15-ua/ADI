import { createRouter, createWebHistory } from 'vue-router'
import { rutas } from './rutas.js'

// Se recibe el historial para poder usar uno en memoria en los tests
export function crearRouter(historial = createWebHistory()) {
  const router = createRouter({ history: historial, routes: rutas })

  // El título de la pestaña cambia con cada pantalla
  router.afterEach((to) => {
    document.title = to.meta.titulo ? `Concesionario · ${to.meta.titulo}` : 'Concesionario'
  })

  return router
}
