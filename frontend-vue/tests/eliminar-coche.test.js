import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import App from '../src/App.vue'
import { crearEntornoUI, crearEntornoUIConHistorialReal, crearCocheDePrueba, crearDetalleDePrueba, respuestaDePagina } from './helpers.js'
import { buscarCoches, obtenerCoche, eliminarCoche } from '../src/servicios/services/cocheService.js'
import { obtenerSesion } from '../src/servicios/services/authService.js'
import { obtenerPerfil } from '../src/servicios/services/perfilService.js'

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

let catalogo
let w
let routerReal

const conSesion = (rol) => {
  obtenerSesion.mockResolvedValue({ id: 'u1', email: 'a@b.com' })
  obtenerPerfil.mockResolvedValue({ id: 'u1', nombre: 'Ana', rol })
}
const crearCatalogo = (n) => Array.from({ length: n }, (_, i) => crearCocheDePrueba(i + 1, { modelo: `Modelo ${i + 1}` }))

beforeEach(() => {
  vi.clearAllMocks()
  obtenerSesion.mockResolvedValue(null)
  catalogo = crearCatalogo(5)
  buscarCoches.mockImplementation(async (filtros) => respuestaDePagina(catalogo, filtros))
  obtenerCoche.mockImplementation(async (id) => crearDetalleDePrueba(Number(id), { modelo: `Modelo ${id}` }))
  eliminarCoche.mockImplementation(async (id) => {
    const i = catalogo.findIndex((c) => c.id === Number(id))
    return catalogo.splice(i, 1)[0]
  })
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
const botonesEliminar = () => w.findAll('main button').filter((b) => b.text().includes('Eliminar'))
const dialogo = () => document.body.querySelector('.p-dialog')
const botonDelDialogo = (texto) => [...dialogo().querySelectorAll('button')].find((b) => b.textContent.includes(texto))
const titulos = () => w.findAll('article h3').map((h) => h.text())
const pulsarEliminar = async (indice = 0) => {
  await botonesEliminar()[indice].trigger('click')
  await flushPromises()
}
const responder = async (texto) => {
  botonDelDialogo(texto).click()
  await flushPromises()
}

describe('quién ve el botón «Eliminar»', () => {
  it('un administrador lo ve en cada tarjeta del listado', async () => {
    conSesion('admin')
    await abrir()
    expect(botonesEliminar()).toHaveLength(5)
  })

  it('un usuario normal y un visitante no lo ven, ni en el listado ni en la ficha', async () => {
    conSesion('cliente')
    await abrir()
    expect(botonesEliminar()).toHaveLength(0)
    w.unmount()
    await abrir('/coches/3')
    expect(botonesEliminar()).toHaveLength(0)
    w.unmount()
    obtenerSesion.mockResolvedValue(null)
    await abrir()
    expect(botonesEliminar()).toHaveLength(0)
  })
})

describe('eliminar desde el listado', () => {
  it('pide confirmación nombrando el coche y avisando de que no se puede deshacer, sin borrar todavía', async () => {
    conSesion('admin')
    await abrir()
    await pulsarEliminar(1)
    expect(dialogo()).not.toBeNull()
    expect(dialogo().textContent).toContain('Eliminar coche')
    expect(dialogo().textContent).toContain('Seat Modelo 2')
    expect(dialogo().textContent).toContain('no se puede deshacer')
    expect(dialogo().textContent).toContain('sus fotos')
    expect(eliminarCoche).not.toHaveBeenCalled()
  })

  it('si se cancela, no se elimina nada y el listado queda igual', async () => {
    conSesion('admin')
    await abrir()
    await pulsarEliminar(1)
    await responder('Cancelar')
    expect(eliminarCoche).not.toHaveBeenCalled()
    expect(titulos()).toHaveLength(5)
    expect(buscarCoches).toHaveBeenCalledTimes(1)
  })

  it('si se confirma, lo elimina, avisa y el coche desaparece del listado sin recargar la página', async () => {
    conSesion('admin')
    await abrir()
    await pulsarEliminar(1)
    await responder('Eliminar')
    expect(eliminarCoche).toHaveBeenCalledTimes(1)
    expect(eliminarCoche).toHaveBeenCalledWith(2)
    expect(document.body.textContent).toContain('Coche eliminado')
    expect(buscarCoches).toHaveBeenCalledTimes(2) // se vuelve a pedir la página actual
    expect(titulos()).toEqual(['Seat Modelo 1', 'Seat Modelo 3', 'Seat Modelo 4', 'Seat Modelo 5'])
    expect(w.find('main').text()).toContain('Mostrando 1-4 de 4 coches')
  })

  it('mientras se elimina, los botones de borrar están desactivados', async () => {
    conSesion('admin')
    let terminar
    eliminarCoche.mockReturnValue(new Promise((resolver) => (terminar = resolver)))
    await abrir()
    await pulsarEliminar(0)
    await responder('Eliminar')
    expect(botonesEliminar().every((b) => b.attributes('disabled') !== undefined)).toBe(true)
    terminar({ id: 1 })
    await flushPromises()
    expect(botonesEliminar().every((b) => b.attributes('disabled') === undefined)).toBe(true)
  })

  it('si el servidor lo rechaza por permisos, lo explica y el coche sigue en el listado', async () => {
    conSesion('admin')
    eliminarCoche.mockRejectedValue(new Error('No autorizado'))
    await abrir()
    await pulsarEliminar(0)
    await responder('Eliminar')
    expect(document.body.textContent).toContain('No se pudo eliminar el coche')
    expect(document.body.textContent).toContain('No tienes permiso para realizar esta acción')
    expect(document.body.textContent).not.toContain('Coche eliminado')
    expect(titulos()).toHaveLength(5)
    expect(botonesEliminar().every((b) => b.attributes('disabled') === undefined)).toBe(true)
  })

  it('si no hay conexión, lo explica y se puede volver a intentar', async () => {
    conSesion('admin')
    eliminarCoche.mockRejectedValueOnce(new Error('Failed to fetch'))
    await abrir()
    await pulsarEliminar(0)
    await responder('Eliminar')
    expect(document.body.textContent).toContain('No se pudo conectar con el servidor')
    await pulsarEliminar(0)
    await responder('Eliminar')
    expect(eliminarCoche).toHaveBeenCalledTimes(2)
    expect(titulos()).toHaveLength(4)
  })

  it('si el coche ya no existe (lo borró otra persona), muestra el mensaje del servidor', async () => {
    conSesion('admin')
    eliminarCoche.mockRejectedValue(new Error('Coche no encontrado o sin permisos'))
    await abrir()
    await pulsarEliminar(0)
    await responder('Eliminar')
    expect(document.body.textContent).toContain('Coche no encontrado o sin permisos')
  })
})

describe('el listado tras eliminar', () => {
  it('si se elimina el único coche de la última página, pasa a la página anterior', async () => {
    conSesion('admin')
    catalogo = crearCatalogo(10) // 9 por página: la página 2 tiene un solo coche
    const router = await abrir('/?pagina=2')
    expect(titulos()).toEqual(['Seat Modelo 10'])
    await pulsarEliminar(0)
    await responder('Eliminar')
    expect(router.currentRoute.value.query.pagina).toBeUndefined()
    expect(titulos()).toHaveLength(9)
    expect(w.find('main').text()).toContain('Mostrando 1-9 de 9 coches')
  })

  it('si se eliminan todos los coches, aparece el mensaje de que no hay ninguno', async () => {
    conSesion('admin')
    catalogo = crearCatalogo(1)
    await abrir()
    await pulsarEliminar(0)
    await responder('Eliminar')
    expect(w.find('main').text()).toContain('No hay coches disponibles en este momento.')
    expect(w.findAll('article')).toHaveLength(0)
  })

  it('si no es el último de su página, se queda en la misma página', async () => {
    conSesion('admin')
    catalogo = crearCatalogo(12)
    const router = await abrir('/?pagina=2')
    expect(titulos()).toHaveLength(3)
    await pulsarEliminar(0)
    await responder('Eliminar')
    expect(router.currentRoute.value.query.pagina).toBe('2')
    expect(titulos()).toEqual(['Seat Modelo 11', 'Seat Modelo 12'])
  })
})

describe('eliminar con una búsqueda activa', () => {
  it('tras eliminar, se vuelve a pedir la misma página con los mismos filtros', async () => {
    conSesion('admin')
    await abrir('/?texto=Modelo&combustible=gasolina')
    await pulsarEliminar(0)
    await responder('Eliminar')
    expect(buscarCoches).toHaveBeenLastCalledWith({ texto: 'Modelo', combustible: 'gasolina', pagina: 1, porPagina: 9 })
    expect(titulos()).toHaveLength(4)
  })
})

describe('eliminar desde la ficha', () => {
  it('un administrador ve «Eliminar» junto a «Editar»', async () => {
    conSesion('admin')
    await abrir('/coches/3')
    expect(botonesEliminar()).toHaveLength(1)
    expect(w.findAll('main button').some((b) => b.text().includes('Editar'))).toBe(true)
  })

  it('pide confirmación y, si se cancela, se queda en la ficha', async () => {
    conSesion('admin')
    const router = await abrir('/coches/3')
    await pulsarEliminar()
    expect(dialogo().textContent).toContain('Seat Modelo 3')
    await responder('Cancelar')
    expect(eliminarCoche).not.toHaveBeenCalled()
    expect(router.currentRoute.value.name).toBe('coche-detalle')
  })

  it('al confirmar lo elimina, avisa y lleva al listado, donde ya no está', async () => {
    conSesion('admin')
    const router = await abrir('/coches/3')
    await pulsarEliminar()
    await responder('Eliminar')
    expect(eliminarCoche).toHaveBeenCalledWith(3)
    expect(router.currentRoute.value.name).toBe('listado')
    expect(document.body.textContent).toContain('Coche eliminado')
    expect(titulos()).toEqual(['Seat Modelo 1', 'Seat Modelo 2', 'Seat Modelo 4', 'Seat Modelo 5'])
  })

  it('la ficha eliminada no queda en el historial: «atrás» no vuelve a ella', async () => {
    conSesion('admin')
    const router = await abrirConHistorialReal('/')
    await w.find('article a[href="/coches/3"]').trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.name).toBe('coche-detalle')
    await pulsarEliminar()
    await responder('Eliminar')
    expect(router.currentRoute.value.name).toBe('listado')
    router.back()
    await new Promise((resolver) => setTimeout(resolver, 30))
    await flushPromises()
    expect(router.currentRoute.value.name).toBe('listado')
  })

  it('si falla, se queda en la ficha y lo explica', async () => {
    conSesion('admin')
    eliminarCoche.mockRejectedValue(new Error('No autorizado'))
    const router = await abrir('/coches/3')
    await pulsarEliminar()
    await responder('Eliminar')
    expect(router.currentRoute.value.name).toBe('coche-detalle')
    expect(document.body.textContent).toContain('No tienes permiso para realizar esta acción')
    expect(w.find('main').text()).toContain('Modelo 3')
  })
})
