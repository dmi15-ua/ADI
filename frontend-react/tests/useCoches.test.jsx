import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useCoches } from '../src/hooks/useCoches.js'
import { buscarCoches } from '../src/servicios/services/cocheService.js'
import { crearCoche, respuestaDePagina } from './helpers.jsx'

vi.mock('../src/servicios/services/cocheService.js', () => ({ buscarCoches: vi.fn() }))

const todos = Array.from({ length: 25 }, (_, i) => crearCoche(i + 1))

beforeEach(() => {
  vi.clearAllMocks()
  buscarCoches.mockImplementation(async ({ pagina, porPagina }) => respuestaDePagina(todos, { pagina, porPagina }))
})

describe('useCoches', () => {
  it('empieza cargando y pide la primera página con el tamaño de página', async () => {
    const { result } = renderHook(() => useCoches())
    expect(result.current.cargando).toBe(true)
    await waitFor(() => expect(result.current.cargando).toBe(false))
    expect(buscarCoches).toHaveBeenCalledWith({ pagina: 1, porPagina: 9 })
    expect(result.current.items).toHaveLength(9)
    expect(result.current.total).toBe(25)
    expect(result.current.totalPaginas).toBe(3)
    expect(result.current.pagina).toBe(1)
    expect(result.current.error).toBe('')
  })

  it('al cambiar de página pide esa página', async () => {
    const { result } = renderHook(() => useCoches())
    await waitFor(() => expect(result.current.cargando).toBe(false))
    act(() => result.current.irAPagina(3))
    await waitFor(() => expect(result.current.pagina).toBe(3))
    await waitFor(() => expect(result.current.cargando).toBe(false))
    expect(buscarCoches).toHaveBeenLastCalledWith({ pagina: 3, porPagina: 9 })
    expect(result.current.items.map((c) => c.id)).toEqual([19, 20, 21, 22, 23, 24, 25])
  })

  it('al cambiar de página mantiene los coches anteriores mientras carga', async () => {
    const { result } = renderHook(() => useCoches())
    await waitFor(() => expect(result.current.cargando).toBe(false))
    let terminar
    buscarCoches.mockReturnValueOnce(new Promise((resolver) => (terminar = resolver)))
    act(() => result.current.irAPagina(2))
    await waitFor(() => expect(result.current.cargando).toBe(true))
    expect(result.current.items).toHaveLength(9)
    await act(async () => terminar(respuestaDePagina(todos, { pagina: 2, porPagina: 9 })))
    await waitFor(() => expect(result.current.cargando).toBe(false))
  })

  it('si se piden dos páginas seguidas, solo cuenta la última aunque la primera tarde más', async () => {
    const { result } = renderHook(() => useCoches())
    await waitFor(() => expect(result.current.cargando).toBe(false))
    let terminarLenta
    buscarCoches.mockReturnValueOnce(new Promise((resolver) => (terminarLenta = resolver)))
    act(() => result.current.irAPagina(2))
    await waitFor(() => expect(buscarCoches).toHaveBeenCalledTimes(2))
    act(() => result.current.irAPagina(3))
    await waitFor(() => expect(result.current.pagina).toBe(3))
    await waitFor(() => expect(result.current.items[0]?.id).toBe(19))
    await act(async () => terminarLenta(respuestaDePagina(todos, { pagina: 2, porPagina: 9 })))
    expect(result.current.items[0].id).toBe(19)
  })

  it('sin coches no es un error', async () => {
    buscarCoches.mockResolvedValue(respuestaDePagina([], { pagina: 1, porPagina: 9 }))
    const { result } = renderHook(() => useCoches())
    await waitFor(() => expect(result.current.cargando).toBe(false))
    expect(result.current.items).toEqual([])
    expect(result.current.error).toBe('')
  })

  it('si falla, guarda un mensaje comprensible, y recargar lo vuelve a intentar', async () => {
    buscarCoches.mockRejectedValueOnce(new Error('Failed to fetch'))
    const { result } = renderHook(() => useCoches())
    await waitFor(() => expect(result.current.error).toContain('No se pudo conectar con el servidor'))
    expect(result.current.items).toEqual([])
    await act(() => result.current.recargar())
    expect(result.current.error).toBe('')
    expect(result.current.items).toHaveLength(9)
  })

  it('un error ya escrito en español se muestra tal cual', async () => {
    buscarCoches.mockRejectedValueOnce(new Error('Buscar coches: error interno'))
    const { result } = renderHook(() => useCoches())
    await waitFor(() => expect(result.current.error).toBe('Buscar coches: error interno'))
  })

  it('si la página pedida ya no existe, pasa a la última que quede', async () => {
    const pocos = todos.slice(0, 10) // 2 páginas
    buscarCoches.mockImplementation(async ({ pagina, porPagina }) => respuestaDePagina(pocos, { pagina, porPagina }))
    const { result } = renderHook(() => useCoches())
    await waitFor(() => expect(result.current.cargando).toBe(false))
    act(() => result.current.irAPagina(5))
    await waitFor(() => expect(result.current.pagina).toBe(2))
    await waitFor(() => expect(result.current.items).toHaveLength(1))
  })

  it('recargar repite la petición de la página actual', async () => {
    const { result } = renderHook(() => useCoches())
    await waitFor(() => expect(result.current.cargando).toBe(false))
    act(() => result.current.irAPagina(2))
    await waitFor(() => expect(result.current.cargando).toBe(false))
    await waitFor(() => expect(result.current.items[0]?.id).toBe(10))
    await act(() => result.current.recargar())
    expect(buscarCoches).toHaveBeenLastCalledWith({ pagina: 2, porPagina: 9 })
  })
})
