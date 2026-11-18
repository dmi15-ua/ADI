import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { login, logout, obtenerSesion, registrar } from '../servicios/services/authService.js'
import { obtenerPerfil } from '../servicios/services/perfilService.js'

// Sesión del usuario. supabase-js guarda el token en el localStorage del navegador y lo restaura al recargar;
// esta tienda guarda en memoria una copia del usuario y de su perfil para pintar la interfaz.
export const useSesionStore = defineStore('sesion', () => {
  const usuario = ref(null)
  const perfil = ref(null)
  const iniciada = ref(false) // ya se ha comprobado si había una sesión guardada
  const cargando = ref(false) // hay un login en curso

  const autenticado = computed(() => usuario.value !== null)
  const esAdmin = computed(() => perfil.value?.rol === 'admin')
  // Lo que se muestra en la cabecera: el nombre del perfil o, si no hay, el email
  const nombre = computed(() => perfil.value?.nombre ?? usuario.value?.email ?? '')

  async function cargarPerfil() {
    try {
      perfil.value = await obtenerPerfil(usuario.value.id)
    } catch {
      // Sin perfil se trata como un usuario normal: la interfaz no ofrece acciones de administrador
      perfil.value = null
    }
  }

  // Restaura la sesión guardada. Solo se ejecuta una vez, aunque se llame desde varios sitios.
  let inicio = null
  function iniciar() {
    inicio ??= (async () => {
      try {
        const guardado = await obtenerSesion()
        if (guardado) {
          usuario.value = guardado
          await cargarPerfil()
        }
      } catch {
        usuario.value = null
        perfil.value = null
      } finally {
        iniciada.value = true
      }
    })()
    return inicio
  }

  async function entrar(email, password) {
    cargando.value = true
    try {
      const resultado = await login({ email, password })
      usuario.value = resultado.usuario
      await cargarPerfil()
    } finally {
      cargando.value = false
    }
  }

  // Crea la cuenta (el perfil lo crea la base de datos con un trigger). Si Supabase devuelve una sesión
  // (confirmación de email desactivada), el usuario queda dentro; si no, tendrá que confirmar su email.
  // Devuelve true si ha quedado con la sesión iniciada.
  async function registrarse(datos) {
    cargando.value = true
    try {
      const resultado = await registrar(datos)
      if (!resultado.sesion) return false
      usuario.value = resultado.usuario
      await cargarPerfil()
      return true
    } finally {
      cargando.value = false
    }
  }

  // La interfaz deja de mostrar los datos del usuario aunque falle la llamada al servidor
  async function salir() {
    try {
      await logout()
    } finally {
      usuario.value = null
      perfil.value = null
    }
  }

  return { usuario, perfil, iniciada, cargando, autenticado, esAdmin, nombre, iniciar, entrar, registrarse, salir }
})
