import { describe, it, expect, vi, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import App from '../src/App.vue'
import { crearCliente, obtenerClientePorDefecto } from '../src/servicios/lib/supabaseClient.js'
import { buscarCoches } from '../src/servicios/services/cocheService.js'
import { listarMarcas } from '../src/servicios/services/marcaService.js'
import { obtenerSesion, login } from '../src/servicios/services/authService.js'
import { crearClienteFalso, crearEntornoUI } from './helpers.js'

// Este test comprueba el servicio real de marcas; en el resto de tests lo sustituye el mock de preparar-entorno.js
vi.unmock('../src/servicios/services/marcaService.js')

afterEach(() => vi.unstubAllEnvs())

describe('aplicación', () => {
  it('se monta con sus plugins y muestra el título', async () => {
    const { router, plugins } = crearEntornoUI()
    await router.isReady()
    const w = mount(App, { global: { plugins } })
    expect(w.text()).toContain('Concesionario')
  })
})

describe('configuración de Supabase', () => {
  it('falla con un mensaje claro si faltan las variables de entorno', () => {
    vi.stubEnv('VITE_SUPABASE_URL', '')
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', '')
    expect(() => crearCliente()).toThrow(/VITE_SUPABASE_URL/)
  })

  it('crea el cliente cuando están definidas y lo reutiliza', () => {
    vi.stubEnv('VITE_SUPABASE_URL', 'https://ejemplo.supabase.co')
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'clave-publica')
    const cliente = crearCliente()
    expect(cliente.auth).toBeDefined()
    expect(obtenerClientePorDefecto()).toBe(obtenerClientePorDefecto())
  })
})

describe('capa de servicios copiada de la práctica 1', () => {
  it('buscarCoches devuelve la respuesta paginada con la foto principal', async () => {
    const cliente = crearClienteFalso({
      coche: {
        data: [{ id: 1, modelo: 'Golf', marca: { id: 1, nombre: 'VW' }, foto_coche: [{ url: 'https://x/1.jpg', es_principal: true, orden: 0 }] }],
        count: 25,
        error: null
      }
    })
    const r = await buscarCoches({ pagina: 2, porPagina: 10 }, cliente)
    expect(r).toMatchObject({ pagina: 2, porPagina: 10, total: 25, totalPaginas: 3 })
    expect(r.datos[0].foto_principal).toBe('https://x/1.jpg')
    expect(cliente.llamadas[0].pasos).toContainEqual(['range', 10, 19])
  })

  it('buscarCoches rechaza filtros no válidos antes de llamar a la base de datos', async () => {
    const cliente = crearClienteFalso()
    await expect(buscarCoches({ pagina: 0 }, cliente)).rejects.toThrow(/página/)
    expect(cliente.from).not.toHaveBeenCalled()
  })

  it('listarMarcas devuelve las marcas', async () => {
    const cliente = crearClienteFalso({ marca: { data: [{ id: 1, nombre: 'Seat' }], error: null } })
    expect(await listarMarcas(cliente)).toEqual([{ id: 1, nombre: 'Seat' }])
  })

  it('obtenerSesion devuelve null si no hay sesión y el usuario si la hay', async () => {
    const cliente = crearClienteFalso()
    expect(await obtenerSesion(cliente)).toBeNull()
    cliente.auth.getSession.mockResolvedValue({ data: { session: { user: { id: 'u1', email: 'a@b.com' } } }, error: null })
    expect(await obtenerSesion(cliente)).toEqual({ id: 'u1', email: 'a@b.com' })
  })

  it('login valida el formulario antes de llamar a Supabase', async () => {
    const cliente = crearClienteFalso()
    await expect(login({ email: 'no-es-email', password: '12345678' }, cliente)).rejects.toThrow(/Email/)
    expect(cliente.auth.signInWithPassword).not.toHaveBeenCalled()
  })
})
