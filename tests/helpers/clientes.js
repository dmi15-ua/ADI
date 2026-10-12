import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

export const clienteAnonimo = () =>
  createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY)

export const clienteAdmin = () =>
  createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false }
  })
