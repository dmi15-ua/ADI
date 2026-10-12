// Devuelve el usuario de la sesión del cliente (la verifica contra Supabase Auth) o falla
export async function obtenerUsuarioActual(cliente) {
  const { data, error } = await cliente.auth.getUser()
  if (error || !data.user) throw new Error('Debes iniciar sesión')
  return data.user
}
