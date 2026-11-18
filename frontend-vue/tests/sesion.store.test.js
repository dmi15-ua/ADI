import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useSesionStore } from '../src/stores/sesion.js'
import { login, logout, obtenerSesion, registrar } from '../src/servicios/services/authService.js'
import { obtenerPerfil } from '../src/servicios/services/perfilService.js'

vi.mock('../src/servicios/services/authService.js', () => ({
  login: vi.fn(),
  logout: vi.fn(),
  obtenerSesion: vi.fn(),
  registrar: vi.fn()
}))
vi.mock('../src/servicios/services/perfilService.js', () => ({ obtenerPerfil: vi.fn() }))

const usuario = { id: 'u1', email: 'ana@ua.es' }
let sesion

beforeEach(() => {
  vi.clearAllMocks()
  setActivePinia(createPinia())
  sesion = useSesionStore()
  obtenerSesion.mockResolvedValue(null)
  logout.mockResolvedValue(undefined)
})

describe('estado inicial', () => {
  it('no hay sesión y todavía no se ha comprobado', () => {
    expect(sesion.autenticado).toBe(false)
    expect(sesion.esAdmin).toBe(false)
    expect(sesion.iniciada).toBe(false)
    expect(sesion.nombre).toBe('')
  })
})

describe('iniciar (restaurar la sesión guardada)', () => {
  it('sin sesión guardada, queda comprobada y sin usuario', async () => {
    await sesion.iniciar()
    expect(sesion.iniciada).toBe(true)
    expect(sesion.autenticado).toBe(false)
  })

  it('con sesión guardada, carga el usuario y su perfil', async () => {
    obtenerSesion.mockResolvedValue(usuario)
    obtenerPerfil.mockResolvedValue({ id: 'u1', nombre: 'Ana', rol: 'cliente' })
    await sesion.iniciar()
    expect(sesion.autenticado).toBe(true)
    expect(sesion.nombre).toBe('Ana')
    expect(sesion.esAdmin).toBe(false)
    expect(obtenerPerfil).toHaveBeenCalledWith('u1')
  })

  it('un perfil con rol admin convierte al usuario en administrador', async () => {
    obtenerSesion.mockResolvedValue(usuario)
    obtenerPerfil.mockResolvedValue({ id: 'u1', nombre: 'Ana', rol: 'admin' })
    await sesion.iniciar()
    expect(sesion.esAdmin).toBe(true)
  })

  it('si no se puede leer el perfil, el usuario sigue dentro pero sin permisos de administrador', async () => {
    obtenerSesion.mockResolvedValue(usuario)
    obtenerPerfil.mockRejectedValue(new Error('sin perfil'))
    await sesion.iniciar()
    expect(sesion.autenticado).toBe(true)
    expect(sesion.esAdmin).toBe(false)
    expect(sesion.nombre).toBe('ana@ua.es') // sin perfil se muestra el email
  })

  it('si falla la restauración, queda sin sesión pero comprobada', async () => {
    obtenerSesion.mockRejectedValue(new Error('sin red'))
    await sesion.iniciar()
    expect(sesion.iniciada).toBe(true)
    expect(sesion.autenticado).toBe(false)
  })

  it('llamarla varias veces solo consulta una vez la sesión guardada', async () => {
    await Promise.all([sesion.iniciar(), sesion.iniciar()])
    await sesion.iniciar()
    expect(obtenerSesion).toHaveBeenCalledTimes(1)
  })
})

describe('entrar (login)', () => {
  it('con credenciales correctas guarda el usuario y el perfil', async () => {
    login.mockResolvedValue({ usuario, sesion: { access_token: 'jwt' } })
    obtenerPerfil.mockResolvedValue({ id: 'u1', nombre: 'Ana', rol: 'admin' })
    await sesion.entrar('ana@ua.es', 'secreto123')
    expect(login).toHaveBeenCalledWith({ email: 'ana@ua.es', password: 'secreto123' })
    expect(sesion.autenticado).toBe(true)
    expect(sesion.esAdmin).toBe(true)
    expect(sesion.cargando).toBe(false)
  })

  it('con credenciales incorrectas lanza el error y no cambia el estado', async () => {
    login.mockRejectedValue(new Error('Invalid login credentials'))
    await expect(sesion.entrar('ana@ua.es', 'mala')).rejects.toThrow('Invalid login credentials')
    expect(sesion.autenticado).toBe(false)
    expect(sesion.cargando).toBe(false)
  })

  it('mientras espera la respuesta está en estado de carga', async () => {
    let terminar
    login.mockReturnValue(new Promise((resolver) => (terminar = resolver)))
    obtenerPerfil.mockResolvedValue({ id: 'u1', nombre: 'Ana', rol: 'cliente' })
    const promesa = sesion.entrar('ana@ua.es', 'secreto123')
    expect(sesion.cargando).toBe(true)
    terminar({ usuario })
    await promesa
    expect(sesion.cargando).toBe(false)
  })
})

describe('salir (logout)', () => {
  async function conSesion() {
    login.mockResolvedValue({ usuario })
    obtenerPerfil.mockResolvedValue({ id: 'u1', nombre: 'Ana', rol: 'admin' })
    await sesion.entrar('ana@ua.es', 'secreto123')
  }

  it('cierra la sesión y borra el usuario y el perfil de la memoria', async () => {
    await conSesion()
    await sesion.salir()
    expect(logout).toHaveBeenCalled()
    expect(sesion.autenticado).toBe(false)
    expect(sesion.esAdmin).toBe(false)
    expect(sesion.perfil).toBeNull()
    expect(sesion.nombre).toBe('')
  })

  it('aunque falle el servidor, la interfaz deja de mostrar los datos del usuario y se informa del error', async () => {
    await conSesion()
    logout.mockRejectedValue(new Error('sin red'))
    await expect(sesion.salir()).rejects.toThrow('sin red')
    expect(sesion.autenticado).toBe(false)
    expect(sesion.perfil).toBeNull()
  })
})

describe('registrarse', () => {
  const datos = { nombre: 'Ana', email: 'ana@ua.es', password: 'secreto123' }

  it('si Supabase devuelve una sesión, el usuario queda dentro con su perfil', async () => {
    registrar.mockResolvedValue({ usuario, sesion: { access_token: 'jwt' } })
    obtenerPerfil.mockResolvedValue({ id: 'u1', nombre: 'Ana', rol: 'cliente' })
    expect(await sesion.registrarse(datos)).toBe(true)
    expect(registrar).toHaveBeenCalledWith(datos)
    expect(sesion.autenticado).toBe(true)
    expect(sesion.esAdmin).toBe(false)
    expect(sesion.nombre).toBe('Ana')
    expect(sesion.cargando).toBe(false)
  })

  it('si hay que confirmar el email (sin sesión), no queda dentro', async () => {
    registrar.mockResolvedValue({ usuario, sesion: null })
    expect(await sesion.registrarse(datos)).toBe(false)
    expect(sesion.autenticado).toBe(false)
    expect(obtenerPerfil).not.toHaveBeenCalled()
  })

  it('si falla, lanza el error y no cambia el estado', async () => {
    registrar.mockRejectedValue(new Error('User already registered'))
    await expect(sesion.registrarse(datos)).rejects.toThrow('User already registered')
    expect(sesion.autenticado).toBe(false)
    expect(sesion.cargando).toBe(false)
  })
})
