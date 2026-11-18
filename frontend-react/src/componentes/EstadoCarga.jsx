// Muestra el estado de una carga de datos: error (con botón para reintentar), cargando, vacío o el contenido.
// Distingue un error al obtener los datos de que simplemente no haya datos.
export default function EstadoCarga({ cargando = false, error = '', vacio = false, textoVacio = 'No hay datos que mostrar.', textoCargando = 'Cargando...', onReintentar, children }) {
  if (error) {
    return (
      <div className="estado estado-error" role="alert">
        <p>{error}</p>
        <button type="button" className="boton boton-secundario" onClick={onReintentar}>
          Reintentar
        </button>
      </div>
    )
  }
  if (cargando && vacio) {
    return (
      <div className="estado estado-cargando" role="status">
        <span className="spinner" aria-hidden="true" />
        <span>{textoCargando}</span>
      </div>
    )
  }
  if (vacio) {
    return (
      <div className="estado estado-vacio">
        <p>{textoVacio}</p>
      </div>
    )
  }
  // Con datos anteriores en pantalla, mientras se carga otra página se atenúan y no se pueden pulsar
  return (
    <div className={cargando ? 'ocupado' : undefined} aria-busy={cargando}>
      {children}
    </div>
  )
}
