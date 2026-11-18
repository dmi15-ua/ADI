import { defineStore } from 'pinia'
import { ref } from 'vue'
import { buscarCoches, obtenerCoche, crearCoche, actualizarCoche, eliminarCoche } from '../servicios/services/cocheService.js'
import { mensajeDeError } from '../utils/errores.js'

// Listado de coches (compartido por las pantallas que lo necesitan). Los datos son los de la página actual:
// el servidor devuelve cada página, el total y el número de páginas.
export const useCochesStore = defineStore('coches', () => {
  const items = ref([])
  const total = ref(0)
  const totalPaginas = ref(0)
  const pagina = ref(1)
  const porPagina = ref(9)
  const cargando = ref(false)
  const error = ref('')

  // Si se piden varias páginas seguidas, solo cuenta la respuesta de la última petición
  let ultimaPeticion = 0

  async function cargar({ pagina: paginaPedida = pagina.value } = {}) {
    const numero = ++ultimaPeticion
    pagina.value = paginaPedida
    cargando.value = true
    error.value = ''
    try {
      const resultado = await buscarCoches({ pagina: paginaPedida, porPagina: porPagina.value })
      if (numero !== ultimaPeticion) return
      items.value = resultado.datos
      total.value = resultado.total
      totalPaginas.value = resultado.totalPaginas
    } catch (fallo) {
      if (numero !== ultimaPeticion) return
      items.value = []
      error.value = mensajeDeError(fallo, 'No se pudo cargar el listado de coches')
    } finally {
      if (numero === ultimaPeticion) cargando.value = false
    }
  }

  const reintentar = () => cargar({ pagina: pagina.value })

  // ---- Detalle de un coche (con su marca y sus fotos) ----
  const detalle = ref(null)
  const cargandoDetalle = ref(false)
  const errorDetalle = ref('')
  const detalleNoEncontrado = ref(false) // el coche no existe: distinto de un fallo al pedirlo
  let idDetalle = null
  let ultimoDetalle = 0

  async function cargarDetalle(id) {
    const numero = ++ultimoDetalle
    idDetalle = id
    // Se vacía el detalle anterior: al pasar de un coche a otro no debe verse el anterior mientras carga
    detalle.value = null
    cargandoDetalle.value = true
    errorDetalle.value = ''
    detalleNoEncontrado.value = false
    try {
      const coche = await obtenerCoche(id)
      if (numero !== ultimoDetalle) return
      detalle.value = coche
    } catch (fallo) {
      if (numero !== ultimoDetalle) return
      if (/no encontrado/i.test(fallo?.message ?? '')) detalleNoEncontrado.value = true
      else errorDetalle.value = mensajeDeError(fallo, 'No se pudo cargar el coche')
    } finally {
      if (numero === ultimoDetalle) cargandoDetalle.value = false
    }
  }

  const reintentarDetalle = () => cargarDetalle(idDetalle)

  // Crea un coche (solo administradores: lo garantiza la RLS de Supabase). Devuelve el coche creado.
  // El listado y el detalle se vuelven a pedir cuando se abren, así que reflejan el nuevo coche sin recargar la página.
  async function crear(datos) {
    return crearCoche(datos)
  }

  // Modifica un coche (solo administradores). Recibe solo los campos que cambian. Devuelve el coche actualizado.
  // El detalle y el listado se vuelven a pedir cuando se abren, así que reflejan el cambio sin recargar la página.
  async function actualizar(id, cambios) {
    return actualizarCoche(id, cambios)
  }

  // Elimina un coche (solo administradores; sus fotos se borran en cascada en la base de datos).
  // `eliminandoId` indica cuál se está borrando, para desactivar su botón y evitar peticiones repetidas.
  const eliminandoId = ref(null)
  async function eliminar(id) {
    eliminandoId.value = id
    try {
      return await eliminarCoche(id)
    } finally {
      eliminandoId.value = null
    }
  }

  return {
    items, total, totalPaginas, pagina, porPagina, cargando, error, cargar, reintentar,
    detalle, cargandoDetalle, errorDetalle, detalleNoEncontrado, cargarDetalle, reintentarDetalle, crear, actualizar, eliminandoId, eliminar
  }
})
