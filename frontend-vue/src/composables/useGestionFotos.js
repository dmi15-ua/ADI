import { ref } from 'vue'
import { useCochesStore } from '../stores/coches.js'
import { useConfirmacion } from './useConfirmacion.js'
import { useNotificaciones } from './useNotificaciones.js'
import { mensajeDeError } from '../utils/errores.js'

// Añadir y eliminar las fotos del coche que se está viendo (solo administradores). `coche` es una referencia
// (ref o computed) al coche de la ficha. Tras cada cambio se refresca la ficha sin recargar la página.
export function useGestionFotos(coche) {
  const coches = useCochesStore()
  const { confirmar } = useConfirmacion()
  const notificaciones = useNotificaciones()

  const anadiendo = ref(false)
  const eliminandoId = ref(null) // la foto que se está eliminando
  const errorAnadir = ref('') // el error al añadir se muestra junto al formulario, que conserva lo escrito

  // El cambio ya está guardado; si falla solo el refresco, se avisa en lugar de dar a entender que falló el cambio
  async function refrescar() {
    try {
      await coches.refrescarDetalle()
    } catch {
      notificaciones.aviso('Cambio guardado', 'No se pudo actualizar la ficha. Recarga la página para verlo.')
    }
  }

  async function anadir(datos) {
    if (anadiendo.value || eliminandoId.value !== null) return
    errorAnadir.value = ''
    anadiendo.value = true
    try {
      await coches.anadirFoto(coche.value.id, datos)
      notificaciones.exito('Foto añadida')
    } catch (fallo) {
      errorAnadir.value = mensajeDeError(fallo, 'No se pudo añadir la foto')
      return
    } finally {
      anadiendo.value = false
    }
    await refrescar()
  }

  async function eliminar(foto) {
    if (anadiendo.value || eliminandoId.value !== null) return
    const confirmado = await confirmar({
      titulo: 'Eliminar foto',
      mensaje: foto.es_principal
        ? '¿Seguro que quieres eliminar esta foto? Es la foto principal: pasará a mostrarse la primera que quede. Esta acción no se puede deshacer.'
        : '¿Seguro que quieres eliminar esta foto? Esta acción no se puede deshacer.',
      textoAceptar: 'Eliminar',
      peligro: true
    })
    if (!confirmado) return

    eliminandoId.value = foto.id
    try {
      await coches.eliminarFoto(foto.id)
      notificaciones.exito('Foto eliminada')
    } catch (fallo) {
      notificaciones.error('No se pudo eliminar la foto', mensajeDeError(fallo))
      return
    } finally {
      eliminandoId.value = null
    }
    await refrescar()
  }

  return { anadiendo, eliminandoId, errorAnadir, anadir, eliminar }
}
