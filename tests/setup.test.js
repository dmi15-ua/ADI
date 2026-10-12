import { describe, it, expect } from 'vitest'
import { crearCliente } from '../src/lib/supabaseClient.js'

describe('setup', () => {
  it('tiene las variables de entorno', () => {
    expect(process.env.SUPABASE_URL).toBeTruthy()
    expect(process.env.SUPABASE_ANON_KEY).toBeTruthy()
  })

  it('Auth responde a /health', async () => {
    const r = await fetch(`${process.env.SUPABASE_URL}/auth/v1/health`, {
      headers: { apikey: process.env.SUPABASE_ANON_KEY }
    })
    expect(r.status).toBe(200)
  })

  it('el cliente puede pedir la sesión', async () => {
    const { error } = await crearCliente().auth.getSession()
    expect(error).toBeNull()
  })
})
