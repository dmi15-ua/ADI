import { obtenerClientePorDefecto } from '../lib/supabaseClient.js'
import { lanzarError } from '../lib/errores.js'
import { idSchema } from '../validation/coche.js'
import { fotoSchema } from '../validation/foto.js'
import { validar } from '../validation/usuario.js'

async function comprobarQueExisteElCoche(cocheId, cliente) {
  const { data, error } = await cliente.from('coche').select('id').eq('id', cocheId).maybeSingle()
  if (error) lanzarError(error, 'Comprobar coche')
  if (!data) throw new Error('Coche no encontrado')
}

// Público. Fotos de un coche ordenadas por el campo orden.
export async function listarFotos(cocheId, cliente = obtenerClientePorDefecto()) {
  const id = validar(idSchema, cocheId)
  await comprobarQueExisteElCoche(id, cliente)
  const { data, error } = await cliente
    .from('foto_coche')
    .select('*')
    .eq('coche_id', id)
    .order('orden')
    .order('id')
  if (error) lanzarError(error, 'Listar fotos')
  return data
}

// Solo administradores. Si no se indica orden, la foto va al final.
// Si es_principal es true, la anterior foto principal deja de serlo.
export async function anadirFoto(cocheId, datos, cliente = obtenerClientePorDefecto()) {
  const id = validar(idSchema, cocheId)
  const foto = validar(fotoSchema, datos)

  if (foto.orden === undefined) {
    const { data: ultima, error } = await cliente
      .from('foto_coche')
      .select('orden')
      .eq('coche_id', id)
      .order('orden', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (error) lanzarError(error, 'Añadir foto')
    foto.orden = ultima ? ultima.orden + 1 : 0
  }

  if (foto.es_principal) {
    const { error } = await cliente
      .from('foto_coche')
      .update({ es_principal: false })
      .eq('coche_id', id)
      .eq('es_principal', true)
    if (error) lanzarError(error, 'Añadir foto')
  }

  const { data, error } = await cliente
    .from('foto_coche')
    .insert({ ...foto, coche_id: id })
    .select()
    .single()
  if (error) {
    if (error.code === '23503') throw new Error('Coche no encontrado')
    lanzarError(error, 'Añadir foto')
  }
  return data
}

// Solo administradores.
export async function eliminarFoto(fotoId, cliente = obtenerClientePorDefecto()) {
  const id = validar(idSchema, fotoId)
  const { data, error } = await cliente.from('foto_coche').delete().eq('id', id).select().maybeSingle()
  if (error) lanzarError(error, 'Eliminar foto')
  if (!data) throw new Error('Foto no encontrada o sin permisos')
  return data
}
