import { useRouter } from 'vue-router'

// «Volver al listado»: si se llegó desde el listado, se vuelve a la misma página en la que se estaba
// (la página anterior la guarda el historial del navegador); si no, se va a la primera página del listado.
export function useVolverAlListado() {
  const router = useRouter()

  return function volver() {
    const anterior = router.options.history.state.back
    const veniaDelListado = typeof anterior === 'string' && (anterior === '/' || anterior.startsWith('/?'))
    if (veniaDelListado) router.back()
    else router.push({ name: 'listado' })
  }
}
