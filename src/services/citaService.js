import { obtenerClientePorDefecto } from '../lib/supabaseClient.js'
import { lanzarError } from '../lib/errores.js'
import { obtenerUsuarioActual } from '../lib/usuarioActual.js'
import { idSchema } from '../validation/coche.js'
import { citaSchema, DURACION_CITA_MINUTOS } from '../validation/cita.js'
import { validar } from '../validation/usuario.js'

// Requiere sesión. Crea una cita pendiente de 30 minutos a nombre del usuario autenticado.
export async function solicitarCita(datos, cliente = obtenerClientePorDefecto()) {
  const cita = validar(citaSchema, datos)
  const usuario = await obtenerUsuarioActual(cliente)

  const { data: coche, error: errorCoche } = await cliente
    .from('coche')
    .select('id, disponible')
    .eq('id', cita.coche_id)
    .maybeSingle()
  if (errorCoche) lanzarError(errorCoche, 'Solicitar cita')
  if (!coche) throw new Error('Coche no encontrado')
  if (!coche.disponible) throw new Error('El coche no está disponible')

  const fin = new Date(cita.inicio.getTime() + DURACION_CITA_MINUTOS * 60_000)
  const { data, error } = await cliente
    .from('cita')
    .insert({
      usuario_id: usuario.id,
      coche_id: cita.coche_id,
      inicio: cita.inicio.toISOString(),
      fin: fin.toISOString(),
      nota_cliente: cita.nota_cliente
    })
    .select()
    .single()
  if (error) lanzarError(error, 'Solicitar cita')
  return data
}

// Requiere sesión. Solo devuelve las citas del usuario (lo garantiza la RLS), por fecha, con datos del coche.
export async function listarMisCitas(cliente = obtenerClientePorDefecto()) {
  await obtenerUsuarioActual(cliente)
  const { data, error } = await cliente
    .from('cita')
    .select('*, coche(id, modelo, marca(nombre))')
    .order('inicio')
    .order('id')
  if (error) lanzarError(error, 'Listar citas')
  return data
}

// Requiere sesión. Cancela una cita propia que no esté ya cancelada (la cita deja libre su horario).
export async function cancelarCita(id, cliente = obtenerClientePorDefecto()) {
  const citaId = validar(idSchema, id)
  await obtenerUsuarioActual(cliente)
  const { data, error } = await cliente
    .from('cita')
    .update({ estado: 'cancelada' })
    .eq('id', citaId)
    .select()
    .maybeSingle()
  if (error) lanzarError(error, 'Cancelar cita')
  // Con RLS, una cita ajena o ya cancelada afecta a 0 filas
  if (!data) throw new Error('Cita no encontrada, ya cancelada o sin permisos')
  return data
}
