import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import GaleriaFotos from '../src/components/GaleriaFotos.vue'

const fotos = [
  { id: 1, url: 'https://fotos.test/a.jpg', orden: 0, es_principal: false },
  { id: 2, url: 'https://fotos.test/b.jpg', orden: 1, es_principal: true },
  { id: 3, url: 'https://fotos.test/c.jpg', orden: 2, es_principal: false }
]
const montar = (props = {}) => mount(GaleriaFotos, { props: { fotos, descripcion: 'Seat Ibiza', ...props } })

describe('galería de fotos', () => {
  it('empieza mostrando la foto principal', () => {
    const w = montar()
    expect(w.find('img.grande').attributes('src')).toBe('https://fotos.test/b.jpg')
    expect(w.find('img.grande').attributes('alt')).toBe('Seat Ibiza (foto 2 de 3)')
  })

  it('si ninguna es principal, empieza por la primera', () => {
    const w = montar({ fotos: fotos.map((f) => ({ ...f, es_principal: false })) })
    expect(w.find('img.grande').attributes('src')).toBe('https://fotos.test/a.jpg')
  })

  it('muestra una miniatura por foto, con la activa marcada', () => {
    const w = montar()
    const botones = w.findAll('.miniaturas button')
    expect(botones).toHaveLength(3)
    expect(botones.map((b) => b.attributes('aria-pressed'))).toEqual(['false', 'true', 'false'])
  })

  it('al pulsar una miniatura cambia la foto grande', async () => {
    const w = montar()
    await w.findAll('.miniaturas button')[2].trigger('click')
    expect(w.find('img.grande').attributes('src')).toBe('https://fotos.test/c.jpg')
    expect(w.findAll('.miniaturas button')[2].attributes('aria-pressed')).toBe('true')
    expect(w.findAll('.miniaturas button')[1].attributes('aria-pressed')).toBe('false')
  })

  it('con una sola foto no muestra miniaturas', () => {
    const w = montar({ fotos: [fotos[0]] })
    expect(w.find('img.grande').exists()).toBe(true)
    expect(w.find('.miniaturas').exists()).toBe(false)
  })

  it('sin fotos muestra un aviso', () => {
    const w = montar({ fotos: [] })
    expect(w.find('img').exists()).toBe(false)
    expect(w.text()).toContain('Este coche no tiene fotos')
  })

  it('si cambian las fotos, vuelve a mostrar la principal de las nuevas', async () => {
    const w = montar()
    await w.findAll('.miniaturas button')[0].trigger('click')
    await w.setProps({ fotos: [{ id: 9, url: 'https://fotos.test/z.jpg', orden: 0, es_principal: true }] })
    expect(w.find('img.grande').attributes('src')).toBe('https://fotos.test/z.jpg')
  })

  it('si la foto grande no se puede cargar, muestra un aviso en lugar de la imagen rota', async () => {
    const w = montar()
    await w.find('img.grande').trigger('error')
    expect(w.find('img.grande').exists()).toBe(false)
    expect(w.text()).toContain('No se puede mostrar esta foto')
    expect(w.find('[role="img"]').attributes('aria-label')).toBe('Seat Ibiza: la foto 2 no se puede mostrar')
  })

  it('al pasar a otra foto que sí carga, vuelve a verse la imagen', async () => {
    const w = montar()
    await w.find('img.grande').trigger('error')
    await w.findAll('.miniaturas button')[0].trigger('click')
    expect(w.find('img.grande').attributes('src')).toBe('https://fotos.test/a.jpg')
  })

  it('una miniatura que no carga se sustituye por un marcador, y sigue pudiéndose elegir', async () => {
    const w = montar()
    await w.findAll('.miniaturas img')[2].trigger('error')
    expect(w.findAll('.miniaturas .miniatura-rota')).toHaveLength(1)
    expect(w.findAll('.miniaturas button')).toHaveLength(3)
  })
})
