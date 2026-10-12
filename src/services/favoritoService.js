import { obtenerClientePorDefecto } from '../lib/supabaseClient.js'
import { lanzarError } from '../lib/errores.js'
import { obtenerUsuarioActual } from '../lib/usuarioActual.js'
import { resumirCoche } from '../lib/resumirCoche.js'
import { idSchema } from '../validation/coche.js'
import { validar } from '../validation/usuario.js'

// Requiere sesión. Guarda un coche en los favoritos del usuario autenticado.
export async function anadirFavorito(cocheId, cliente = obtenerClientePorDefecto()) {
  const id = validar(idSchema, cocheId)
  const usuario = await obtenerUsuarioActual(cliente)

  const { data: coche, error: errorCoche } = await cliente.from('coche').select('id').eq('id', id).maybeSingle()
  if (errorCoche) lanzarError(errorCoche, 'Añadir favorito')
  if (!coche) throw new Error('Coche no encontrado')

  const { data, error } = await cliente
    .from('favorito')
    .insert({ usuario_id: usuario.id, coche_id: id })
    .select()
    .single()
  if (error) {
    if (error.code === '23505') throw new Error('El coche ya está en tus favoritos')
    lanzarError(error, 'Añadir favorito')
  }
  return data
}

// Requiere sesión. Favoritos del usuario (solo los suyos, por la RLS), del más reciente al más antiguo.
export async function listarFavoritos(cliente = obtenerClientePorDefecto()) {
  await obtenerUsuarioActual(cliente)
  const { data, error } = await cliente
    .from('favorito')
    .select('fecha_guardado, coche(*, marca(id, nombre), foto_coche(url, es_principal, orden))')
    .order('fecha_guardado', { ascending: false })
  if (error) lanzarError(error, 'Listar favoritos')
  return data.map(({ fecha_guardado, coche }) => ({ fecha_guardado, coche: resumirCoche(coche) }))
}

// Requiere sesión. Quita un coche de los favoritos del usuario.
export async function quitarFavorito(cocheId, cliente = obtenerClientePorDefecto()) {
  const id = validar(idSchema, cocheId)
  const usuario = await obtenerUsuarioActual(cliente)
  const { data, error } = await cliente
    .from('favorito')
    .delete()
    .eq('usuario_id', usuario.id)
    .eq('coche_id', id)
    .select()
    .maybeSingle()
  if (error) lanzarError(error, 'Quitar favorito')
  if (!data) throw new Error('El coche no está en tus favoritos')
  return data
}
