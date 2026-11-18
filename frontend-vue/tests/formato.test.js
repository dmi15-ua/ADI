import { describe, it, expect } from 'vitest'
import { formatoPrecio, formatoKm, etiquetaCombustible, etiquetaTransmision } from '../src/utils/formato.js'

// Intl usa un espacio duro antes del símbolo del euro; se normaliza para comparar
const normal = (texto) => texto.replace(/ /g, ' ')

describe('formato', () => {
  it('el precio se muestra en euros con separador de miles y sin decimales', () => {
    expect(normal(formatoPrecio(18500))).toBe('18.500 €')
    expect(normal(formatoPrecio(999))).toBe('999 €')
    expect(normal(formatoPrecio(9500))).toBe('9.500 €')
    expect(normal(formatoPrecio(1250000))).toBe('1.250.000 €')
  })

  it('el kilometraje se muestra con separador de miles', () => {
    expect(formatoKm(45000)).toBe('45.000 km')
    expect(formatoKm(0)).toBe('0 km')
    expect(formatoKm(8500)).toBe('8.500 km')
  })

  it('el combustible y la transmisión se muestran con su nombre legible', () => {
    expect(etiquetaCombustible('diesel')).toBe('Diésel')
    expect(etiquetaCombustible('electrico')).toBe('Eléctrico')
    expect(etiquetaCombustible('gasolina')).toBe('Gasolina')
    expect(etiquetaTransmision('automatico')).toBe('Automático')
    expect(etiquetaTransmision('manual')).toBe('Manual')
  })

  it('un valor desconocido se muestra tal cual', () => {
    expect(etiquetaCombustible('hidrogeno')).toBe('hidrogeno')
  })
})
