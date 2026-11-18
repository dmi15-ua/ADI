import { describe, it, expect } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import CocheCard from '../src/components/CocheCard.vue'
import { crearEntornoUI, crearCocheDePrueba } from './helpers.js'

async function montar(coche) {
  const { router, plugins } = crearEntornoUI('/')
  await router.isReady()
  const w = mount(CocheCard, { props: { coche }, global: { plugins } })
  return { w, router }
}
const normal = (t) => t.replace(/ /g, ' ')

describe('tarjeta de un coche', () => {
  it('muestra marca y modelo, precio, año, kilometraje y etiquetas', async () => {
    const { w } = await montar(crearCocheDePrueba(1, { modelo: 'Ibiza', precio: 18500, km: 45000, anio: 2019, combustible: 'diesel', transmision: 'automatico' }))
    const texto = normal(w.text())
    expect(texto).toContain('Seat Ibiza')
    expect(texto).toContain('18.500 €')
    expect(texto).toContain('2019 · 45.000 km')
    expect(texto).toContain('Diésel')
    expect(texto).toContain('Automático')
  })

  it('muestra la foto principal con un texto alternativo', async () => {
    const { w } = await montar(crearCocheDePrueba(1, { modelo: 'Ibiza' }))
    const img = w.find('img')
    expect(img.attributes('src')).toBe('https://fotos.test/1.jpg')
    expect(img.attributes('alt')).toBe('Seat Ibiza')
  })

  it('sin foto muestra un marcador', async () => {
    const { w } = await montar(crearCocheDePrueba(1, { foto_principal: null }))
    expect(w.find('img').exists()).toBe(false)
    expect(w.text()).toContain('Sin foto')
  })

  it('el título y la foto enlazan al detalle', async () => {
    const { w } = await montar(crearCocheDePrueba(7))
    const enlaces = w.findAll('a').map((a) => a.attributes('href'))
    expect(enlaces).toEqual(['/coches/7', '/coches/7'])
  })

  it('el botón «Ver detalle» lleva al detalle', async () => {
    const { w, router } = await montar(crearCocheDePrueba(7))
    await w.findAll('button').find((b) => b.text().includes('Ver detalle')).trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.name).toBe('coche-detalle')
    expect(router.currentRoute.value.params.id).toBe('7')
  })
})
