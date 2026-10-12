import { obtenerClientePorDefecto } from '../lib/supabaseClient.js'
import { lanzarError } from '../lib/errores.js'
import { cocheSchema, idSchema } from '../validation/coche.js'
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
