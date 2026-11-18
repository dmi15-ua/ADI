import { describe, it, expect } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import { createMemoryHistory } from 'vue-router'
import { crearRouter } from '../src/router/index.js'

const nuevoRouter = () => crearRouter(createMemoryHistory())
const resolver = (ruta) => nuevoRouter().resolve(ruta)

describe('rutas', () => {
  it('el listado está en la raíz', () => {
    expect(resolver('/').name).toBe('listado')
  })

  it('hay una ruta de login', () => {
    expect(resolver('/login').name).toBe('login')
  })

  it('/coches/nuevo es el formulario de creación y no se confunde con un id', () => {
    expect(resolver('/coches/nuevo').name).toBe('coche-nuevo')
  })

  it('/coches/:id es el detalle y recibe el id como parámetro', () => {
    const ruta = resolver('/coches/5')
    expect(ruta.name).toBe('coche-detalle')
    expect(ruta.params.id).toBe('5')
  })

  it('/coches/:id/editar es el formulario de edición', () => {
    const ruta = resolver('/coches/12/editar')
    expect(ruta.name).toBe('coche-editar')
    expect(ruta.params.id).toBe('12')
  })

  it.each(['/coches/abc', '/coches/5/borrar', '/no-existe', '/coches/-1'])('%s lleva a la página no encontrada', (ruta) => {
    expect(resolver(ruta).name).toBe('no-encontrado')
  })

  it('solo crear y editar requieren ser administrador', () => {
    const requieren = ['coche-nuevo', 'coche-editar']
    const router = nuevoRouter()
    for (const r of router.getRoutes()) {
      expect(Boolean(r.meta.requiereAdmin)).toBe(requieren.includes(r.name))
    }
  })
})

describe('navegación', () => {
  it('se puede entrar directamente por una URL', async () => {
    const router = nuevoRouter()
    await router.push('/coches/7/editar')
    expect(router.currentRoute.value.name).toBe('coche-editar')
    expect(router.currentRoute.value.params.id).toBe('7')
  })

  it('atrás y adelante recorren el historial', async () => {
    const router = nuevoRouter()
    await router.push('/')
    await router.push('/coches/5')
    await router.push('/login')

    router.back()
    await flushPromises()
    expect(router.currentRoute.value.fullPath).toBe('/coches/5')
    router.back()
    await flushPromises()
    expect(router.currentRoute.value.fullPath).toBe('/')
    router.forward()
    await flushPromises()
    expect(router.currentRoute.value.fullPath).toBe('/coches/5')
  })

  it('el título de la pestaña cambia con cada pantalla', async () => {
    const router = nuevoRouter()
    await router.push('/coches/nuevo')
    expect(document.title).toBe('Concesionario · Nuevo coche')
    await router.push('/')
    expect(document.title).toBe('Concesionario · Coches')
    await router.push('/loquesea')
    expect(document.title).toBe('Concesionario · Página no encontrada')
  })
})
