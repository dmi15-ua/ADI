import { describe, it, expect, afterEach } from 'vitest'
import { defineComponent, h } from 'vue'
import { mount, flushPromises } from '@vue/test-utils'
import Toast from 'primevue/toast'
import ConfirmDialog from 'primevue/confirmdialog'
import { useNotificaciones } from '../src/composables/useNotificaciones.js'
import { useConfirmacion } from '../src/composables/useConfirmacion.js'
import { crearEntornoUI } from './helpers.js'

// Componente de prueba: tiene los contenedores globales y botones que usan los composables
let resultado
const Prueba = defineComponent({
  setup() {
    const avisos = useNotificaciones()
    const { confirmar } = useConfirmacion()
    return () =>
      h('div', [
        h(Toast),
        h(ConfirmDialog),
        h('button', { id: 'exito', onClick: () => avisos.exito('Guardado', 'El coche se ha creado') }),
        h('button', { id: 'error', onClick: () => avisos.error('No se pudo guardar') }),
        h('button', {
          id: 'confirmar',
          onClick: async () => {
            resultado = await confirmar({ titulo: 'Eliminar coche', mensaje: '¿Seguro que quieres eliminarlo?', textoAceptar: 'Eliminar', peligro: true })
          }
        })
      ])
  }
})

let w
afterEach(() => {
  w?.unmount()
  document.body.innerHTML = ''
  resultado = undefined
})

async function montar() {
  const { plugins } = crearEntornoUI()
  w = mount(Prueba, { global: { plugins }, attachTo: document.body })
  await flushPromises()
}
const textoDocumento = () => document.body.textContent
const boton = (texto) => [...document.body.querySelectorAll('button')].find((b) => b.textContent.includes(texto))

describe('avisos (Toast)', () => {
  it('muestra un aviso de éxito con su detalle', async () => {
    await montar()
    await w.find('#exito').trigger('click')
    await flushPromises()
    expect(textoDocumento()).toContain('Guardado')
    expect(textoDocumento()).toContain('El coche se ha creado')
  })

  it('muestra un aviso de error', async () => {
    await montar()
    await w.find('#error').trigger('click')
    await flushPromises()
    expect(textoDocumento()).toContain('No se pudo guardar')
  })
})

describe('confirmación (ConfirmDialog)', () => {
  it('devuelve true si el usuario acepta', async () => {
    await montar()
    await w.find('#confirmar').trigger('click')
    await flushPromises()
    expect(textoDocumento()).toContain('¿Seguro que quieres eliminarlo?')
    boton('Eliminar').click()
    await flushPromises()
    expect(resultado).toBe(true)
  })

  it('devuelve false si el usuario cancela', async () => {
    await montar()
    await w.find('#confirmar').trigger('click')
    await flushPromises()
    boton('Cancelar').click()
    await flushPromises()
    expect(resultado).toBe(false)
  })
})
