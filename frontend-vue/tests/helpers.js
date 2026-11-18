import { vi } from 'vitest'

// Cliente de Supabase falso: guarda las llamadas encadenadas y responde con lo que se le indique.
// Sirve para comprobar la capa de servicios sin red ni base de datos.
export function crearClienteFalso(respuestas = {}) {
  const llamadas = []
  const constructor = (tabla) => {
    const registro = { tabla, pasos: [] }
    llamadas.push(registro)
    const respuesta = () => respuestas[tabla] ?? { data: null, error: null }
    const consulta = new Proxy(
      {},
      {
        get(_, metodo) {
          if (metodo === 'then') {
            return (resolver, rechazar) => Promise.resolve(respuesta()).then(resolver, rechazar)
          }
          return (...args) => {
            registro.pasos.push([metodo, ...args])
            return metodo === 'single' || metodo === 'maybeSingle'
              ? Promise.resolve(respuesta())
              : consulta
          }
        }
      }
    )
    return consulta
  }
  return {
    llamadas,
    from: vi.fn(constructor),
    auth: {
      getUser: vi.fn(async () => ({ data: { user: { id: 'u1' } }, error: null })),
      getSession: vi.fn(async () => ({ data: { session: null }, error: null })),
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(async () => ({ error: null }))
    }
  }
}
