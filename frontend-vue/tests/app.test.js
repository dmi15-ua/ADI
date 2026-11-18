import { describe, it, expect } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import App from '../src/App.vue'
import { crearEntornoUI } from './helpers.js'

async function montar(ruta = '/') {
  const { router, plugins } = crearEntornoUI(ruta)
  await router.isReady()
  const w = mount(App, { global: { plugins }, attachTo: document.body })
  await flushPromises()
  return { w, router }
}

describe('estructura de la aplicación', () => {
  it('muestra la marca y el menú principal', async () => {
    const { w } = await montar()
    expect(w.find('a.marca').text()).toBe('Concesionario')
    expect(w.text()).toContain('Coches')
    w.unmount()
  })

  it('muestra la pantalla que corresponde a la ruta', async () => {
    const { w } = await montar('/')
    expect(w.find('main').text()).toContain('Listado de coches')
    w.unmount()
  })

  it('al pulsar un enlace del menú cambia la pantalla sin recargar', async () => {
    const { w, router } = await montar('/login')
    expect(w.find('main').text()).toContain('Iniciar sesión')
    await w.find('a[href="/"]:not(.marca)').trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.name).toBe('listado')
    expect(w.find('main').text()).toContain('Listado de coches')
    w.unmount()
  })

  it('la marca lleva al listado', async () => {
    const { w, router } = await montar('/login')
    await w.find('a.marca').trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.name).toBe('listado')
    w.unmount()
  })

  it('una dirección que no existe muestra un mensaje y un enlace para volver', async () => {
    const { w, router } = await montar('/esto-no-existe')
    expect(w.find('main').text()).toContain('Página no encontrada')
    await w.find('main a').trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.name).toBe('listado')
    w.unmount()
  })

  it('el detalle y la edición reciben el id de la URL', async () => {
    const { w } = await montar('/coches/5')
    expect(w.find('main').text()).toContain('Detalle del coche')
    w.unmount()
  })
})

describe('zona de sesión (provisional)', () => {
  it('el botón «Iniciar sesión» lleva a la pantalla de login', async () => {
    const { w, router } = await montar('/')
    const boton = w.findAll('button').find((b) => b.text().includes('Iniciar sesión'))
    await boton.trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.name).toBe('login')
    w.unmount()
  })
})
