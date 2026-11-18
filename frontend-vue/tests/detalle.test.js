import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import App from '../src/App.vue'
import { crearEntornoUI, crearEntornoUIConHistorialReal, crearCocheDePrueba, crearDetalleDePrueba, respuestaDePagina } from './helpers.js'
import { buscarCoches, obtenerCoche } from '../src/servicios/services/cocheService.js'
import { obtenerSesion } from '../src/servicios/services/authService.js'

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
let routerReal // el historial real deja escuchando al navegador (popstate): hay que liberarlo al terminar cada test

beforeEach(() => {
  vi.clearAllMocks()
  obtenerSesion.mockResolvedValue(null)
  buscarCoches.mockImplementation(async (filtros) => respuestaDePagina(todos, filtros))
  obtenerCoche.mockImplementation(async (id) => crearDetalleDePrueba(Number(id), { modelo: `Modelo ${id}` }))
})
afterEach(() => {
  w?.unmount()
  routerReal?.options.history.destroy()
  routerReal = undefined
  document.body.innerHTML = ''
})

async function abrir(ruta) {
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
// atrás y adelante del navegador son asíncronos (evento popstate)
const esperarAlHistorial = () => new Promise((resolver) => setTimeout(resolver, 30))
const normal = (t) => t.replace(/ /g, ' ')
const principal = () => normal(w.find('main').text())

describe('ficha del coche', () => {
  it('muestra los datos del coche y su ficha técnica', async () => {
    obtenerCoche.mockResolvedValue(
      crearDetalleDePrueba(5, { modelo: 'Ibiza', precio: 18500, km: 45000, anio: 2019, potencia_cv: 110, combustible: 'diesel', transmision: 'automatico' })
    )
    await abrir('/coches/5')
    expect(obtenerCoche).toHaveBeenCalledWith('5')
    expect(w.find('main h2').text()).toBe('Seat Ibiza')
    const texto = principal()
    expect(texto).toContain('18.500 €')
    expect(texto).toContain('2019')
    expect(texto).toContain('45.000 km')
    expect(texto).toContain('110 CV')
    expect(texto).toContain('Diésel')
    expect(texto).toContain('Automático')
  })

  it('muestra más información que el listado: descripción y equipamiento', async () => {
    await abrir('/coches/5')
    expect(principal()).toContain('Único dueño y revisiones al día')
    expect(principal()).toContain('Aire acondicionado')
    expect(principal()).toContain('Bluetooth')
  })

  it('si no hay descripción ni equipamiento lo indica', async () => {
    obtenerCoche.mockResolvedValue(crearDetalleDePrueba(5, { descripcion: null, equipamiento: [] }))
    await abrir('/coches/5')
    expect(principal()).toContain('Sin descripción.')
    expect(principal()).toContain('No se ha indicado el equipamiento.')
  })

  it('indica si el coche está disponible o no', async () => {
    await abrir('/coches/5')
    expect(principal()).toContain('Disponible')
    w.unmount()
    obtenerCoche.mockResolvedValue(crearDetalleDePrueba(5, { disponible: false }))
    await abrir('/coches/5')
    expect(principal()).toContain('No disponible')
  })

  it('muestra la galería con la foto principal y se puede cambiar de foto', async () => {
    await abrir('/coches/5')
    expect(w.find('img.grande').attributes('src')).toBe('https://fotos.test/5-b.jpg')
    await w.findAll('.miniaturas button')[0].trigger('click')
    expect(w.find('img.grande').attributes('src')).toBe('https://fotos.test/5-a.jpg')
  })

  it('un visitante sin sesión puede ver la ficha', async () => {
    await abrir('/coches/5')
    expect(w.find('main h2').text()).toBe('Seat Modelo 5')
  })

  it('el título de la pestaña incluye el coche', async () => {
    await abrir('/coches/5')
    expect(document.title).toBe('Concesionario · Seat Modelo 5')
  })
})

describe('estados de la carga', () => {
  it('mientras carga muestra un indicador', async () => {
    let terminar
    obtenerCoche.mockReturnValue(new Promise((resolver) => (terminar = resolver)))
    await abrir('/coches/5')
    expect(w.find('main [role="progressbar"]').exists()).toBe(true)
    expect(principal()).toContain('Cargando coche...')
    terminar(crearDetalleDePrueba(5))
    await flushPromises()
    expect(w.find('main [role="progressbar"]').exists()).toBe(false)
    expect(w.find('main h2').text()).toBe('Seat Modelo 5')
  })

  it('un coche que no existe muestra «Coche no encontrado» con un enlace al listado, y no un error', async () => {
    obtenerCoche.mockRejectedValue(new Error('Coche no encontrado'))
    const router = await abrir('/coches/999')
    expect(principal()).toContain('Coche no encontrado')
    expect(principal()).not.toContain('Reintentar')
    await w.find('main a[href="/"]').trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.name).toBe('listado')
  })

  it('si falla la carga muestra el error con un botón para reintentar', async () => {
    obtenerCoche.mockRejectedValue(new Error('Failed to fetch'))
    await abrir('/coches/5')
    expect(w.find('main [role="alert"]').text()).toContain('No se pudo conectar con el servidor')
    expect(principal()).toContain('Reintentar')
    expect(principal()).not.toContain('Coche no encontrado')
  })

  it('al reintentar tras un error, muestra el coche', async () => {
    obtenerCoche.mockRejectedValueOnce(new Error('Failed to fetch'))
    await abrir('/coches/5')
    await w.findAll('main button').find((b) => b.text().includes('Reintentar')).trigger('click')
    await flushPromises()
    expect(obtenerCoche).toHaveBeenCalledTimes(2)
    expect(w.find('main h2').text()).toBe('Seat Modelo 5')
  })

  it('al pasar de un coche a otro por la URL carga el nuevo', async () => {
    const router = await abrir('/coches/5')
    await router.push('/coches/6')
    await flushPromises()
    expect(obtenerCoche).toHaveBeenLastCalledWith('6')
    expect(w.find('main h2').text()).toBe('Seat Modelo 6')
  })
})

describe('volver al listado', () => {
  it('desde el listado se vuelve a la misma página en la que se estaba', async () => {
    const router = await abrirConHistorialReal('/?pagina=2')
    await w.findAll('article button').find((b) => b.text().includes('Ver detalle')).trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.name).toBe('coche-detalle')
    await w.findAll('main button').find((b) => b.text().includes('Volver al listado')).trigger('click')
    await esperarAlHistorial()
    await flushPromises()
    expect(router.currentRoute.value.fullPath).toBe('/?pagina=2')
    expect(w.find('article h3').text()).toBe('Seat Modelo 10')
  })

  it('si se entra directamente en el detalle, lleva al listado', async () => {
    const router = await abrirConHistorialReal('/coches/5')
    await w.findAll('main button').find((b) => b.text().includes('Volver al listado')).trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.name).toBe('listado')
  })
})
