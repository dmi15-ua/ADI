import { useConfirm } from 'primevue/useconfirm'

// Pide confirmación con un diálogo y devuelve una promesa: true si el usuario acepta, false si cancela o cierra.
// Se usará, por ejemplo, antes de eliminar un coche.
export function useConfirmacion() {
  const confirm = useConfirm()

  function confirmar({ titulo = 'Confirmar', mensaje, textoAceptar = 'Aceptar', textoCancelar = 'Cancelar', peligro = false }) {
    return new Promise((resolver) => {
      confirm.require({
        header: titulo,
        message: mensaje,
        icon: peligro ? 'pi pi-exclamation-triangle' : 'pi pi-question-circle',
        rejectProps: { label: textoCancelar, severity: 'secondary', outlined: true },
        acceptProps: { label: textoAceptar, severity: peligro ? 'danger' : 'primary' },
        accept: () => resolver(true),
        reject: () => resolver(false),
        onHide: () => resolver(false)
      })
    })
  }

  return { confirmar }
}
