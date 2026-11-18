import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import App from '../src/App.vue'
import { crearEntornoUI, crearCocheDePrueba, respuestaDePagina } from './helpers.js'
import { buscarCoches } from '../src/servicios/services/cocheService.js'
import { obtenerSesion } from '../src/servicios/services/authService.js'
import { obtenerPerfil } from '../src/servicios/services/perfilService.js'

vi.mock('../src/servicios/services/authService.js', () => ({
  login: vi.fn(),
  logout: vi.fn(),
  obtenerSesion: vi.fn(),
  registrar: vi.fn()
}))
vi.mock('../src/servicios/services/perfilService.js', () => ({ obtenerPerfil: vi.fn() }))
vi.mock('../src/servicios/services/cocheService.js', () => ({ buscarCoches: vi.fn(), obtenerCoche: vi.fn(), crearCoche: vi.fn(), actualizarCoche: vi.fn(), eliminarCoche: vi.fn() }))

const todos = Array.from({ length: 25 }, (_, i) => crearCocheDePrueba(i + 1))
let w

beforeEach(() => {
  vi.clearAllMocks()
  obtenerSesion.mockResolvedValue(null)
  buscarCoches.mockImplementation(async (filtros) => respuestaDePagina(todos, filtros))
})
afterEach(() => {
  w?.unmount()
  document.body.innerHTML = ''
})

async function abrir(ruta = '/') {
  const { router, plugins } = crearEntornoUI(ruta)
  await router.isReady()
  w = mount(App, { global: { plugins }, attachTo: document.body })
  await flushPromises()
  return router
}
const titulos = () => w.findAll('article h3').map((h) => h.text())
const informe = () => w.find('.p-paginator-current').text()
const paginaDelPaginador = (n) => w.findAll('.p-paginator-page').find((b) => b.text() === String(n))
const mensajes = () => w.find('main').text()

describe('listado con datos', () => {
  it('muestra la primera página con sus coches y el paginador', async () => {
    await abrir()
    expect(buscarCoches).toHaveBeenCalledWith({ pagina: 1, porPagina: 9 })
    expect(titulos()).toHaveLength(9)
    expect(titulos()[0]).toBe('Seat Modelo 1')
    expect(titulos()[8]).toBe('Seat Modelo 9')
    expect(informe()).toBe('Mostrando 1-9 de 25 coches')
    expect(w.findAll('.p-paginator-page')).toHaveLength(3)
  })

  it('cada coche ofrece ver su detalle', async () => {
    const router = await abrir()
    const botones = w.findAll('article button').filter((b) => b.text().includes('Ver detalle'))
    expect(botones).toHaveLength(9)
    await botones[2].trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.name).toBe('coche-detalle')
    expect(router.currentRoute.value.params.id).toBe('3')
  })

  it('las etiquetas del paginador están en español', async () => {
    await abrir()
    expect(w.find('.p-paginator-next').attributes('aria-label')).toBe('Página siguiente')
    expect(paginaDelPaginador(2).attributes('aria-label')).toBe('Página 2')
  })
})

describe('paginación', () => {
  it('al pulsar una página pide esa página y la pone en la URL', async () => {
    const router = await abrir()
    await paginaDelPaginador(2).trigger('click')
    await flushPromises()
    expect(buscarCoches).toHaveBeenLastCalledWith({ pagina: 2, porPagina: 9 })
    expect(router.currentRoute.value.query.pagina).toBe('2')
    expect(titulos()[0]).toBe('Seat Modelo 10')
    expect(informe()).toBe('Mostrando 10-18 de 25 coches')
  })

  it('el botón siguiente avanza de página', async () => {
    await abrir()
    await w.find('.p-paginator-next').trigger('click')
    await flushPromises()
    expect(titulos()[0]).toBe('Seat Modelo 10')
  })

  it('la última página puede tener menos coches', async () => {
    await abrir('/?pagina=3')
    expect(titulos()).toHaveLength(7)
    expect(informe()).toBe('Mostrando 19-25 de 25 coches')
  })

  it('se puede entrar directamente a una página por la URL', async () => {
    await abrir('/?pagina=2')
    expect(buscarCoches).toHaveBeenCalledWith({ pagina: 2, porPagina: 9 })
    expect(titulos()[0]).toBe('Seat Modelo 10')
  })

  it.each(['abc', '0', '-2', '1.5', ''])('una página no válida en la URL («%s») carga la primera', async (valor) => {
    await abrir(`/?pagina=${valor}`)
    expect(buscarCoches).toHaveBeenCalledWith({ pagina: 1, porPagina: 9 })
    expect(titulos()[0]).toBe('Seat Modelo 1')
  })

  it('una página que no existe lleva a la última', async () => {
    const router = await abrir('/?pagina=9')
    expect(router.currentRoute.value.query.pagina).toBe('3')
    expect(titulos()[0]).toBe('Seat Modelo 19')
  })

  it('atrás y adelante del navegador cambian de página', async () => {
    const router = await abrir()
    await paginaDelPaginador(2).trigger('click')
    await flushPromises()
    expect(titulos()[0]).toBe('Seat Modelo 10')
    router.back()
    await flushPromises()
    expect(titulos()[0]).toBe('Seat Modelo 1')
    router.forward()
    await flushPromises()
    expect(titulos()[0]).toBe('Seat Modelo 10')
  })

  it('la primera página no deja ?pagina= en la URL', async () => {
    const router = await abrir('/?pagina=2')
    await paginaDelPaginador(1).trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.fullPath).toBe('/')
  })
})

describe('estados de la carga', () => {
  it('mientras carga por primera vez muestra un indicador y un texto', async () => {
    let terminar
    buscarCoches.mockReturnValue(new Promise((resolver) => (terminar = resolver)))
    await abrir()
    expect(w.find('main [role="progressbar"]').exists()).toBe(true)
    expect(mensajes()).toContain('Cargando coches...')
    expect(w.find('.p-paginator').exists()).toBe(false)
    terminar(respuestaDePagina(todos, { pagina: 1, porPagina: 9 }))
    await flushPromises()
    expect(w.find('main [role="progressbar"]').exists()).toBe(false)
    expect(titulos()).toHaveLength(9)
  })

  it('al cambiar de página mantiene los coches anteriores marcados como ocupados', async () => {
    const router = await abrir()
    let terminar
    buscarCoches.mockReturnValue(new Promise((resolver) => (terminar = resolver)))
    await paginaDelPaginador(2).trigger('click')
    await flushPromises()
    expect(titulos()[0]).toBe('Seat Modelo 1')
    expect(w.find('main [aria-busy="true"]').exists()).toBe(true)
    terminar(respuestaDePagina(todos, { pagina: 2, porPagina: 9 }))
    await flushPromises()
    expect(w.find('main [aria-busy="true"]').exists()).toBe(false)
    expect(titulos()[0]).toBe('Seat Modelo 10')
    expect(router.currentRoute.value.query.pagina).toBe('2')
  })

  it('sin coches muestra un mensaje de lista vacía, que no es un error', async () => {
    buscarCoches.mockResolvedValue({ datos: [], pagina: 1, porPagina: 9, total: 0, totalPaginas: 0 })
    await abrir()
    expect(mensajes()).toContain('No hay coches disponibles en este momento.')
    expect(mensajes()).not.toContain('Reintentar')
    expect(w.find('main [role="alert"]').exists()).toBe(false)
    expect(w.find('.p-paginator').exists()).toBe(false)
  })

  it('si falla la carga muestra el error con un botón para reintentar, y no el mensaje de lista vacía', async () => {
    buscarCoches.mockRejectedValue(new Error('Failed to fetch'))
    await abrir()
    expect(w.find('main [role="alert"]').text()).toContain('No se pudo conectar con el servidor')
    expect(mensajes()).toContain('Reintentar')
    expect(mensajes()).not.toContain('No hay coches disponibles')
    expect(w.findAll('article')).toHaveLength(0)
  })

  it('al reintentar tras un error, vuelve a pedir los datos y muestra la lista', async () => {
    buscarCoches.mockRejectedValueOnce(new Error('Failed to fetch'))
    await abrir()
    await w.findAll('main button').find((b) => b.text().includes('Reintentar')).trigger('click')
    await flushPromises()
    expect(buscarCoches).toHaveBeenCalledTimes(2)
    expect(w.find('main [role="alert"]').exists()).toBe(false)
    expect(titulos()).toHaveLength(9)
  })

  it('un error ya escrito en español se muestra tal cual', async () => {
    buscarCoches.mockRejectedValue(new Error('Buscar coches: datos no válidos'))
    await abrir()
    expect(w.find('main [role="alert"]').text()).toContain('Buscar coches: datos no válidos')
  })
})

describe('acciones según el usuario', () => {
  const conSesion = (rol) => {
    obtenerSesion.mockResolvedValue({ id: 'u1', email: 'a@b.com' })
    obtenerPerfil.mockResolvedValue({ id: 'u1', nombre: 'Ana', rol })
  }
  const botonNuevo = () => w.findAll('main button').find((b) => b.text().includes('Nuevo coche'))

  it('un visitante no ve el botón de nuevo coche', async () => {
    await abrir()
    expect(botonNuevo()).toBeUndefined()
  })

  it('un usuario normal tampoco', async () => {
    conSesion('cliente')
    await abrir()
    expect(botonNuevo()).toBeUndefined()
  })

  it('un administrador lo ve y lleva al formulario de creación', async () => {
    conSesion('admin')
    const router = await abrir()
    await botonNuevo().trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.name).toBe('coche-nuevo')
  })
})
