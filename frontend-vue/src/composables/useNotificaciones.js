import { useToast } from 'primevue/usetoast'

// Mensajes breves al usuario (éxito, error, aviso). Los componentes usan esto y no dependen de la API de PrimeVue.
export function useNotificaciones() {
  const toast = useToast()
  const mostrar = (severity, summary, detail, life) => toast.add({ severity, summary, detail, life })

  return {
    exito: (mensaje, detalle) => mostrar('success', mensaje, detalle, 3000),
    error: (mensaje, detalle) => mostrar('error', mensaje, detalle, 6000),
    aviso: (mensaje, detalle) => mostrar('warn', mensaje, detalle, 5000)
  }
}
