import { obtenerClientePorDefecto } from '../lib/supabaseClient.js'
import { actualizarPerfilSchema, validar } from '../validation/usuario.js'

export async function obtenerPerfil(id, cliente = obtenerClientePorDefecto()) {
  const { data, error } = await cliente.from('perfil').select('*').eq('id', id).maybeSingle()
  if (error) throw new Error(error.message)
  if (!data) throw new Error('Perfil no encontrado o sin permisos')
  return data
}

export async function actualizarPerfil(id, cambios, cliente = obtenerClientePorDefecto()) {
  const datos = validar(actualizarPerfilSchema, cambios)
  const { data, error } = await cliente
    .from('perfil')
    .update(datos)
    .eq('id', id)
    .select()
    .maybeSingle()
  if (error) throw new Error(error.message)
  // Con RLS, editar el perfil de otro usuario afecta a 0 filas
  if (!data) throw new Error('Perfil no encontrado o sin permisos')
  return data
}
