import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import App from '../src/App.vue'
import { crearEntornoUI } from './helpers.js'
import { registrar, obtenerSesion } from '../src/servicios/services/authService.js'
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

async function abrirRegistro() {
  const { router, plugins } = crearEntornoUI('/registro')
  await router.isReady()
  w = mount(App, { global: { plugins }, attachTo: document.body })
  await flushPromises()
  return router
}
const datosValidos = { nombre: 'Ana Pérez', email: 'ana@ua.es', password: 'secreto123', repetir: 'secreto123', telefono: '' }
async function rellenarYEnviar(datos = {}) {
  const d = { ...datosValidos, ...datos }
  await w.find('#nombre').setValue(d.nombre)
  await w.find('#email').setValue(d.email)
  await w.find('#password').setValue(d.password)
  await w.find('#repetir').setValue(d.repetir)
  await w.find('#telefono').setValue(d.telefono)
  await w.find('form').trigger('submit')
  await flushPromises()
}
const botonCrear = () => w.findAll('button').find((b) => b.text().includes('Crear cuenta'))
const error = (campo) => w.find(`#error-${campo}`)

describe('validación del formulario', () => {
  it('con el formulario vacío muestra los errores y no llama al servidor', async () => {
    await abrirRegistro()
    await w.find('form').trigger('submit')
    await flushPromises()
    expect(error('nombre').exists()).toBe(true)
    expect(error('email').text()).toBe('Email no válido')
    expect(error('password').text()).toMatch(/al menos 8/)
    expect(registrar).not.toHaveBeenCalled()
  })

  it.each([
    ['nombre demasiado corto', { nombre: 'A' }, 'nombre', /al menos 2/],
    ['email no válido', { email: 'ana@' }, 'email', /Email no válido/],
    ['contraseña de menos de 8 caracteres', { password: '1234567', repetir: '1234567' }, 'password', /al menos 8/],
    ['las contraseñas no coinciden', { repetir: 'otra-distinta' }, 'repetir', /no coinciden/],
    ['teléfono no válido', { telefono: 'abc' }, 'telefono', /Teléfono no válido/]
  ])('rechaza: %s', async (_nombre, cambio, campo, patron) => {
    await abrirRegistro()
    await rellenarYEnviar(cambio)
    expect(error(campo).text()).toMatch(patron)
    expect(registrar).not.toHaveBeenCalled()
  })

  it('el teléfono es opcional', async () => {
    registrar.mockResolvedValue({ usuario: { id: 'u1', email: 'ana@ua.es' }, sesion: { access_token: 'x' } })
    await abrirRegistro()
    await rellenarYEnviar({ telefono: '' })
    expect(registrar).toHaveBeenCalledWith({ nombre: 'Ana Pérez', email: 'ana@ua.es', password: 'secreto123' })
  })

  it('envía el teléfono cuando se indica', async () => {
    registrar.mockResolvedValue({ usuario: { id: 'u1', email: 'ana@ua.es' }, sesion: { access_token: 'x' } })
    await abrirRegistro()
    await rellenarYEnviar({ telefono: '600123456' })
    expect(registrar).toHaveBeenCalledWith(expect.objectContaining({ telefono: '600123456' }))
  })
})

describe('creación de la cuenta', () => {
  it('con Supabase devolviendo sesión, el usuario queda dentro y va al listado', async () => {
    registrar.mockResolvedValue({ usuario: { id: 'u1', email: 'ana@ua.es' }, sesion: { access_token: 'x' } })
    const router = await abrirRegistro()
    await rellenarYEnviar()
    expect(router.currentRoute.value.name).toBe('listado')
    expect(w.find('header').text()).toContain('Ana')
    expect(w.find('header').text()).toContain('Cerrar sesión')
    expect(document.body.textContent).toContain('Cuenta creada')
  })

  it('si hay que confirmar el email, lo explica y no inicia sesión', async () => {
    registrar.mockResolvedValue({ usuario: { id: 'u1', email: 'ana@ua.es' }, sesion: null })
    const router = await abrirRegistro()
    await rellenarYEnviar()
    expect(router.currentRoute.value.name).toBe('registro')
    expect(w.find('main').text()).toContain('confirmar tu email')
    expect(w.find('main form').exists()).toBe(false)
    expect(w.find('header').text()).not.toContain('Cerrar sesión')
  })

  it('con un email ya registrado muestra un mensaje comprensible y se puede corregir', async () => {
    registrar.mockRejectedValue(new Error('User already registered'))
    const router = await abrirRegistro()
    await rellenarYEnviar()
    expect(w.find('main').text()).toContain('Ya existe una cuenta con ese email')
    expect(router.currentRoute.value.name).toBe('registro')
    expect(botonCrear().attributes('disabled')).toBeUndefined()
  })

  it('si no hay conexión lo explica', async () => {
    registrar.mockRejectedValue(new Error('Failed to fetch'))
    await abrirRegistro()
    await rellenarYEnviar()
    expect(w.find('main').text()).toContain('No se pudo conectar con el servidor')
  })

  it('mientras se crea la cuenta el botón está desactivado', async () => {
    let terminar
    registrar.mockReturnValue(new Promise((resolver) => (terminar = resolver)))
    await abrirRegistro()
    await rellenarYEnviar()
    expect(botonCrear().attributes('disabled')).toBeDefined()
    terminar({ usuario: { id: 'u1', email: 'ana@ua.es' }, sesion: null })
    await flushPromises()
  })

  it('desde el registro se puede ir al login', async () => {
    const router = await abrirRegistro()
    await w.find('main a[href="/login"]').trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.name).toBe('login')
  })
})
