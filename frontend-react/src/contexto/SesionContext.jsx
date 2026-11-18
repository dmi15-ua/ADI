import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { login, logout, obtenerSesion } from '../servicios/services/authService.js'
import { obtenerPerfil } from '../servicios/services/perfilService.js'

// Sesión del usuario, compartida con todos los componentes mediante un Context de React.
// supabase-js guarda el token en el localStorage y lo restaura al recargar; aquí se guarda en memoria una copia
// del usuario y de su perfil (el rol) para decidir qué se muestra. La autorización de verdad la aplica Supabase (RLS).
const SesionContext = createContext(null)

export function SesionProvider({ children }) {
  const [usuario, setUsuario] = useState(null)
  const [perfil, setPerfil] = useState(null)
  const [iniciada, setIniciada] = useState(false) // ya se ha comprobado si había una sesión guardada

  // Sin perfil se trata como un usuario normal: la interfaz no ofrece acciones de administrador
  const cargarPerfil = useCallback(async (persona) => {
    try {
      return await obtenerPerfil(persona.id)
    } catch {
      return null
    }
  }, [])

  // Al arrancar: restaurar la sesión guardada
  useEffect(() => {
    let cancelado = false
    ;(async () => {
      try {
        const guardado = await obtenerSesion()
        if (guardado) {
          const perfilGuardado = await cargarPerfil(guardado)
          if (cancelado) return
          setUsuario(guardado)
          setPerfil(perfilGuardado)
        }
      } catch {
        // si no se puede comprobar, se empieza sin sesión
      } finally {
        if (!cancelado) setIniciada(true)
      }
    })()
    return () => {
      cancelado = true
    }
  }, [cargarPerfil])

  // Los errores (credenciales incorrectas, red...) los recibe quien llama, para mostrarlos en su formulario
  const entrar = useCallback(
    async (email, password) => {
      const resultado = await login({ email, password })
      const perfilNuevo = await cargarPerfil(resultado.usuario)
      setUsuario(resultado.usuario)
      setPerfil(perfilNuevo)
    },
    [cargarPerfil]
  )

  // La interfaz deja de mostrar los datos del usuario aunque falle la llamada al servidor
  const salir = useCallback(async () => {
    try {
      await logout()
    } finally {
      setUsuario(null)
      setPerfil(null)
    }
  }, [])

  const valor = useMemo(
    () => ({
      usuario,
      perfil,
      iniciada,
      autenticado: usuario !== null,
      esAdmin: perfil?.rol === 'admin',
      nombre: perfil?.nombre ?? usuario?.email ?? '',
      entrar,
      salir
    }),
    [usuario, perfil, iniciada, entrar, salir]
  )

  return <SesionContext.Provider value={valor}>{children}</SesionContext.Provider>
}

export function useSesion() {
  const valor = useContext(SesionContext)
  if (!valor) throw new Error('useSesion debe usarse dentro de <SesionProvider>')
  return valor
}
