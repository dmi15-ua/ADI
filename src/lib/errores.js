// Convierte errores de Supabase/Postgres en mensajes claros para el cliente
export function lanzarError(error, contexto = 'La operación') {
  switch (error.code) {
    case '42501':
      throw new Error('No autorizado')
    case '23505':
      throw new Error(`${contexto}: ya existe un registro con esos datos`)
    case '23503':
      throw new Error(`${contexto}: referencia a un registro que no existe`)
    case '23514':
      throw new Error(`${contexto}: datos no válidos`)
    case '23P01':
      throw new Error(`${contexto}: ya existe una cita en ese horario para ese coche`)
    default:
      throw new Error(error.message)
  }
}
