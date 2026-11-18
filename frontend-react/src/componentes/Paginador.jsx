// Paginador sencillo: anterior, números de página y siguiente. No pide datos: avisa de la página elegida con «onCambiar».
export default function Paginador({ pagina, totalPaginas, total, porPagina, onCambiar }) {
  if (totalPaginas < 1) return null
  const desde = (pagina - 1) * porPagina + 1
  const hasta = Math.min(pagina * porPagina, total)
  const paginas = Array.from({ length: totalPaginas }, (_, i) => i + 1)

  return (
    <nav className="paginador" aria-label="Paginación">
      <button type="button" className="boton boton-secundario" aria-label="Página anterior" disabled={pagina <= 1} onClick={() => onCambiar(pagina - 1)}>
        ‹
      </button>
      {paginas.map((n) => (
        <button
          key={n}
          type="button"
          className={n === pagina ? 'boton boton-activo' : 'boton boton-secundario'}
          aria-label={`Página ${n}`}
          aria-current={n === pagina ? 'page' : undefined}
          onClick={() => onCambiar(n)}
        >
          {n}
        </button>
      ))}
      <button type="button" className="boton boton-secundario" aria-label="Página siguiente" disabled={pagina >= totalPaginas} onClick={() => onCambiar(pagina + 1)}>
        ›
      </button>
      <span className="informe">
        Mostrando {desde}-{hasta} de {total} coches
      </span>
    </nav>
  )
}
