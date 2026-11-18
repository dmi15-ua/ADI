import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useCochesStore } from '../src/stores/coches.js'
import { buscarCoches, obtenerCoche, crearCoche, actualizarCoche, eliminarCoche } from '../src/servicios/services/cocheService.js'
import { crearCocheDePrueba, crearDetalleDePrueba, respuestaDePagina } from './helpers.js'

vi.mock('../src/servicios/services/cocheService.js', () => ({ buscarCoches: vi.fn(), obtenerCoche: vi.fn(), crearCoche: vi.fn(), actualizarCoche: vi.fn(), eliminarCoche: vi.fn() }))

const todos = Array.from({ length: 25 }, (_, i) => crearCocheDePrueba(i + 1))
let coches

beforeEach(() => {
  vi.clearAllMocks()
  setActivePinia(createPinia())
  coches = useCochesStore()
  buscarCoches.mockImplementation(async ({ pagina, porPagina }) => respuestaDePagina(todos, { pagina, porPagina }))
})

describe('cargar', () => {
  it('pide la página al servidor con el tamaño de página y guarda el resultado', async () => {
    await coches.cargar({ pagina: 2 })
    expect(buscarCoches).toHaveBeenCalledWith({ pagina: 2, porPagina: 9 })
    expect(coches.items.map((c) => c.id)).toEqual([10, 11, 12, 13, 14, 15, 16, 17, 18])
    expect(coches.total).toBe(25)
    expect(coches.totalPaginas).toBe(3)
    expect(coches.pagina).toBe(2)
    expect(coches.error).toBe('')
    expect(coches.cargando).toBe(false)
  })

  it('sin indicar página, usa la actual', async () => {
    await coches.cargar({ pagina: 3 })
    await coches.cargar()
    expect(buscarCoches).toHaveBeenLastCalledWith({ pagina: 3, porPagina: 9 })
  })

  it('mientras espera la respuesta está en estado de carga', async () => {
    let terminar
    buscarCoches.mockReturnValue(new Promise((resolver) => (terminar = resolver)))
    const promesa = coches.cargar()
    expect(coches.cargando).toBe(true)
    terminar(respuestaDePagina(todos, { pagina: 1, porPagina: 9 }))
    await promesa
    expect(coches.cargando).toBe(false)
  })

  it('sin coches no es un error: la lista queda vacía', async () => {
    buscarCoches.mockResolvedValue({ datos: [], pagina: 1, porPagina: 9, total: 0, totalPaginas: 0 })
    await coches.cargar()
    expect(coches.items).toEqual([])
    expect(coches.total).toBe(0)
    expect(coches.error).toBe('')
  })

  it('si falla, guarda un mensaje comprensible y vacía la lista', async () => {
    await coches.cargar()
    buscarCoches.mockRejectedValue(new Error('Failed to fetch'))
    await coches.cargar()
    expect(coches.error).toMatch(/No se pudo conectar/)
    expect(coches.items).toEqual([])
    expect(coches.cargando).toBe(false)
  })

  it('un error posterior que se resuelve limpia el mensaje', async () => {
    buscarCoches.mockRejectedValueOnce(new Error('Failed to fetch'))
    await coches.cargar()
    expect(coches.error).not.toBe('')
    await coches.reintentar()
    expect(coches.error).toBe('')
    expect(coches.items).toHaveLength(9)
  })

  it('reintentar vuelve a pedir la misma página', async () => {
    await coches.cargar({ pagina: 2 })
    await coches.reintentar()
    expect(buscarCoches).toHaveBeenCalledTimes(2)
    expect(buscarCoches).toHaveBeenLastCalledWith({ pagina: 2, porPagina: 9 })
  })

  it('si se piden dos páginas seguidas, solo cuenta la última aunque la primera tarde más', async () => {
    let terminarLenta
    buscarCoches.mockReturnValueOnce(new Promise((resolver) => (terminarLenta = resolver)))
    const lenta = coches.cargar({ pagina: 1 })
    await coches.cargar({ pagina: 2 })
    terminarLenta(respuestaDePagina(todos, { pagina: 1, porPagina: 9 }))
    await lenta
    expect(coches.pagina).toBe(2)
    expect(coches.items[0].id).toBe(10)
    expect(coches.cargando).toBe(false)
  })
})

describe('detalle de un coche', () => {
  it('pide el coche y lo guarda con su marca y sus fotos', async () => {
    obtenerCoche.mockResolvedValue(crearDetalleDePrueba(5))
    await coches.cargarDetalle('5')
    expect(obtenerCoche).toHaveBeenCalledWith('5')
    expect(coches.detalle.id).toBe(5)
    expect(coches.detalle.foto_coche).toHaveLength(3)
    expect(coches.cargandoDetalle).toBe(false)
    expect(coches.errorDetalle).toBe('')
    expect(coches.detalleNoEncontrado).toBe(false)
  })

  it('mientras espera la respuesta está en estado de carga', async () => {
    let terminar
    obtenerCoche.mockReturnValue(new Promise((resolver) => (terminar = resolver)))
    const promesa = coches.cargarDetalle('5')
    expect(coches.cargandoDetalle).toBe(true)
    terminar(crearDetalleDePrueba(5))
    await promesa
    expect(coches.cargandoDetalle).toBe(false)
  })

  it('un coche que no existe se distingue de un error al cargarlo', async () => {
    obtenerCoche.mockRejectedValue(new Error('Coche no encontrado'))
    await coches.cargarDetalle('999')
    expect(coches.detalleNoEncontrado).toBe(true)
    expect(coches.errorDetalle).toBe('')
    expect(coches.detalle).toBeNull()
  })

  it('un fallo al cargar guarda un mensaje comprensible', async () => {
    obtenerCoche.mockRejectedValue(new Error('Failed to fetch'))
    await coches.cargarDetalle('5')
    expect(coches.errorDetalle).toMatch(/No se pudo conectar/)
    expect(coches.detalleNoEncontrado).toBe(false)
    expect(coches.cargandoDetalle).toBe(false)
  })

  it('al cargar otro coche se vacía el anterior y se limpian los errores', async () => {
    obtenerCoche.mockResolvedValueOnce(crearDetalleDePrueba(5))
    await coches.cargarDetalle('5')
    obtenerCoche.mockReturnValue(new Promise(() => {}))
    coches.cargarDetalle('6')
    expect(coches.detalle).toBeNull()
    expect(coches.errorDetalle).toBe('')
  })

  it('reintentar vuelve a pedir el mismo coche', async () => {
    obtenerCoche.mockRejectedValueOnce(new Error('Failed to fetch'))
    obtenerCoche.mockResolvedValueOnce(crearDetalleDePrueba(5))
    await coches.cargarDetalle('5')
    await coches.reintentarDetalle()
    expect(obtenerCoche).toHaveBeenCalledTimes(2)
    expect(obtenerCoche).toHaveBeenLastCalledWith('5')
    expect(coches.detalle.id).toBe(5)
    expect(coches.errorDetalle).toBe('')
  })

  it('si se piden dos coches seguidos, solo cuenta el último aunque el primero tarde más', async () => {
    let terminarLento
    obtenerCoche.mockReturnValueOnce(new Promise((resolver) => (terminarLento = resolver)))
    obtenerCoche.mockResolvedValueOnce(crearDetalleDePrueba(6))
    const lento = coches.cargarDetalle('5')
    await coches.cargarDetalle('6')
    terminarLento(crearDetalleDePrueba(5))
    await lento
    expect(coches.detalle.id).toBe(6)
    expect(coches.cargandoDetalle).toBe(false)
  })
})

describe('crear un coche', () => {
  const datos = { marca_id: 1, modelo: 'Ibiza', precio: 18500, km: 45000, anio: 2019, combustible: 'diesel', transmision: 'manual', potencia_cv: 110 }

  it('lo envía al servicio y devuelve el coche creado', async () => {
    crearCoche.mockResolvedValue({ id: 77, ...datos })
    const creado = await coches.crear(datos)
    expect(crearCoche).toHaveBeenCalledWith(datos)
    expect(creado.id).toBe(77)
  })

  it('si falla, el error llega a quien lo pidió', async () => {
    crearCoche.mockRejectedValue(new Error('No autorizado'))
    await expect(coches.crear(datos)).rejects.toThrow('No autorizado')
  })
})

describe('actualizar un coche', () => {
  it('envía al servicio el id y solo los cambios, y devuelve el coche actualizado', async () => {
    actualizarCoche.mockResolvedValue({ id: 5, precio: 9000 })
    const actualizado = await coches.actualizar('5', { precio: 9000 })
    expect(actualizarCoche).toHaveBeenCalledWith('5', { precio: 9000 })
    expect(actualizado.precio).toBe(9000)
  })

  it('si falla, el error llega a quien lo pidió', async () => {
    actualizarCoche.mockRejectedValue(new Error('No autorizado'))
    await expect(coches.actualizar('5', { precio: 9000 })).rejects.toThrow('No autorizado')
  })
})

describe('eliminar un coche', () => {
  it('llama al servicio con el id y devuelve el coche eliminado', async () => {
    eliminarCoche.mockResolvedValue({ id: 5 })
    const eliminado = await coches.eliminar(5)
    expect(eliminarCoche).toHaveBeenCalledWith(5)
    expect(eliminado.id).toBe(5)
  })

  it('mientras se elimina indica cuál es, y después lo libera', async () => {
    let terminar
    eliminarCoche.mockReturnValue(new Promise((resolver) => (terminar = resolver)))
    const pendiente = coches.eliminar(5)
    expect(coches.eliminandoId).toBe(5)
    terminar({ id: 5 })
    await pendiente
    expect(coches.eliminandoId).toBeNull()
  })

  it('si falla, el error llega a quien lo pidió y también se libera', async () => {
    eliminarCoche.mockRejectedValue(new Error('No autorizado'))
    await expect(coches.eliminar(5)).rejects.toThrow('No autorizado')
    expect(coches.eliminandoId).toBeNull()
  })
})
