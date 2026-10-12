import { obtenerClientePorDefecto } from '../lib/supabaseClient.js'
import { lanzarError } from '../lib/errores.js'
import { marcaSchema } from '../validation/coche.js'
import { validar } from '../validation/usuario.js'

// Solo administradores (lo garantiza la RLS)
export async function crearMarca(datos, cliente = obtenerClientePorDefecto()) {
  const marca = validar(marcaSchema, datos)
  const { data, error } = await cliente.from('marca').insert(marca).select().single()
  if (error) lanzarError(error, 'Crear marca')
  return data
}

export async function listarMarcas(cliente = obtenerClientePorDefecto()) {
  const { data, error } = await cliente.from('marca').select('*').order('nombre')
  if (error) lanzarError(error, 'Listar marcas')
  return data
}
