import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import App from '../src/App.vue'
import {
  crearEntornoUI,
  crearEntornoUIConHistorialReal,
  crearCocheDePrueba,
  crearDetalleDePrueba,
  respuestaDePagina,
  rellenarFormularioCoche,
  campoFormulario
} from './helpers.js'
import { buscarCoches, obtenerCoche, crearCoche } from '../src/servicios/services/cocheService.js'
import { listarMarcas } from '../src/servicios/services/marcaService.js'
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
vi.mock('../src/servicios/services/marcaService.js', () => ({ listarMarcas: vi.fn() }))

const marcas = [
  { id: 1, nombre: 'Seat' },
  { id: 2, nombre: 'Renault' }
]
let catalogo
let w
let routerReal

const conSesion = (rol) => {
  obtenerSesion.mockResolvedValue({ id: 'u1', email: 'a@b.com' })
  obtenerPerfil.mockResolvedValue({ id: 'u1', nombre: 'Ana', rol })
}

beforeEach(() => {
  vi.clearAllMocks()
  obtenerSesion.mockResolvedValue(null)
  catalogo = Array.from({ length: 5 }, (_, i) => crearCocheDePrueba(i + 1))
  listarMarcas.mockResolvedValue(marcas)
  buscarCoches.mockImplementation(async (filtros) => respuestaDePagina(catalogo, filtros))
  obtenerCoche.mockImplementation(async (id) => crearDetalleDePrueba(Number(id), { modelo: catalogo.find((c) => c.id === Number(id))?.modelo ?? 'Ibiza' }))
  crearCoche.mockImplementation(async (datos) => {
    const nuevo = crearCocheDePrueba(100, { ...datos, marca: marcas.find((m) => m.id === datos.marca_id) })
    catalogo.unshift(nuevo)
    return { id: 100, ...datos }
  })
})
afterEach(() => {
  w?.unmount()
  routerReal?.options.history.destroy()
  routerReal = undefined
  document.body.innerHTML = ''
})

async function abrir(ruta = '/coches/nuevo') {
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
const enviar = async () => {
  await w.find('form').trigger('submit')
  await flushPromises()
}
const botonCrear = () => w.findAll('main button').find((b) => b.text().includes('Crear coche'))

describe('acceso a la pantalla', () => {
  it('un administrador ve el formulario y se cargan las marcas', async () => {
    conSesion('admin')
    await abrir()
    expect(w.find('main h2').text()).toBe('Nuevo coche')
    expect(w.find('main form').exists()).toBe(true)
    expect(listarMarcas).toHaveBeenCalledTimes(1)
    expect(campoFormulario(w, 'marca_id').props('options')).toEqual(marcas)
  })

  it('un usuario normal no puede entrar: se le dice que no tiene permiso', async () => {
    conSesion('cliente')
    const router = await abrir()
    expect(router.currentRoute.value.name).toBe('sin-permiso')
    expect(w.find('main form').exists()).toBe(false)
  })

  it('un visitante es llevado al login', async () => {
    const router = await abrir()
    expect(router.currentRoute.value.name).toBe('login')
    expect(router.currentRoute.value.query.redirect).toBe('/coches/nuevo')
  })
})

describe('crear un coche', () => {
  it('con datos válidos lo crea, avisa y lleva a su ficha', async () => {
    conSesion('admin')
    const router = await abrir()
    await rellenarFormularioCoche(w, { descripcion: 'Único dueño', equipamiento: 'GPS, Bluetooth' })
    await enviar()
    expect(crearCoche).toHaveBeenCalledWith({
      marca_id: 1, modelo: 'Ibiza', precio: 18500, km: 45000, anio: 2019, combustible: 'diesel', transmision: 'manual', potencia_cv: 110,
      descripcion: 'Único dueño', equipamiento: ['GPS', 'Bluetooth'], disponible: true
    })
    expect(router.currentRoute.value.name).toBe('coche-detalle')
    expect(router.currentRoute.value.params.id).toBe('100')
    expect(obtenerCoche).toHaveBeenCalledWith('100')
    expect(document.body.textContent).toContain('Coche creado')
  })

  it('con datos no válidos muestra los errores y no llama al servidor', async () => {
    conSesion('admin')
    await abrir()
    await rellenarFormularioCoche(w, { precio: 0 })
    await enviar()
    expect(w.find('#error-precio').text()).toBe('El precio debe ser mayor que 0')
    expect(crearCoche).not.toHaveBeenCalled()
  })

  it('el nuevo coche aparece en el listado sin recargar la página', async () => {
    conSesion('admin')
    const router = await abrir()
    await rellenarFormularioCoche(w, { modelo: 'Tarraco' })
    await enviar()
    await router.push('/')
    await flushPromises()
    expect(w.find('article h3').text()).toBe('Seat Tarraco')
  })

  it('mientras guarda el botón está desactivado', async () => {
    conSesion('admin')
    let terminar
    crearCoche.mockReturnValue(new Promise((resolver) => (terminar = resolver)))
    await abrir()
    await rellenarFormularioCoche(w)
    await enviar()
    expect(botonCrear().attributes('disabled')).toBeDefined()
    terminar({ id: 100 })
    await flushPromises()
  })
})

describe('errores del servidor', () => {
  it('si no tiene permiso (lo impide Supabase) lo explica y conserva lo escrito', async () => {
    conSesion('admin')
    crearCoche.mockRejectedValue(new Error('No autorizado'))
    const router = await abrir()
    await rellenarFormularioCoche(w, { modelo: 'Ibiza' })
    await enviar()
    expect(w.find('main [role="alert"]').text()).toContain('No tienes permiso para realizar esta acción')
    expect(router.currentRoute.value.name).toBe('coche-nuevo')
    expect(w.find('#modelo').element.value).toBe('Ibiza')
    expect(campoFormulario(w, 'precio').props('modelValue')).toBe(18500)
    expect(botonCrear().attributes('disabled')).toBeUndefined()
  })

  it('un error de validación del backend se muestra tal cual', async () => {
    conSesion('admin')
    crearCoche.mockRejectedValue(new Error('Crear coche: referencia a un registro que no existe'))
    await abrir()
    await rellenarFormularioCoche(w)
    await enviar()
    expect(w.find('main [role="alert"]').text()).toContain('Crear coche: referencia a un registro que no existe')
  })

  it('si no hay conexión lo explica', async () => {
    conSesion('admin')
    crearCoche.mockRejectedValue(new Error('Failed to fetch'))
    await abrir()
    await rellenarFormularioCoche(w)
    await enviar()
    expect(w.find('main [role="alert"]').text()).toContain('No se pudo conectar con el servidor')
  })

  it('tras un error se puede corregir y volver a intentarlo', async () => {
    conSesion('admin')
    crearCoche.mockRejectedValueOnce(new Error('Failed to fetch'))
    const router = await abrir()
    await rellenarFormularioCoche(w)
    await enviar()
    expect(router.currentRoute.value.name).toBe('coche-nuevo')
    await enviar()
    expect(router.currentRoute.value.name).toBe('coche-detalle')
    expect(w.find('main [role="alert"]').exists()).toBe(false)
  })

  it('si no se pueden cargar las marcas lo indica y se puede reintentar', async () => {
    conSesion('admin')
    listarMarcas.mockRejectedValueOnce(new Error('Failed to fetch'))
    await abrir()
    expect(w.find('main').text()).toContain('No se pudo conectar con el servidor')
    await w.findAll('main button').find((b) => b.text() === 'Reintentar').trigger('click')
    await flushPromises()
    expect(listarMarcas).toHaveBeenCalledTimes(2)
    expect(w.find('main').text()).not.toContain('No se pudo conectar')
    expect(campoFormulario(w, 'marca_id').props('options')).toEqual(marcas)
  })
})

describe('cancelar', () => {
  it('desde el listado, cancelar vuelve a la misma página', async () => {
    conSesion('admin')
    const router = await abrirConHistorialReal('/?pagina=1')
    await w.findAll('main button').find((b) => b.text().includes('Nuevo coche')).trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.name).toBe('coche-nuevo')
    await w.findAll('main button').find((b) => b.text() === 'Cancelar').trigger('click')
    await new Promise((resolver) => setTimeout(resolver, 30))
    await flushPromises()
    expect(router.currentRoute.value.name).toBe('listado')
    expect(crearCoche).not.toHaveBeenCalled()
  })

  it('si se entró directamente, cancelar lleva al listado', async () => {
    conSesion('admin')
    const router = await abrir()
    await w.findAll('main button').find((b) => b.text() === 'Cancelar').trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.name).toBe('listado')
  })
})
