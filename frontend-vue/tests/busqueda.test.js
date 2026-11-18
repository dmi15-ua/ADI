import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import App from '../src/App.vue'
import { crearEntornoUI, crearEntornoUIConHistorialReal, crearCocheDePrueba, respuestaDePagina, campoFormulario, ponerCampo } from './helpers.js'
import { buscarCoches } from '../src/servicios/services/cocheService.js'
import { listarMarcas } from '../src/servicios/services/marcaService.js'
import { obtenerSesion } from '../src/servicios/services/authService.js'

vi.mock('../src/servicios/services/authService.js', () => ({
  login: vi.fn(),
  logout: vi.fn(),
  obtenerSesion: vi.fn(),
  registrar: vi.fn()
}))
vi.mock('../src/servicios/services/perfilService.js', () => ({ obtenerPerfil: vi.fn() }))
vi.mock('../src/servicios/services/cocheService.js', () => ({
  buscarCoches: vi.fn(),
  obtenerCoche: vi.fn(),
  crearCoche: vi.fn(),
  actualizarCoche: vi.fn(),
  eliminarCoche: vi.fn()
}))
vi.mock('../src/servicios/services/marcaService.js', () => ({ listarMarcas: vi.fn() }))

const marcas = [
  { id: 1, nombre: 'Seat' },
  { id: 2, nombre: 'Renault' }
]
const todos = Array.from({ length: 25 }, (_, i) => crearCocheDePrueba(i + 1))
let w
let routerReal

beforeEach(() => {
  vi.clearAllMocks()
  obtenerSesion.mockResolvedValue(null)
  listarMarcas.mockResolvedValue(marcas)
  buscarCoches.mockImplementation(async (filtros) => respuestaDePagina(todos, filtros))
})
afterEach(() => {
  w?.unmount()
  routerReal?.options.history.destroy()
  routerReal = undefined
  document.body.innerHTML = ''
})

async function abrir(ruta = '/') {
  const { router, plugins } = crearEntornoUI(ruta)
  await router.isReady()
  w = mount(App, { global: { plugins }, attachTo: document.body })
  await flushPromises()
  return router
}
async function abrirConHistorialReal(ruta) {
  const { router, plugins } = crearEntornoUIConHistorialReal(ruta)
  routerReal = router
  w = mount(App, { global: { plugins }, attachTo: document.body })
  await router.isReady()
  await flushPromises()
  return router
}
const poner = async (campo, valor) => {
  ponerCampo(w, campo, valor)
  await flushPromises()
}
const buscar = async () => {
  await w.find('form[role="search"]').trigger('submit')
  await flushPromises()
}
const botonLimpiar = () => w.findAll('form button').find((b) => b.text() === 'Limpiar')
const titulos = () => w.findAll('article h3').map((h) => h.text())
const paginaDelPaginador = (n) => w.findAll('.p-paginator-page').find((b) => b.text() === String(n))
const esperarAlHistorial = () => new Promise((resolver) => setTimeout(resolver, 30))
const ultimaLlamada = () => buscarCoches.mock.calls.at(-1)[0]

describe('la barra de búsqueda', () => {
  it('aparece encima del listado, con las marcas del servidor (pedidas una sola vez)', async () => {
    await abrir()
    expect(w.find('form[role="search"]').exists()).toBe(true)
    expect(campoFormulario(w, 'marca_id').props('options')).toEqual(marcas)
    expect(listarMarcas).toHaveBeenCalledTimes(1)
  })

  it('sin filtros se piden los coches como antes', async () => {
    await abrir()
    expect(buscarCoches).toHaveBeenCalledTimes(1)
    expect(ultimaLlamada()).toEqual({ pagina: 1, porPagina: 9 })
  })
})

describe('buscar', () => {
  it('por modelo: pone el filtro en la URL y lo envía al servidor', async () => {
    const router = await abrir()
    await w.find('#texto').setValue('ibiza')
    expect(buscarCoches).toHaveBeenCalledTimes(1) // escribir no busca
    await buscar()
    expect(router.currentRoute.value.query).toEqual({ texto: 'ibiza' })
    expect(ultimaLlamada()).toEqual({ texto: 'ibiza', pagina: 1, porPagina: 9 })
  })

  it('con varios filtros a la vez', async () => {
    const router = await abrir()
    await w.find('#texto').setValue('clio')
    await poner('marca_id', 2)
    await poner('combustible', 'diesel')
    await poner('transmision', 'manual')
    await poner('precio_min', 5000)
    await poner('precio_max', 15000)
    await poner('orden', 'precio_asc')
    await buscar()
    expect(router.currentRoute.value.query).toEqual({
      texto: 'clio', marca: '2', combustible: 'diesel', transmision: 'manual', precio_min: '5000', precio_max: '15000', orden: 'precio_asc'
    })
    expect(ultimaLlamada()).toEqual({
      texto: 'clio', marca_id: 2, combustible: 'diesel', transmision: 'manual', precio_min: 5000, precio_max: 15000, orden: 'precio_asc', pagina: 1, porPagina: 9
    })
  })

  it('el listado muestra los resultados y su total', async () => {
    buscarCoches.mockImplementation(async (filtros) => respuestaDePagina(todos.filter((c) => (filtros.texto ? c.modelo.includes(filtros.texto) : true)), filtros))
    await abrir()
    await w.find('#texto').setValue('Modelo 1')
    await buscar()
    expect(titulos()).toEqual(['Seat Modelo 1', 'Seat Modelo 10', 'Seat Modelo 11', 'Seat Modelo 12', 'Seat Modelo 13', 'Seat Modelo 14', 'Seat Modelo 15', 'Seat Modelo 16', 'Seat Modelo 17'])
    expect(w.find('.p-paginator-current').text()).toBe('Mostrando 1-9 de 11 coches')
  })

  it('un precio mínimo mayor que el máximo no busca y lo avisa', async () => {
    const router = await abrir()
    await poner('precio_min', 20000)
    await poner('precio_max', 10000)
    await buscar()
    expect(w.find('#error-precios').text()).toContain('El precio mínimo no puede ser mayor que el máximo')
    expect(buscarCoches).toHaveBeenCalledTimes(1)
    expect(router.currentRoute.value.query).toEqual({})
  })

  it('buscar con otros filtros vuelve a la primera página', async () => {
    const router = await abrir('/?pagina=3')
    expect(ultimaLlamada().pagina).toBe(3)
    await w.find('#texto').setValue('seat')
    await buscar()
    expect(router.currentRoute.value.query).toEqual({ texto: 'seat' })
    expect(ultimaLlamada()).toEqual({ texto: 'seat', pagina: 1, porPagina: 9 })
  })

  it('repetir la misma búsqueda no vuelve a pedir los datos', async () => {
    await abrir('/?texto=seat')
    const antes = buscarCoches.mock.calls.length
    await buscar()
    expect(buscarCoches.mock.calls.length).toBe(antes)
  })
})

describe('filtros en la URL', () => {
  it('se puede entrar directamente con una búsqueda: se aplica y rellena la barra', async () => {
    await abrir('/?texto=leon&marca=2&combustible=diesel&precio_max=15000&orden=precio_asc&pagina=2')
    expect(ultimaLlamada()).toEqual({ texto: 'leon', marca_id: 2, combustible: 'diesel', precio_max: 15000, orden: 'precio_asc', pagina: 2, porPagina: 9 })
    expect(w.find('#texto').element.value).toBe('leon')
    expect(campoFormulario(w, 'marca_id').props('modelValue')).toBe(2)
    expect(campoFormulario(w, 'combustible').props('modelValue')).toBe('diesel')
    expect(campoFormulario(w, 'precio_max').props('modelValue')).toBe(15000)
    expect(campoFormulario(w, 'orden').props('modelValue')).toBe('precio_asc')
  })

  it('los valores no válidos de la URL se ignoran', async () => {
    await abrir('/?marca=abc&combustible=hibrido&transmision=semi&precio_min=20000&precio_max=10000&orden=raro')
    expect(ultimaLlamada()).toEqual({ pagina: 1, porPagina: 9 })
    expect(titulos()).toHaveLength(9)
  })

  it('al cambiar de página se conservan los filtros', async () => {
    const router = await abrir('/?combustible=diesel&precio_max=15000')
    await paginaDelPaginador(2).trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.query).toEqual({ combustible: 'diesel', precio_max: '15000', pagina: '2' })
    expect(ultimaLlamada()).toEqual({ combustible: 'diesel', precio_max: 15000, pagina: 2, porPagina: 9 })
  })

  it('un parámetro ajeno a la búsqueda no vuelve a pedir los datos', async () => {
    const router = await abrir('/?texto=seat')
    const antes = buscarCoches.mock.calls.length
    await router.replace({ query: { texto: 'seat', utm: 'x' } })
    await flushPromises()
    expect(buscarCoches.mock.calls.length).toBe(antes)
  })

  it('atrás y adelante del navegador recuperan la búsqueda anterior y rellenan la barra', async () => {
    const router = await abrirConHistorialReal('/')
    await w.find('#texto').setValue('ibiza')
    await buscar()
    await poner('combustible', 'diesel')
    await buscar()
    expect(router.currentRoute.value.query).toEqual({ texto: 'ibiza', combustible: 'diesel' })

    router.back()
    await esperarAlHistorial()
    await flushPromises()
    expect(router.currentRoute.value.query).toEqual({ texto: 'ibiza' })
    expect(ultimaLlamada()).toEqual({ texto: 'ibiza', pagina: 1, porPagina: 9 })
    expect(campoFormulario(w, 'combustible').props('modelValue')).toBeNull()
    expect(w.find('#texto').element.value).toBe('ibiza')

    router.forward()
    await esperarAlHistorial()
    await flushPromises()
    expect(ultimaLlamada()).toEqual({ texto: 'ibiza', combustible: 'diesel', pagina: 1, porPagina: 9 })
    expect(campoFormulario(w, 'combustible').props('modelValue')).toBe('diesel')
  })
})

describe('limpiar', () => {
  it('quita todos los filtros de la URL y vuelve a mostrar todos los coches', async () => {
    const router = await abrir('/?texto=seat&marca=1&orden=km_asc&pagina=2')
    await botonLimpiar().trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.query).toEqual({})
    expect(ultimaLlamada()).toEqual({ pagina: 1, porPagina: 9 })
    expect(w.find('#texto').element.value).toBe('')
    expect(campoFormulario(w, 'marca_id').props('modelValue')).toBeNull()
    expect(campoFormulario(w, 'orden').props('modelValue')).toBe('recientes')
  })
})

describe('sin resultados', () => {
  it('con filtros dice que no hay coches con esos filtros, deja la barra a la vista y se puede limpiar', async () => {
    buscarCoches.mockImplementation(async (filtros) => respuestaDePagina(filtros.texto ? [] : todos, filtros))
    const router = await abrir()
    await w.find('#texto').setValue('zzz')
    await buscar()
    expect(w.find('main').text()).toContain('No se han encontrado coches con esos filtros.')
    expect(w.find('main').text()).not.toContain('No hay coches disponibles')
    expect(w.find('form[role="search"]').exists()).toBe(true)
    await botonLimpiar().trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.query).toEqual({})
    expect(titulos()).toHaveLength(9)
  })

  it('sin filtros, el catálogo vacío mantiene su mensaje de siempre', async () => {
    buscarCoches.mockResolvedValue(respuestaDePagina([], { pagina: 1, porPagina: 9 }))
    await abrir()
    expect(w.find('main').text()).toContain('No hay coches disponibles en este momento.')
  })

  it('si al endurecer los filtros la página pedida ya no existe, va a la última que quede', async () => {
    buscarCoches.mockImplementation(async (filtros) => respuestaDePagina(filtros.texto ? todos.slice(0, 12) : todos, filtros))
    const router = await abrir('/?texto=x&pagina=3')
    expect(router.currentRoute.value.query).toEqual({ texto: 'x', pagina: '2' })
    expect(titulos()).toHaveLength(3)
  })
})

describe('errores', () => {
  it('si falla la búsqueda lo explica y «Reintentar» repite la misma búsqueda con sus filtros', async () => {
    buscarCoches.mockRejectedValueOnce(new Error('Failed to fetch'))
    await abrir('/?combustible=electrico&pagina=2')
    expect(w.find('main').text()).toContain('No se pudo conectar con el servidor')
    expect(w.find('form[role="search"]').exists()).toBe(true)
    await w.findAll('main button').find((b) => b.text() === 'Reintentar').trigger('click')
    await flushPromises()
    expect(ultimaLlamada()).toEqual({ combustible: 'electrico', pagina: 2, porPagina: 9 })
    expect(titulos().length).toBeGreaterThan(0)
  })

  it('si fallan las marcas, solo se desactiva ese filtro; el listado y el resto de filtros funcionan, y se puede reintentar', async () => {
    listarMarcas.mockRejectedValueOnce(new Error('Failed to fetch'))
    await abrir()
    expect(titulos()).toHaveLength(9)
    expect(campoFormulario(w, 'marca_id').props('disabled')).toBe(true)
    await poner('combustible', 'diesel')
    await buscar()
    expect(ultimaLlamada().combustible).toBe('diesel')
    await w.find('button.reintentar').trigger('click')
    await flushPromises()
    expect(listarMarcas).toHaveBeenCalledTimes(2)
    expect(campoFormulario(w, 'marca_id').props('disabled')).toBeFalsy()
    expect(campoFormulario(w, 'marca_id').props('options')).toEqual(marcas)
  })
})
