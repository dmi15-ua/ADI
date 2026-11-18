import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { SesionProvider, useSesion } from '../src/contexto/SesionContext.jsx'
import { login, logout, obtenerSesion } from '../src/servicios/services/authService.js'
import { obtenerPerfil } from '../src/servicios/services/perfilService.js'

vi.mock('../src/servicios/services/authService.js', () => ({ login: vi.fn(), logout: vi.fn(), obtenerSesion: vi.fn() }))
vi.mock('../src/servicios/services/perfilService.js', () => ({ obtenerPerfil: vi.fn() }))

const persona = { id: 'u1', email: 'ana@ua.es' }
const montar = () => renderHook(() => useSesion(), { wrapper: SesionProvider })

beforeEach(() => {
  vi.clearAllMocks()
  obtenerSesion.mockResolvedValue(null)
})

describe('al arrancar', () => {
  it('sin sesión guardada queda iniciada y sin usuario', async () => {
    const { result } = montar()
    expect(result.current.iniciada).toBe(false)
    await waitFor(() => expect(result.current.iniciada).toBe(true))
    expect(result.current.autenticado).toBe(false)
    expect(result.current.esAdmin).toBe(false)
  })

  it('con una sesión guardada de administrador la restaura, con su perfil', async () => {
    obtenerSesion.mockResolvedValue(persona)
    obtenerPerfil.mockResolvedValue({ id: 'u1', nombre: 'Ana', rol: 'admin' })
    const { result } = montar()
    await waitFor(() => expect(result.current.iniciada).toBe(true))
    expect(result.current.autenticado).toBe(true)
    expect(result.current.esAdmin).toBe(true)
    expect(result.current.nombre).toBe('Ana')
  })

  it('un usuario normal no es administrador', async () => {
    obtenerSesion.mockResolvedValue(persona)
    obtenerPerfil.mockResolvedValue({ id: 'u1', nombre: 'Ana', rol: 'cliente' })
    const { result } = montar()
    await waitFor(() => expect(result.current.iniciada).toBe(true))
    expect(result.current.autenticado).toBe(true)
    expect(result.current.esAdmin).toBe(false)
  })

  it('si no se puede leer el perfil, se trata como usuario normal y se muestra el email', async () => {
    obtenerSesion.mockResolvedValue(persona)
    obtenerPerfil.mockRejectedValue(new Error('Perfil no encontrado o sin permisos'))
    const { result } = montar()
    await waitFor(() => expect(result.current.iniciada).toBe(true))
    expect(result.current.autenticado).toBe(true)
    expect(result.current.esAdmin).toBe(false)
    expect(result.current.nombre).toBe('ana@ua.es')
  })

  it('si falla la lectura de la sesión guardada, empieza sin sesión', async () => {
    obtenerSesion.mockRejectedValue(new Error('Failed to fetch'))
    const { result } = montar()
    await waitFor(() => expect(result.current.iniciada).toBe(true))
    expect(result.current.autenticado).toBe(false)
  })
})

describe('entrar y salir', () => {
  it('entrar con credenciales correctas deja la sesión iniciada', async () => {
    login.mockResolvedValue({ usuario: persona, sesion: {} })
    obtenerPerfil.mockResolvedValue({ id: 'u1', nombre: 'Ana', rol: 'admin' })
    const { result } = montar()
    await waitFor(() => expect(result.current.iniciada).toBe(true))
    await act(() => result.current.entrar('ana@ua.es', 'secreto123'))
    expect(login).toHaveBeenCalledWith({ email: 'ana@ua.es', password: 'secreto123' })
    expect(result.current.autenticado).toBe(true)
    expect(result.current.esAdmin).toBe(true)
  })

  it('con credenciales incorrectas el error llega a quien lo pidió y no hay sesión', async () => {
    login.mockRejectedValue(new Error('Invalid login credentials'))
    const { result } = montar()
    await waitFor(() => expect(result.current.iniciada).toBe(true))
    await act(async () => {
      await expect(result.current.entrar('ana@ua.es', 'mala')).rejects.toThrow('Invalid login credentials')
    })
    expect(result.current.autenticado).toBe(false)
  })

  it('salir borra el usuario y el perfil', async () => {
    obtenerSesion.mockResolvedValue(persona)
    obtenerPerfil.mockResolvedValue({ id: 'u1', nombre: 'Ana', rol: 'admin' })
    logout.mockResolvedValue()
    const { result } = montar()
    await waitFor(() => expect(result.current.autenticado).toBe(true))
    await act(() => result.current.salir())
    expect(logout).toHaveBeenCalledTimes(1)
    expect(result.current.autenticado).toBe(false)
    expect(result.current.esAdmin).toBe(false)
  })

  it('aunque falle el cierre en el servidor, la interfaz deja de mostrar al usuario', async () => {
    obtenerSesion.mockResolvedValue(persona)
    obtenerPerfil.mockResolvedValue({ id: 'u1', nombre: 'Ana', rol: 'admin' })
    logout.mockRejectedValue(new Error('Failed to fetch'))
    const { result } = montar()
    await waitFor(() => expect(result.current.autenticado).toBe(true))
    await act(async () => {
      await expect(result.current.salir()).rejects.toThrow('Failed to fetch')
    })
    expect(result.current.autenticado).toBe(false)
  })

  it('usar el hook fuera del proveedor da un error claro', () => {
    expect(() => renderHook(() => useSesion())).toThrow('useSesion debe usarse dentro de <SesionProvider>')
  })
})
