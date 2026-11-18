// Formato de los datos de un coche para mostrarlos al usuario
// useGrouping: 'always' pone el separador de miles también en las cifras de cuatro dígitos (9.500 €), para que todas se vean igual
const euros = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0, useGrouping: 'always' })
const numeros = new Intl.NumberFormat('es-ES', { useGrouping: 'always' })

export const formatoPrecio = (precio) => euros.format(precio)
export const formatoKm = (km) => `${numeros.format(km)} km`

const COMBUSTIBLES = { gasolina: 'Gasolina', diesel: 'Diésel', electrico: 'Eléctrico' }
const TRANSMISIONES = { manual: 'Manual', automatico: 'Automático' }
export const etiquetaCombustible = (valor) => COMBUSTIBLES[valor] ?? valor
export const etiquetaTransmision = (valor) => TRANSMISIONES[valor] ?? valor
