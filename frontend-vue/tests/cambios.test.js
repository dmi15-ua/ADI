import { describe, it, expect } from 'vitest'
import { diferencias } from '../src/utils/cambios.js'

const original = { modelo: 'Ibiza', precio: 18500, descripcion: null, equipamiento: ['GPS'], disponible: true }

describe('diferencias entre el coche original y el formulario', () => {
  it('sin cambios devuelve un objeto vacío', () => {
    expect(diferencias(original, { ...original })).toEqual({})
  })

  it('devuelve solo los campos que han cambiado', () => {
    expect(diferencias(original, { ...original, precio: 17000 })).toEqual({ precio: 17000 })
    expect(diferencias(original, { ...original, precio: 17000, disponible: false })).toEqual({ precio: 17000, disponible: false })
  })

  it('una descripción vacía equivale a no tener descripción', () => {
    expect(diferencias(original, { ...original, descripcion: '' })).toEqual({})
    expect(diferencias({ ...original, descripcion: undefined }, { ...original, descripcion: '' })).toEqual({})
  })

  it('detecta que se ha escrito una descripción', () => {
    expect(diferencias(original, { ...original, descripcion: 'Nuevo' })).toEqual({ descripcion: 'Nuevo' })
  })

  it('detecta que se ha borrado la descripción que había', () => {
    expect(diferencias({ ...original, descripcion: 'Antes' }, { ...original, descripcion: '' })).toEqual({ descripcion: '' })
  })

  it('compara las listas por su contenido y su orden', () => {
    expect(diferencias(original, { ...original, equipamiento: ['GPS'] })).toEqual({})
    expect(diferencias(original, { ...original, equipamiento: ['GPS', 'Bluetooth'] })).toEqual({ equipamiento: ['GPS', 'Bluetooth'] })
    expect(diferencias(original, { ...original, equipamiento: [] })).toEqual({ equipamiento: [] })
  })

  it('una lista vacía equivale a no tener equipamiento', () => {
    expect(diferencias({ ...original, equipamiento: null }, { ...original, equipamiento: [] })).toEqual({})
  })

  it('no confunde el 0 ni false con vacío', () => {
    expect(diferencias({ km: 0 }, { km: 0 })).toEqual({})
    expect(diferencias({ km: 10 }, { km: 0 })).toEqual({ km: 0 })
    expect(diferencias({ disponible: true }, { disponible: false })).toEqual({ disponible: false })
  })
})
