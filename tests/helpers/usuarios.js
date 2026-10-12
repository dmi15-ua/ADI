import { crearCliente } from '../../src/lib/supabaseClient.js'
import { registrar, login } from '../../src/services/authService.js'
import { clienteAdmin } from './clientes.js'

export function datosUsuarioUnico(prefijo = 'test') {
  const sufijo = `${Date.now()}${Math.floor(Math.random() * 1e6)}`
  return {
    email: `${prefijo}.${sufijo}@example.com`,
    password: 'Password123!',
    nombre: `Usuario ${prefijo}`,
    telefono: '600123456'
  }
}

// Registra un usuario y devuelve su cliente ya autenticado
export async function crearUsuarioAutenticado(prefijo) {
  const datos = datosUsuarioUnico(prefijo)
  const cliente = crearCliente()
  const { usuario } = await registrar(datos, cliente)
  await login({ email: datos.email, password: datos.password }, cliente)
  return { cliente, usuario, datos }
}

// Igual que el anterior, pero con rol admin (se asigna con la service role, como se haría a mano en la BD)
export async function crearAdminAutenticado(prefijo = 'admin') {
  const u = await crearUsuarioAutenticado(prefijo)
  const { error } = await clienteAdmin().from('perfil').update({ rol: 'admin' }).eq('id', u.usuario.id)
  if (error) throw new Error(error.message)
  return u
}

export async function borrarUsuarios(ids) {
  const admin = clienteAdmin()
  for (const id of ids) await admin.auth.admin.deleteUser(id)
}
