import { etiquetaCombustible, etiquetaTransmision, formatoKm, formatoPrecio } from '../utils/formato.js'

// Tarjeta de un coche en el listado. El botón de eliminar solo existe si se le pasa «onEliminar» (los administradores).
export default function TarjetaCoche({ coche, onEliminar, eliminando = false, bloqueada = false }) {
  const titulo = `${coche.marca.nombre} ${coche.modelo}`
  return (
    <article className="coche">
      <div className="foto">
        {coche.foto_principal ? <img src={coche.foto_principal} alt={titulo} loading="lazy" /> : <div className="sin-foto">Sin foto</div>}
      </div>
      <div className="cuerpo">
        <h3>{titulo}</h3>
        <p className="precio">{formatoPrecio(coche.precio)}</p>
        <p className="datos">
          {coche.anio} · {formatoKm(coche.km)}
        </p>
        <div className="etiquetas">
          <span className="etiqueta etiqueta-info">{etiquetaCombustible(coche.combustible)}</span>
          <span className="etiqueta">{etiquetaTransmision(coche.transmision)}</span>
        </div>
      </div>
      {onEliminar && (
        <footer>
          <button type="button" className="boton boton-peligro-suave" aria-label={`Eliminar ${titulo}`} disabled={bloqueada} onClick={() => onEliminar(coche)}>
            {eliminando ? 'Eliminando...' : 'Eliminar'}
          </button>
        </footer>
      )}
    </article>
  )
}
