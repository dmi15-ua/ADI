import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import App from '../src/App.vue'
import { crearEntornoUI, crearDetalleDePrueba } from './helpers.js'
import { logout, obtenerSesion } from '../src/servicios/services/authService.js'
import { obtenerPerfil } from '../src/servicios/services/perfilService.js'
import { buscarCoches, obtenerCoche } from '../src/servicios/services/cocheService.js'

vi.mock('../src/servicios/services/authService.js', () => ({
  login: vi.fn(),
  logout: vi.fn(),
  obtenerSesion: vi.fn(),
  registrar: vi.fn()
}))
vi.mock('../src/servicios/services/perfilService.js', () => ({ obtenerPerfil: vi.fn() }))
vi.mock('../src/servicios/services/cocheService.js', () => ({ buscarCoches: vi.fn(), obtenerCoche: vi.fn(), crearCoche: vi.fn(), actualizarCoche: vi.fn() }))

beforeEach(() => {
  vi.clearAllMocks()
  obtenerSesion.mockResolvedValue(null)
  logout.mockResolvedValue(undefined)
  buscarCoches.mockResolvedValue({ datos: [], pagina: 1, porPagina: 9, total: 0, totalPaginas: 0 })
})

async function montar(ruta = '/') {
  const { router, plugins, pinia } = crearEntornoUI(ruta)
  await router.isReady()
  const w = mount(App, { global: { plugins }, attachTo: document.body })
  await flushPromises()
  return { w, router, pinia }
}

describe('estructura de la aplicación', () => {
  it('muestra la marca y el menú principal', async () => {
    const { w } = await montar()
    expect(w.find('a.marca').text()).toBe('Concesionario')
    expect(w.text()).toContain('Coches')
    w.unmount()
  })

  it('muestra la pantalla que corresponde a la ruta', async () => {
    const { w } = await montar('/')
    expect(w.find('main').text()).toContain('Coches disponibles')
    w.unmount()
  })

  it('al pulsar un enlace del menú cambia la pantalla sin recargar', async () => {
    const { w, router } = await montar('/login')
    expect(w.find('main').text()).toContain('Iniciar sesión')
    await w.find('a[href="/"]:not(.marca)').trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.name).toBe('listado')
    expect(w.find('main').text()).toContain('Coches disponibles')
    w.unmount()
  })

  it('la marca lleva al listado', async () => {
    const { w, router } = await montar('/login')
    await w.find('a.marca').trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.name).toBe('listado')
    w.unmount()
  })

  it('una dirección que no existe muestra un mensaje y un enlace para volver', async () => {
    const { w, router } = await montar('/esto-no-existe')
    expect(w.find('main').text()).toContain('Página no encontrada')
    await w.find('main a').trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.name).toBe('listado')
    w.unmount()
  })

  it('el detalle recibe el id de la URL y pide ese coche', async () => {
    obtenerCoche.mockResolvedValue(crearDetalleDePrueba(5, { modelo: 'Ibiza' }))
    const { w } = await montar('/coches/5')
    expect(obtenerCoche).toHaveBeenCalledWith('5')
    expect(w.find('main').text()).toContain('Seat Ibiza')
    w.unmount()
  })
})

describe('botón de acceso', () => {
  it('el botón «Iniciar sesión» lleva a la pantalla de login', async () => {
    const { w, router } = await montar('/')
    const boton = w.findAll('button').find((b) => b.text().includes('Iniciar sesión'))
    await boton.trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.name).toBe('login')
    w.unmount()
  })
})

describe('zona de sesión de la cabecera', () => {
  const conSesion = (rol, nombre = 'Ana') => {
    obtenerSesion.mockResolvedValue({ id: 'u1', email: 'ana@ua.es' })
    obtenerPerfil.mockResolvedValue({ id: 'u1', nombre, rol })
  }
  const cabecera = (w) => w.find('header').text()

  it('sin sesión ofrece iniciar sesión y registrarse, y no muestra datos de usuario', async () => {
    const { w } = await montar()
    expect(cabecera(w)).toContain('Iniciar sesión')
    expect(cabecera(w)).toContain('Registrarse')
    expect(cabecera(w)).not.toContain('Cerrar sesión')
    expect(cabecera(w)).not.toContain('Ana')
    w.unmount()
  })

  it('con sesión de usuario normal muestra su nombre y cerrar sesión, sin la etiqueta de administrador', async () => {
    conSesion('cliente')
    const { w } = await montar()
    expect(cabecera(w)).toContain('Ana')
    expect(cabecera(w)).toContain('Cerrar sesión')
    expect(cabecera(w)).not.toContain('Iniciar sesión')
    expect(cabecera(w)).not.toContain('Registrarse')
    expect(cabecera(w)).not.toContain('Admin')
    w.unmount()
  })

  it('con sesión de administrador muestra la etiqueta «Admin»', async () => {
    conSesion('admin')
    const { w } = await montar()
    expect(cabecera(w)).toContain('Admin')
    w.unmount()
  })

  it('mientras se comprueba si hay sesión guardada muestra un indicador de carga', async () => {
    const { w, pinia } = await montar()
    pinia.state.value.sesion.iniciada = false
    await flushPromises()
    expect(w.find('header [role="progressbar"]').exists()).toBe(true)
    expect(cabecera(w)).not.toContain('Iniciar sesión')
    w.unmount()
  })

  it('al cerrar sesión la interfaz deja de mostrar los datos del usuario y vuelve al listado', async () => {
    conSesion('admin')
    const { w, router } = await montar('/coches/nuevo')
    expect(router.currentRoute.value.name).toBe('coche-nuevo')
    const botonSalir = w.findAll('button').find((b) => b.text().includes('Cerrar sesión'))
    await botonSalir.trigger('click')
    await flushPromises()
    expect(logout).toHaveBeenCalled()
    expect(cabecera(w)).toContain('Iniciar sesión')
    expect(cabecera(w)).not.toContain('Ana')
    expect(cabecera(w)).not.toContain('Admin')
    expect(router.currentRoute.value.name).toBe('listado')
    expect(document.body.textContent).toContain('Sesión cerrada')
    w.unmount()
  })

  it('si el servidor falla al cerrar sesión, avisa pero la interfaz queda sin datos del usuario', async () => {
    conSesion('cliente')
    logout.mockRejectedValue(new Error('Failed to fetch'))
    const { w } = await montar()
    const botonSalir = w.findAll('button').find((b) => b.text().includes('Cerrar sesión'))
    await botonSalir.trigger('click')
    await flushPromises()
    expect(document.body.textContent).toContain('No se pudo cerrar la sesión en el servidor')
    expect(cabecera(w)).not.toContain('Ana')
    w.unmount()
  })
})

describe('botón de registro', () => {
  it('el botón «Registrarse» lleva a la pantalla de registro', async () => {
    const { w, router } = await montar('/')
    const boton = w.findAll('button').find((b) => b.text().includes('Registrarse'))
    await boton.trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.name).toBe('registro')
    w.unmount()
  })
})
