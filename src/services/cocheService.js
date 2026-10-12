import { obtenerClientePorDefecto } from '../lib/supabaseClient.js'
import { lanzarError } from '../lib/errores.js'
import { resumirCoche } from '../lib/resumirCoche.js'
import { cocheSchema, actualizarCocheSchema, idSchema } from '../validation/coche.js'
import { busquedaSchema } from '../validation/busqueda.js'
import { validar } from '../validation/usuario.js'

// Solo administradores (lo garantiza la RLS)
export async function crearCoche(datos, cliente = obtenerClientePorDefecto()) {
  const coche = validar(cocheSchema, datos)
  const { data, error } = await cliente.from('coche').insert(coche).select().single()
  if (error) lanzarError(error, 'Crear coche')
  return data
}

// Devuelve el coche con su marca y sus fotos (ordenadas)
export async function obtenerCoche(id, cliente = obtenerClientePorDefecto()) {
  const cocheId = validar(idSchema, id)
  const { data, error } = await cliente
    .from('coche')
    .select('*, marca(*), foto_coche(*)')
    .eq('id', cocheId)
    .order('orden', { referencedTable: 'foto_coche' })
    .maybeSingle()
  if (error) lanzarError(error, 'Obtener coche')
  if (!data) throw new Error('Coche no encontrado')
  return data
}

const ORDENACIONES = {
  recientes: ['created_at', false],
  precio_asc: ['precio', true],
  precio_desc: ['precio', false],
  km_asc: ['km', true]
}

// Escapa % _ \ para que el texto se busque literalmente en un ILIKE
const escaparLike = (texto) => texto.replace(/[\\%_]/g, '\\$&')

// Búsqueda paginada. Por defecto solo coches disponibles, página 1 y 10 por página.
export async function buscarCoches(filtros = {}, cliente = obtenerClientePorDefecto()) {
  const f = validar(busquedaSchema, filtros)
  const desde = (f.pagina - 1) * f.porPagina
  const hasta = desde + f.porPagina - 1

  let consulta = cliente
    .from('coche')
    .select('*, marca(id, nombre), foto_coche(url, es_principal, orden)', { count: 'exact' })
    .eq('disponible', f.disponible)

  if (f.marca_id !== undefined) consulta = consulta.eq('marca_id', f.marca_id)
  if (f.combustible) consulta = consulta.eq('combustible', f.combustible)
  if (f.transmision) consulta = consulta.eq('transmision', f.transmision)
  if (f.precio_min !== undefined) consulta = consulta.gte('precio', f.precio_min)
  if (f.precio_max !== undefined) consulta = consulta.lte('precio', f.precio_max)
  if (f.texto) consulta = consulta.ilike('modelo', `%${escaparLike(f.texto)}%`)

  const [campo, ascendente] = ORDENACIONES[f.orden]
  // El id como segundo criterio hace estable la paginación cuando hay empates
  consulta = consulta.order(campo, { ascending: ascendente }).order('id').range(desde, hasta)

  const { data, count, error } = await consulta
  if (error) lanzarError(error, 'Buscar coches')

  return {
    datos: data.map(resumirCoche),
    pagina: f.pagina,
    porPagina: f.porPagina,
    total: count,
    totalPaginas: Math.ceil(count / f.porPagina)
  }
}

// Con RLS, editar o borrar sin ser admin (o un coche inexistente) afecta a 0 filas, sin error de Postgres
const SIN_PERMISOS = 'Coche no encontrado o sin permisos'

// Solo administradores. Admite cualquier subconjunto de campos (al menos uno).
export async function actualizarCoche(id, cambios, cliente = obtenerClientePorDefecto()) {
  const cocheId = validar(idSchema, id)
  const datos = validar(actualizarCocheSchema, cambios)
  const { data, error } = await cliente.from('coche').update(datos).eq('id', cocheId).select().maybeSingle()
  if (error) lanzarError(error, 'Actualizar coche')
  if (!data) throw new Error(SIN_PERMISOS)
  return data
}

// Solo administradores. Sus fotos se borran en cascada.
export async function eliminarCoche(id, cliente = obtenerClientePorDefecto()) {
  const cocheId = validar(idSchema, id)
  const { data, error } = await cliente.from('coche').delete().eq('id', cocheId).select().maybeSingle()
  if (error) lanzarError(error, 'Eliminar coche')
  if (!data) throw new Error(SIN_PERMISOS)
  return data
}
