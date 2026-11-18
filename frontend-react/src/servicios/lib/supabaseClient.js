import { createClient } from '@supabase/supabase-js'

// Versión para el navegador del cliente de la práctica 1: las claves salen de las variables VITE_* (archivo .env),
// no de process.env. Solo se usa la clave pública (anon/publishable), nunca la service_role.
export function crearCliente() {
  const url = import.meta.env.VITE_SUPABASE_URL
  const clave = import.meta.env.VITE_SUPABASE_ANON_KEY
  if (!url || !clave) {
    throw new Error('Faltan VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY. Copia .env.example a .env y rellénalas.')
  }
  return createClient(url, clave)
}

// Cliente compartido por defecto para los servicios (se crea al usarlo por primera vez).
// En el navegador, supabase-js guarda la sesión en localStorage y la restaura al recargar.
let clientePorDefecto
export function obtenerClientePorDefecto() {
  clientePorDefecto ??= crearCliente()
  return clientePorDefecto
}
