import { describe, it, expect } from 'vitest'
import { filtrosDesdeQuery, queryDesdeFiltros, hayFiltros } from '../src/utils/filtros.js'

describe('filtros desde la URL', () => {
  it('sin parámetros no hay filtros', () => {
    expect(filtrosDesdeQuery({})).toEqual({})
    expect(filtrosDesdeQuery()).toEqual({})
    expect(hayFiltros(filtrosDesdeQuery({}))).toBe(false)
  })

  it('lee todos los filtros, con la marca como número', () => {
    const query = { texto: 'ibiza', marca: '2', combustible: 'diesel', transmision: 'manual', precio_min: '5000', precio_max: '15000', orden: 'precio_asc' }
    expect(filtrosDesdeQuery(query)).toEqual({
      texto: 'ibiza', marca_id: 2, combustible: 'diesel', transmision: 'manual', precio_min: 5000, precio_max: 15000, orden: 'precio_asc'
    })
  })

  it('el texto se recorta de espacios, se limita a 100 caracteres y uno vacío se ignora', () => {
    expect(filtrosDesdeQuery({ texto: '  leon  ' }).texto).toBe('leon')
    expect(filtrosDesdeQuery({ texto: 'a'.repeat(150) }).texto).toHaveLength(100)
    expect(filtrosDesdeQuery({ texto: '   ' })).toEqual({})
  })

  it('ignora los valores no válidos en lugar de fallar', () => {
    expect(filtrosDesdeQuery({ marca: 'abc' })).toEqual({})
    expect(filtrosDesdeQuery({ marca: '0' })).toEqual({})
    expect(filtrosDesdeQuery({ marca: '-3' })).toEqual({})
    expect(filtrosDesdeQuery({ marca: '1.5' })).toEqual({})
    expect(filtrosDesdeQuery({ combustible: 'hibrido' })).toEqual({})
    expect(filtrosDesdeQuery({ transmision: 'semi' })).toEqual({})
    expect(filtrosDesdeQuery({ precio_min: '-5' })).toEqual({})
    expect(filtrosDesdeQuery({ precio_max: 'mucho' })).toEqual({})
    expect(filtrosDesdeQuery({ precio_max: '99999999' })).toEqual({})
    expect(filtrosDesdeQuery({ orden: 'raro' })).toEqual({})
  })

  it('un intervalo de precios imposible (mínimo mayor que máximo) no se aplica', () => {
    expect(filtrosDesdeQuery({ precio_min: '20000', precio_max: '10000' })).toEqual({})
    expect(filtrosDesdeQuery({ precio_min: '10000', precio_max: '10000' })).toEqual({ precio_min: 10000, precio_max: 10000 })
  })

  it('el orden por defecto no cuenta como filtro', () => {
    expect(filtrosDesdeQuery({ orden: 'recientes' })).toEqual({})
  })

  it('si un parámetro se repite, vale el primero', () => {
    expect(filtrosDesdeQuery({ combustible: ['diesel', 'gasolina'], marca: ['2', '3'] })).toEqual({ combustible: 'diesel', marca_id: 2 })
  })

  it('ignora parámetros que no son filtros (como la página)', () => {
    expect(filtrosDesdeQuery({ pagina: '3', otro: 'x' })).toEqual({})
  })

  it('el precio cero es un filtro válido', () => {
    expect(filtrosDesdeQuery({ precio_min: '0' })).toEqual({ precio_min: 0 })
    expect(hayFiltros({ precio_min: 0 })).toBe(true)
  })
})

describe('URL desde los filtros', () => {
  it('convierte los filtros en parámetros de texto, con la marca como «marca»', () => {
    expect(queryDesdeFiltros({ texto: 'ibiza', marca_id: 2, combustible: 'diesel', precio_min: 0, precio_max: 15000, orden: 'km_asc' })).toEqual({
      texto: 'ibiza', marca: '2', combustible: 'diesel', precio_min: '0', precio_max: '15000', orden: 'km_asc'
    })
  })

  it('sin filtros la URL queda limpia, y el orden por defecto no se escribe', () => {
    expect(queryDesdeFiltros({})).toEqual({})
    expect(queryDesdeFiltros({ orden: 'recientes' })).toEqual({})
  })

  it('es la inversa de leerlos', () => {
    const filtros = { texto: 'clio', marca_id: 1, transmision: 'automatico', precio_max: 9000, orden: 'precio_desc' }
    expect(filtrosDesdeQuery(queryDesdeFiltros(filtros))).toEqual(filtros)
  })
})
