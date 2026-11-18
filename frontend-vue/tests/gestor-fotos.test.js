import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import PrimeVue from 'primevue/config'
import GestorFotos from '../src/components/GestorFotos.vue'
import { localeEs } from '../src/locale.js'

const fotos = [
  { id: 11, url: 'https://fotos.test/a.jpg', orden: 0, es_principal: false },
  { id: 12, url: 'https://fotos.test/b.jpg', orden: 1, es_principal: true }
]
const montar = (props = {}) => mount(GestorFotos, { props: { fotos, ...props }, global: { plugins: [[PrimeVue, { locale: localeEs }]] } })
const enviar = (w) => w.find('form').trigger('submit')
const botonAnadir = (w) => w.find('button[type="submit"]')

describe('lista de fotos', () => {
  it('muestra una fila por foto, con su dirección, y marca la principal', () => {
    const w = montar()
    const filas = w.findAll('li')
    expect(filas).toHaveLength(2)
    expect(filas[0].find('.url').text()).toBe('https://fotos.test/a.jpg')
    expect(filas[0].text()).not.toContain('Principal')
    expect(filas[1].text()).toContain('Principal')
  })

  it('sin fotos lo dice', () => {
    const w = montar({ fotos: [] })
    expect(w.text()).toContain('Este coche todavía no tiene fotos.')
    expect(w.find('ul').exists()).toBe(false)
  })

  it('cada foto tiene su botón de eliminar, que emite «eliminar» con esa foto', async () => {
    const w = montar()
    await w.find('button[aria-label="Eliminar la foto 2"]').trigger('click')
    expect(w.emitted('eliminar')[0][0]).toEqual(fotos[1])
  })

  it('una imagen que no se puede cargar se marca para poder eliminarla', async () => {
    const w = montar()
    await w.findAll('li img')[0].trigger('error')
    expect(w.findAll('li')[0].text()).toContain('No se puede mostrar esta imagen')
    expect(w.findAll('li')[1].text()).not.toContain('No se puede mostrar')
  })

  it('mientras se elimina una foto, todos los botones están desactivados y el de esa foto indica que trabaja', () => {
    const w = montar({ eliminandoId: 11 })
    const botones = w.findAll('li button')
    expect(botones.every((b) => b.attributes('disabled') !== undefined)).toBe(true)
    expect(botonAnadir(w).attributes('disabled')).toBeDefined()
  })
})

describe('añadir una foto', () => {
  it('emite «anadir» con la dirección, sin espacios sobrantes y sin es_principal por defecto', async () => {
    const w = montar()
    await w.find('#foto-url').setValue('  https://fotos.test/nueva.jpg  ')
    await enviar(w)
    expect(w.emitted('anadir')[0][0]).toEqual({ url: 'https://fotos.test/nueva.jpg' })
  })

  it('si se marca como principal, lo indica', async () => {
    const w = montar()
    await w.find('#foto-url').setValue('https://fotos.test/nueva.jpg')
    w.findComponent('[data-campo="es_principal"]').vm.$emit('update:modelValue', true)
    await w.vm.$nextTick()
    await enviar(w)
    expect(w.emitted('anadir')[0][0]).toEqual({ url: 'https://fotos.test/nueva.jpg', es_principal: true })
  })

  it('sin escribir nada pide la dirección y no emite', async () => {
    const w = montar()
    await enviar(w)
    expect(w.find('#error-foto-url').text()).toBe('Escribe la dirección de la imagen')
    expect(w.emitted('anadir')).toBeUndefined()
  })

  it('con una dirección no válida explica el problema y no emite', async () => {
    const w = montar()
    for (const mala of ['hola', 'ftp://fotos.test/a.jpg', 'https://con espacios.test/a.jpg']) {
      await w.find('#foto-url').setValue(mala)
      await enviar(w)
      expect(w.find('#error-foto-url').text()).toBe('URL no válida (debe empezar por http:// o https://)')
    }
    expect(w.emitted('anadir')).toBeUndefined()
  })

  it('el error desaparece al seguir escribiendo', async () => {
    const w = montar()
    await enviar(w)
    expect(w.find('#error-foto-url').exists()).toBe(true)
    await w.find('#foto-url').setValue('https://')
    expect(w.find('#error-foto-url').exists()).toBe(false)
  })

  it('mientras se añade, el botón está desactivado', () => {
    const w = montar({ anadiendo: true })
    expect(botonAnadir(w).attributes('disabled')).toBeDefined()
  })

  it('al terminar de añadir sin error, el formulario se vacía', async () => {
    const w = montar({ anadiendo: false })
    await w.find('#foto-url').setValue('https://fotos.test/nueva.jpg')
    await w.setProps({ anadiendo: true })
    await w.setProps({ anadiendo: false })
    expect(w.find('#foto-url').element.value).toBe('')
  })

  it('si el servidor devolvió un error, lo muestra y conserva lo escrito', async () => {
    const w = montar({ anadiendo: false })
    await w.find('#foto-url').setValue('https://fotos.test/nueva.jpg')
    await w.setProps({ anadiendo: true })
    await w.setProps({ anadiendo: false, errorAnadir: 'No tienes permiso para realizar esta acción' })
    expect(w.find('[role="alert"]').text()).toContain('No tienes permiso para realizar esta acción')
    expect(w.find('#foto-url').element.value).toBe('https://fotos.test/nueva.jpg')
  })
})
