import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useMarcasStore } from '../src/stores/marcas.js'
import { listarMarcas } from '../src/servicios/services/marcaService.js'

vi.mock('../src/servicios/services/marcaService.js', () => ({ listarMarcas: vi.fn() }))

const marcas = [
  { id: 1, nombre: 'Renault' },
  { id: 2, nombre: 'Seat' }
]
let store

beforeEach(() => {
  vi.clearAllMocks()
  setActivePinia(createPinia())
  store = useMarcasStore()
  listarMarcas.mockResolvedValue(marcas)
})

describe('marcas', () => {
  it('carga las marcas del servidor', async () => {
    await store.cargar()
    expect(store.marcas).toEqual(marcas)
    expect(store.cargadas).toBe(true)
    expect(store.error).toBe('')
    expect(store.cargando).toBe(false)
  })

  it('mientras espera está en estado de carga', async () => {
    let terminar
    listarMarcas.mockReturnValue(new Promise((resolver) => (terminar = resolver)))
    const promesa = store.cargar()
    expect(store.cargando).toBe(true)
    terminar(marcas)
    await promesa
    expect(store.cargando).toBe(false)
  })

  it('una vez cargadas no se vuelven a pedir', async () => {
    await store.cargar()
    await store.cargar()
    expect(listarMarcas).toHaveBeenCalledTimes(1)
  })

  it('se pueden volver a pedir forzándolo', async () => {
    await store.cargar()
    await store.cargar({ forzar: true })
    expect(listarMarcas).toHaveBeenCalledTimes(2)
  })

  it('si se piden varias veces a la vez, solo hay una petición', async () => {
    await Promise.all([store.cargar(), store.cargar(), store.cargar()])
    expect(listarMarcas).toHaveBeenCalledTimes(1)
  })

  it('si falla, guarda un mensaje comprensible y se puede reintentar', async () => {
    listarMarcas.mockRejectedValueOnce(new Error('Failed to fetch'))
    await store.cargar()
    expect(store.error).toMatch(/No se pudo conectar/)
    expect(store.cargadas).toBe(false)
    await store.cargar()
    expect(store.error).toBe('')
    expect(store.marcas).toEqual(marcas)
  })
})
