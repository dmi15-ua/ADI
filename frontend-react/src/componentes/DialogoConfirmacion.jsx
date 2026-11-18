import { useEffect, useRef } from 'react'

// Diálogo de confirmación. Se abre al renderizarlo y se cierra al dejar de renderizarlo:
// quien lo usa decide cuándo mostrarlo y qué hacer con «aceptar» y «cancelar» (también al pulsar Escape o fuera del diálogo).
export default function DialogoConfirmacion({ titulo, mensaje, textoAceptar = 'Aceptar', textoCancelar = 'Cancelar', peligro = false, onAceptar, onCancelar }) {
  const botonCancelar = useRef(null)

  // Al abrirse, el foco va al botón seguro (cancelar), y Escape cancela
  useEffect(() => {
    botonCancelar.current?.focus()
    const alPulsarTecla = (evento) => {
      if (evento.key === 'Escape') onCancelar()
    }
    document.addEventListener('keydown', alPulsarTecla)
    return () => document.removeEventListener('keydown', alPulsarTecla)
  }, [onCancelar])

  return (
    <div className="fondo-dialogo" onClick={onCancelar}>
      <div className="dialogo" role="dialog" aria-modal="true" aria-labelledby="titulo-dialogo" aria-describedby="mensaje-dialogo" onClick={(evento) => evento.stopPropagation()}>
        <h2 id="titulo-dialogo">{titulo}</h2>
        <p id="mensaje-dialogo">{mensaje}</p>
        <div className="acciones">
          <button type="button" ref={botonCancelar} className="boton boton-secundario" onClick={onCancelar}>
            {textoCancelar}
          </button>
          <button type="button" className={peligro ? 'boton boton-peligro' : 'boton'} onClick={onAceptar}>
            {textoAceptar}
          </button>
        </div>
      </div>
    </div>
  )
}
