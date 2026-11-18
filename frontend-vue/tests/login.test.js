import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import App from '../src/App.vue'
import { crearEntornoUI } from './helpers.js'
import { login, obtenerSesion } from '../src/servicios/services/authService.js'
import { obtenerPerfil } from '../src/servicios/services/perfilService.js'

vi.mock('../src/servicios/services/authService.js', () => ({
  login: vi.fn(),
  logout: vi.fn(),
  obtenerSesion: vi.fn(),
  registrar: vi.fn()
}))
vi.mock('../src/servicios/services/perfilService.js', () => ({ obtenerPerfil: vi.fn() }))

let w
beforeEach(() => {
  vi.clearAllMocks()
  obtenerSesion.mockResolvedValue(null)
  obtenerPerfil.mockResolvedValue({ id: 'u1', nombre: 'Ana', rol: 'cliente' })
})
afterEach(() => {
  w?.unmount()
  document.body.innerHTML = ''
})

async function abrirLogin(ruta = '/login') {
  const { router, plugins } = crearEntornoUI(ruta)
  await router.isReady()
  w = mount(App, { global: { plugins }, attachTo: document.body })
  await flushPromises()
  return router
}
async function rellenarYEnviar(email, password) {
  await w.find('#email').setValue(email)
  await w.find('#password').setValue(password)
  await w.find('form').trigger('submit')
  await flushPromises()
}
const botonEntrar = () => w.findAll('button').find((b) => b.text().includes('Entrar'))

describe('validación del formulario', () => {
  it('con el formulario vacío muestra los errores y no llama al servidor', async () => {
    await abrirLogin()
    await w.find('form').trigger('submit')
    await flushPromises()
    expect(w.find('#error-email').text()).toBe('Email no válido')
    expect(w.find('#error-password').text()).toBe('La contraseña es obligatoria')
    expect(login).not.toHaveBeenCalled()
  })

  it('un email con formato incorrecto se rechaza antes de llamar al servidor', async () => {
    await abrirLogin()
    await rellenarYEnviar('esto-no-es-un-email', 'secreto123')
    expect(w.find('#error-email').text()).toBe('Email no válido')
    expect(w.find('#error-password').exists()).toBe(false)
    expect(login).not.toHaveBeenCalled()
  })

  it('al corregir los datos desaparecen los errores', async () => {
    await abrirLogin()
    login.mockResolvedValue({ usuario: { id: 'u1', email: 'ana@ua.es' } })
    await rellenarYEnviar('malo', '')
    expect(w.find('#error-email').exists()).toBe(true)
    await rellenarYEnviar('ana@ua.es', 'secreto123')
    expect(w.find('#error-email').exists()).toBe(false)
  })
})

describe('inicio de sesión', () => {
  it('con credenciales correctas entra, va al listado y muestra el usuario', async () => {
    login.mockResolvedValue({ usuario: { id: 'u1', email: 'ana@ua.es' } })
    const router = await abrirLogin()
    await rellenarYEnviar('ana@ua.es', 'secreto123')
    expect(login).toHaveBeenCalledWith({ email: 'ana@ua.es', password: 'secreto123' })
    expect(router.currentRoute.value.name).toBe('listado')
    expect(w.find('header').text()).toContain('Ana')
    expect(document.body.textContent).toContain('Sesión iniciada')
  })

  it('con credenciales incorrectas muestra un mensaje comprensible y se queda en el login', async () => {
    login.mockRejectedValue(new Error('Invalid login credentials'))
    const router = await abrirLogin()
    await rellenarYEnviar('ana@ua.es', 'incorrecta1')
    expect(w.find('main').text()).toContain('Email o contraseña incorrectos')
    expect(router.currentRoute.value.name).toBe('login')
    expect(w.find('header').text()).not.toContain('Cerrar sesión')
    expect(botonEntrar().attributes('disabled')).toBeUndefined() // se puede volver a intentar
  })

  it('si no hay conexión lo explica', async () => {
    login.mockRejectedValue(new Error('Failed to fetch'))
    await abrirLogin()
    await rellenarYEnviar('ana@ua.es', 'secreto123')
    expect(w.find('main').text()).toContain('No se pudo conectar con el servidor')
  })

  it('mientras se comprueba la contraseña el botón está desactivado', async () => {
    let terminar
    login.mockReturnValue(new Promise((resolver) => (terminar = resolver)))
    await abrirLogin()
    await rellenarYEnviar('ana@ua.es', 'secreto123')
    expect(botonEntrar().attributes('disabled')).toBeDefined()
    terminar({ usuario: { id: 'u1', email: 'ana@ua.es' } })
    await flushPromises()
  })

  it('un nuevo intento borra el mensaje de error anterior', async () => {
    login.mockRejectedValueOnce(new Error('Invalid login credentials'))
    login.mockResolvedValueOnce({ usuario: { id: 'u1', email: 'ana@ua.es' } })
    await abrirLogin()
    await rellenarYEnviar('ana@ua.es', 'incorrecta1')
    expect(w.find('main').text()).toContain('Email o contraseña incorrectos')
    await rellenarYEnviar('ana@ua.es', 'secreto123')
    expect(w.find('main').text()).not.toContain('Email o contraseña incorrectos')
  })
})

describe('enlace al registro', () => {
  it('desde el login se puede ir a crear una cuenta', async () => {
    const router = await abrirLogin()
    await w.find('main a[href="/registro"]').trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.name).toBe('registro')
  })
})

describe('volver a donde se iba', () => {
  it('tras entrar vuelve a la pantalla que se había pedido', async () => {
    login.mockResolvedValue({ usuario: { id: 'u1', email: 'ana@ua.es' } })
    obtenerPerfil.mockResolvedValue({ id: 'u1', nombre: 'Ana', rol: 'admin' })
    const router = await abrirLogin('/coches/nuevo') // sin sesión: redirige al login con ?redirect=
    expect(router.currentRoute.value.name).toBe('login')
    await rellenarYEnviar('ana@ua.es', 'secreto123')
    expect(router.currentRoute.value.name).toBe('coche-nuevo')
  })

  it.each(['//otro-sitio.com', 'https://otro-sitio.com', 'javascript:alert(1)'])('ignora un destino externo (%s)', async (destino) => {
    login.mockResolvedValue({ usuario: { id: 'u1', email: 'ana@ua.es' } })
    const router = await abrirLogin(`/login?redirect=${encodeURIComponent(destino)}`)
    await rellenarYEnviar('ana@ua.es', 'secreto123')
    expect(router.currentRoute.value.name).toBe('listado')
  })
})
