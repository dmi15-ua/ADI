import { describe, it, expect, vi, beforeEach } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { createMemoryHistory } from 'vue-router'
import { createPinia } from 'pinia'
import { crearRouter } from '../src/router/index.js'
import { obtenerSesion } from '../src/servicios/services/authService.js'
import { obtenerPerfil } from '../src/servicios/services/perfilService.js'

vi.mock('../src/servicios/services/authService.js', () => ({
  login: vi.fn(),
  logout: vi.fn(),
  obtenerSesion: vi.fn(),
  registrar: vi.fn()
}))
vi.mock('../src/servicios/services/perfilService.js', () => ({ obtenerPerfil: vi.fn() }))

// Sin sesión por defecto; cada test indica quién ha iniciado sesión
beforeEach(() => {
  vi.clearAllMocks()
  obtenerSesion.mockResolvedValue(null)
})
const conSesion = (rol) => {
  obtenerSesion.mockResolvedValue({ id: 'u1', email: 'a@b.com' })
  obtenerPerfil.mockResolvedValue({ id: 'u1', nombre: 'Ana', rol })
}

const nuevoRouter = () => crearRouter(createMemoryHistory(), createPinia())
const resolver = (ruta) => nuevoRouter().resolve(ruta)

describe('rutas', () => {
  it('el listado está en la raíz', () => {
    expect(resolver('/').name).toBe('listado')
  })

  it('hay una ruta de login', () => {
    expect(resolver('/login').name).toBe('login')
  })

  it('hay una ruta de registro', () => {
    expect(resolver('/registro').name).toBe('registro')
  })

  it('/coches/nuevo es el formulario de creación y no se confunde con un id', () => {
    expect(resolver('/coches/nuevo').name).toBe('coche-nuevo')
  })

  it('/coches/:id es el detalle y recibe el id como parámetro', () => {
    const ruta = resolver('/coches/5')
    expect(ruta.name).toBe('coche-detalle')
    expect(ruta.params.id).toBe('5')
  })

  it('/coches/:id/editar es el formulario de edición', () => {
    const ruta = resolver('/coches/12/editar')
    expect(ruta.name).toBe('coche-editar')
    expect(ruta.params.id).toBe('12')
  })

  it.each(['/coches/abc', '/coches/5/borrar', '/no-existe', '/coches/-1'])('%s lleva a la página no encontrada', (ruta) => {
    expect(resolver(ruta).name).toBe('no-encontrado')
  })

  it('solo crear y editar requieren ser administrador', () => {
    const requieren = ['coche-nuevo', 'coche-editar']
    for (const r of nuevoRouter().getRoutes()) {
      expect(Boolean(r.meta.requiereAdmin)).toBe(requieren.includes(r.name))
    }
  })
})

describe('navegación', () => {
  it('se puede entrar directamente por una URL', async () => {
    const router = nuevoRouter()
    await router.push('/coches/7')
    expect(router.currentRoute.value.name).toBe('coche-detalle')
    expect(router.currentRoute.value.params.id).toBe('7')
  })

  it('atrás y adelante recorren el historial', async () => {
    const router = nuevoRouter()
    await router.push('/')
    await router.push('/coches/5')
    await router.push('/login')

    router.back()
    await flushPromises()
    expect(router.currentRoute.value.fullPath).toBe('/coches/5')
    router.back()
    await flushPromises()
    expect(router.currentRoute.value.fullPath).toBe('/')
    router.forward()
    await flushPromises()
    expect(router.currentRoute.value.fullPath).toBe('/coches/5')
  })

  it('el título de la pestaña cambia con cada pantalla', async () => {
    const router = nuevoRouter()
    await router.push('/login')
    expect(document.title).toBe('Concesionario · Iniciar sesión')
    await router.push('/')
    expect(document.title).toBe('Concesionario · Coches')
    await router.push('/loquesea')
    expect(document.title).toBe('Concesionario · Página no encontrada')
  })
})

describe('protección de rutas según la sesión', () => {
  it('las pantallas públicas se pueden ver sin sesión', async () => {
    const router = nuevoRouter()
    for (const ruta of ['/', '/coches/5', '/login', '/registro']) {
      await router.push(ruta)
      expect(router.currentRoute.value.fullPath).toBe(ruta)
    }
  })

  it('sin sesión, una pantalla de administrador lleva al login y recuerda a dónde se iba', async () => {
    const router = nuevoRouter()
    await router.push('/coches/nuevo')
    expect(router.currentRoute.value.name).toBe('login')
    expect(router.currentRoute.value.query.redirect).toBe('/coches/nuevo')
  })

  it('un usuario normal no entra en las pantallas de administrador', async () => {
    conSesion('cliente')
    const router = nuevoRouter()
    await router.push('/coches/5/editar')
    expect(router.currentRoute.value.name).toBe('sin-permiso')
  })

  it('un administrador sí entra', async () => {
    conSesion('admin')
    const router = nuevoRouter()
    await router.push('/coches/nuevo')
    expect(router.currentRoute.value.name).toBe('coche-nuevo')
    await router.push('/coches/5/editar')
    expect(router.currentRoute.value.name).toBe('coche-editar')
  })

  it('quien ya ha iniciado sesión no ve el login', async () => {
    conSesion('cliente')
    const router = nuevoRouter()
    await router.push('/login')
    expect(router.currentRoute.value.name).toBe('listado')
  })

  it('quien ya ha iniciado sesión no ve el registro', async () => {
    conSesion('cliente')
    const router = nuevoRouter()
    await router.push('/registro')
    expect(router.currentRoute.value.name).toBe('listado')
  })

  it('la sesión guardada se restaura una sola vez aunque se navegue varias veces', async () => {
    conSesion('admin')
    const router = nuevoRouter()
    await router.push('/')
    await router.push('/coches/nuevo')
    await router.push('/coches/3')
    expect(obtenerSesion).toHaveBeenCalledTimes(1)
  })

  it('si falla la restauración de la sesión, se trata como si no hubiera sesión', async () => {
    obtenerSesion.mockRejectedValue(new Error('sin red'))
    const router = nuevoRouter()
    await router.push('/coches/nuevo')
    expect(router.currentRoute.value.name).toBe('login')
  })
})
