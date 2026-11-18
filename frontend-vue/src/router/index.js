import { createRouter, createWebHistory } from 'vue-router'
import { rutas } from './rutas.js'
import { useSesionStore } from '../stores/sesion.js'

// Se reciben el historial y la instancia de Pinia para poder usar valores de prueba en los tests
export function crearRouter(historial = createWebHistory(), pinia) {
  const router = createRouter({ history: historial, routes: rutas })

  router.beforeEach(async (to) => {
    const sesion = useSesionStore(pinia)
    // Antes de decidir nada hay que saber si el navegador tiene una sesión guardada
    await sesion.iniciar()

    if (to.meta.requiereAdmin) {
      if (!sesion.autenticado) return { name: 'login', query: { redirect: to.fullPath } }
      if (!sesion.esAdmin) return { name: 'sin-permiso' }
    }
    // Quien ya ha iniciado sesión no necesita ver el login ni el registro
    if ((to.name === 'login' || to.name === 'registro') && sesion.autenticado) return { name: 'listado' }
  })

  // El título de la pestaña cambia con cada pantalla
  router.afterEach((to) => {
    document.title = to.meta.titulo ? `Concesionario · ${to.meta.titulo}` : 'Concesionario'
  })

  return router
}
