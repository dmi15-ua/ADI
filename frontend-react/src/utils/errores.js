// Convierte el error de un servicio en un mensaje comprensible para el usuario.
// Los errores de validación y de permisos de nuestros servicios ya vienen en español; los de Supabase Auth y de red, no.
const TRADUCCIONES = [
  [/invalid login credentials/i, 'Email o contraseña incorrectos'],
  [/email not confirmed/i, 'Todavía no has confirmado tu email'],
  [/failed to fetch|networkerror|load failed|network request failed/i, 'No se pudo conectar con el servidor. Comprueba tu conexión e inténtalo de nuevo.'],
  [/^no autorizado$/i, 'No tienes permiso para realizar esta acción'],
  [/jwt expired/i, 'Tu sesión ha caducado. Vuelve a iniciar sesión.'],
  [/user already registered|already been registered|user_already_exists/i, 'Ya existe una cuenta con ese email'],
  [/rate limit|too many requests|over_email_send_rate_limit/i, 'Demasiados intentos seguidos. Espera un momento e inténtalo de nuevo.'],
  [/password should be at least/i, 'La contraseña debe tener al menos 8 caracteres'],
  [/signups? not allowed|signup is disabled/i, 'El registro de usuarios no está disponible']
]

export function mensajeDeError(error, porDefecto = 'Ha ocurrido un error inesperado') {
  const texto = typeof error === 'string' ? error : error?.message
  if (!texto) return porDefecto
  for (const [patron, mensaje] of TRADUCCIONES) {
    if (patron.test(texto)) return mensaje
  }
  return texto
}
