import { COMBUSTIBLES, TRANSMISIONES } from '../servicios/validation/coche.js'
import { ORDENES } from '../servicios/validation/busqueda.js'

// Filtros de búsqueda del listado. Viven en la URL (?texto=ibiza&marca=2&precio_max=15000&orden=precio_asc),
// así se pueden compartir, funcionan atrás/adelante y sobreviven a recargar la página.
//
// Un objeto de filtros solo contiene los que están activos:
//   { texto, marca_id, combustible, transmision, precio_min, precio_max, orden }
// «orden» solo aparece si no es el de por defecto («recientes»).

const PRECIO_MAXIMO = 10_000_000
const ORDEN_POR_DEFECTO = 'recientes'

const primero = (valor) => (Array.isArray(valor) ? valor[0] : valor)
const entero = (valor) => {
  const v = primero(valor)
  return typeof v === 'string' && /^\d+$/.test(v) ? Number(v) : undefined
}

// Lee los filtros de la URL. Lo que no sea válido (una marca que no es un número, un combustible desconocido...) se ignora,
// porque cualquiera puede escribir lo que quiera en la barra de direcciones.
export function filtrosDesdeQuery(query = {}) {
  const filtros = {}

  const texto = primero(query.texto)
  if (typeof texto === 'string' && texto.trim()) filtros.texto = texto.trim().slice(0, 100)

  const marca = entero(query.marca)
  if (marca) filtros.marca_id = marca

  const combustible = primero(query.combustible)
  if (COMBUSTIBLES.includes(combustible)) filtros.combustible = combustible

  const transmision = primero(query.transmision)
  if (TRANSMISIONES.includes(transmision)) filtros.transmision = transmision

  const min = entero(query.precio_min)
  const max = entero(query.precio_max)
  if (min !== undefined && min <= PRECIO_MAXIMO) filtros.precio_min = min
  if (max !== undefined && max <= PRECIO_MAXIMO) filtros.precio_max = max
  // Un intervalo imposible (mínimo mayor que máximo) no se aplica
  if (filtros.precio_min !== undefined && filtros.precio_max !== undefined && filtros.precio_min > filtros.precio_max) {
    delete filtros.precio_min
    delete filtros.precio_max
  }

  const orden = primero(query.orden)
  if (ORDENES.includes(orden) && orden !== ORDEN_POR_DEFECTO) filtros.orden = orden

  return filtros
}

// Operación inversa: la URL (sin página) que representa unos filtros
export function queryDesdeFiltros(filtros = {}) {
  const query = {}
  if (filtros.texto) query.texto = filtros.texto
  if (filtros.marca_id) query.marca = String(filtros.marca_id)
  if (filtros.combustible) query.combustible = filtros.combustible
  if (filtros.transmision) query.transmision = filtros.transmision
  if (filtros.precio_min !== undefined) query.precio_min = String(filtros.precio_min)
  if (filtros.precio_max !== undefined) query.precio_max = String(filtros.precio_max)
  if (filtros.orden && filtros.orden !== ORDEN_POR_DEFECTO) query.orden = filtros.orden
  return query
}

export const hayFiltros = (filtros) => Object.keys(filtros).length > 0
