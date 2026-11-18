import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { montarApp, crearCoche, respuestaDePagina } from './helpers.jsx'
import { login, logout, obtenerSesion } from '../src/servicios/services/authService.js'
import { obtenerPerfil } from '../src/servicios/services/perfilService.js'
import { buscarCoches } from '../src/servicios/services/cocheService.js'

vi.mock('../src/servicios/services/authService.js', () => ({ login: vi.fn(), logout: vi.fn(), obtenerSesion: vi.fn() }))
vi.mock('../src/servicios/services/perfilService.js', () => ({ obtenerPerfil: vi.fn() }))
vi.mock('../src/servicios/services/cocheService.js', () => ({ buscarCoches: vi.fn(), eliminarCoche: vi.fn() }))

const persona = { id: 'u1', email: 'ana@ua.es' }

beforeEach(() => {
  vi.clearAllMocks()
  obtenerSesion.mockResolvedValue(null)
  buscarCoches.mockImplementation(async (f) => respuestaDePagina([crearCoche(1)], f))
})

async function abrirLogin() {
  const app = montarApp()
  await app.usuario.click(await screen.findByRole('button', { name: 'Iniciar sesión' }))
  return app
}

describe('cabecera', () => {
  it('mientras se comprueba si hay sesión guardada, no se muestran botones de sesión', async () => {
    let terminar
    obtenerSesion.mockReturnValue(new Promise((resolver) => (terminar = resolver)))
    montarApp()
    expect(screen.getByText('Cargando...')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Iniciar sesión' })).not.toBeInTheDocument()
    terminar(null)
    expect(await screen.findByRole('button', { name: 'Iniciar sesión' })).toBeInTheDocument()
  })

  it('un visitante ve «Iniciar sesión» y el listado', async () => {
    montarApp()
    expect(await screen.findByRole('button', { name: 'Iniciar sesión' })).toBeInTheDocument()
    expect(await screen.findByText('Seat Modelo 1')).toBeInTheDocument()
  })

  it('con una sesión guardada de administrador muestra su nombre, la etiqueta «Admin» y «Cerrar sesión»', async () => {
    obtenerSesion.mockResolvedValue(persona)
    obtenerPerfil.mockResolvedValue({ id: 'u1', nombre: 'Ana', rol: 'admin' })
    montarApp()
    expect(await screen.findByText('Ana')).toBeInTheDocument()
    expect(screen.getByText('Admin')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cerrar sesión' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Iniciar sesión' })).not.toBeInTheDocument()
  })
})

describe('formulario de login', () => {
  it('con credenciales correctas entra, vuelve al listado y muestra al usuario', async () => {
    login.mockResolvedValue({ usuario: persona, sesion: {} })
    obtenerPerfil.mockResolvedValue({ id: 'u1', nombre: 'Ana', rol: 'admin' })
    const { usuario } = await abrirLogin()
    await usuario.type(screen.getByLabelText('Email'), 'ana@ua.es')
    await usuario.type(screen.getByLabelText('Contraseña'), 'secreto123')
    await usuario.click(screen.getByRole('button', { name: 'Entrar' }))
    expect(login).toHaveBeenCalledWith({ email: 'ana@ua.es', password: 'secreto123' })
    expect(await screen.findByText('Seat Modelo 1')).toBeInTheDocument()
    expect(screen.getByText('Ana')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Iniciar sesión' })).not.toBeInTheDocument()
  })

  it('con el formulario vacío muestra un error en cada campo y no llama al servidor', async () => {
    const { usuario } = await abrirLogin()
    await usuario.click(screen.getByRole('button', { name: 'Entrar' }))
    expect(screen.getByText('Email no válido')).toBeInTheDocument()
    expect(screen.getByText('La contraseña es obligatoria')).toBeInTheDocument()
    expect(login).not.toHaveBeenCalled()
  })

  it('con un email mal escrito, solo falla el email', async () => {
    const { usuario } = await abrirLogin()
    await usuario.type(screen.getByLabelText('Email'), 'esto-no-es-un-email')
    await usuario.type(screen.getByLabelText('Contraseña'), 'secreto123')
    await usuario.click(screen.getByRole('button', { name: 'Entrar' }))
    expect(screen.getByText('Email no válido')).toBeInTheDocument()
    expect(screen.queryByText('La contraseña es obligatoria')).not.toBeInTheDocument()
    expect(login).not.toHaveBeenCalled()
  })

  it('con credenciales incorrectas muestra el error en español, se queda en el formulario y conserva lo escrito', async () => {
    login.mockRejectedValue(new Error('Invalid login credentials'))
    const { usuario } = await abrirLogin()
    await usuario.type(screen.getByLabelText('Email'), 'ana@ua.es')
    await usuario.type(screen.getByLabelText('Contraseña'), 'equivocada')
    await usuario.click(screen.getByRole('button', { name: 'Entrar' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Email o contraseña incorrectos')
    expect(screen.getByLabelText('Email')).toHaveValue('ana@ua.es')
    expect(screen.getByRole('button', { name: 'Entrar' })).toBeEnabled()
  })

  it('tras un error se puede volver a intentar', async () => {
    login.mockRejectedValueOnce(new Error('Failed to fetch'))
    login.mockResolvedValueOnce({ usuario: persona, sesion: {} })
    obtenerPerfil.mockResolvedValue({ id: 'u1', nombre: 'Ana', rol: 'cliente' })
    const { usuario } = await abrirLogin()
    await usuario.type(screen.getByLabelText('Email'), 'ana@ua.es')
    await usuario.type(screen.getByLabelText('Contraseña'), 'secreto123')
    await usuario.click(screen.getByRole('button', { name: 'Entrar' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('No se pudo conectar con el servidor')
    await usuario.click(screen.getByRole('button', { name: 'Entrar' }))
    expect(await screen.findByText('Ana')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('mientras entra, el botón está desactivado', async () => {
    let terminar
    login.mockReturnValue(new Promise((resolver) => (terminar = resolver)))
    obtenerPerfil.mockResolvedValue({ id: 'u1', nombre: 'Ana', rol: 'cliente' })
    const { usuario } = await abrirLogin()
    await usuario.type(screen.getByLabelText('Email'), 'ana@ua.es')
    await usuario.type(screen.getByLabelText('Contraseña'), 'secreto123')
    await usuario.click(screen.getByRole('button', { name: 'Entrar' }))
    expect(screen.getByRole('button', { name: 'Entrando...' })).toBeDisabled()
    terminar({ usuario: persona, sesion: {} })
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Entrando...' })).not.toBeInTheDocument())
  })

  it('«Cancelar» vuelve al listado sin iniciar sesión', async () => {
    const { usuario } = await abrirLogin()
    await usuario.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(await screen.findByText('Seat Modelo 1')).toBeInTheDocument()
    expect(login).not.toHaveBeenCalled()
  })
})

describe('cerrar sesión', () => {
  it('quita al usuario y vuelve a mostrar «Iniciar sesión»', async () => {
    obtenerSesion.mockResolvedValue(persona)
    obtenerPerfil.mockResolvedValue({ id: 'u1', nombre: 'Ana', rol: 'admin' })
    logout.mockResolvedValue()
    const { usuario } = montarApp()
    await usuario.click(await screen.findByRole('button', { name: 'Cerrar sesión' }))
    expect(logout).toHaveBeenCalledTimes(1)
    expect(await screen.findByRole('button', { name: 'Iniciar sesión' })).toBeInTheDocument()
    expect(screen.queryByText('Ana')).not.toBeInTheDocument()
  })
})
