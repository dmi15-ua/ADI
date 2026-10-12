import { obtenerClientePorDefecto } from '../lib/supabaseClient.js'
import { registroSchema, loginSchema, validar } from '../validation/usuario.js'

export async function registrar(datos, cliente = obtenerClientePorDefecto()) {
  const { email, password, nombre, telefono } = validar(registroSchema, datos)
  const { data, error } = await cliente.auth.signUp({
    email,
    password,
    options: { data: { nombre, telefono } }
  })
  if (error) throw new Error(error.message)
  return { usuario: data.user, sesion: data.session }
}

export async function login(datos, cliente = obtenerClientePorDefecto()) {
  const { email, password } = validar(loginSchema, datos)
  const { data, error } = await cliente.auth.signInWithPassword({ email, password })
  if (error) throw new Error(error.message)
  // data.session.access_token es el JWT generado por Supabase Auth
  return { usuario: data.user, sesion: data.session }
}

export async function logout(cliente = obtenerClientePorDefecto()) {
  const { error } = await cliente.auth.signOut()
  if (error) throw new Error(error.message)
}
