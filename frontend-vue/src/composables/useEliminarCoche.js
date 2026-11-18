import { useCochesStore } from '../stores/coches.js'
import { useConfirmacion } from './useConfirmacion.js'
import { useNotificaciones } from './useNotificaciones.js'
import { mensajeDeError } from '../utils/errores.js'

// Elimina un coche tras pedir confirmación. Lo comparten el listado y la ficha.
// Devuelve una función que resuelve a true si el coche se ha eliminado y a false si no (se canceló o falló).
// Quien la llama decide qué hacer después (recargar el listado, volver a él...).
export function useEliminarCoche() {
  const coches = useCochesStore()
  const { confirmar } = useConfirmacion()
  const notificaciones = useNotificaciones()

  return async function eliminarConConfirmacion(coche) {
    if (coches.eliminandoId !== null) return false // ya hay un borrado en curso

    const nombre = `${coche.marca.nombre} ${coche.modelo}`
    const confirmado = await confirmar({
      titulo: 'Eliminar coche',
      mensaje: `¿Seguro que quieres eliminar ${nombre}? Esta acción no se puede deshacer y también se eliminarán sus fotos.`,
      textoAceptar: 'Eliminar',
      textoCancelar: 'Cancelar',
      peligro: true
    })
    if (!confirmado) return false

    try {
      await coches.eliminar(coche.id)
      notificaciones.exito('Coche eliminado', `${nombre} ya no está en el catálogo`)
      return true
    } catch (fallo) {
      notificaciones.error('No se pudo eliminar el coche', mensajeDeError(fallo))
      return false
    }
  }
}
