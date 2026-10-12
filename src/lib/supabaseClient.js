import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

export function crearCliente() {
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY)
}

// Cliente compartido por defecto para los servicios (se crea al usarlo por primera vez)
let clientePorDefecto
export function obtenerClientePorDefecto() {
  clientePorDefecto ??= crearCliente()
  return clientePorDefecto
}
