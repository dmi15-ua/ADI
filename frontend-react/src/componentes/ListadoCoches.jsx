import { useState } from 'react'
import { eliminarCoche } from '../servicios/services/cocheService.js'
import { mensajeDeError } from '../utils/errores.js'
import { useSesion } from '../contexto/SesionContext.jsx'
import { useCoches } from '../hooks/useCoches.js'
import EstadoCarga from './EstadoCarga.jsx'
import DialogoConfirmacion from './DialogoConfirmacion.jsx'
import Paginador from './Paginador.jsx'
import TarjetaCoche from './TarjetaCoche.jsx'

// Pantalla del listado: coches paginados y, para administradores, el borrado con confirmación.
export default function ListadoCoches({ onIniciarSesion }) {
  const { autenticado, esAdmin } = useSesion()
  const coches = useCoches()

  const [pendiente, setPendiente] = useState(null) // coche cuya eliminación espera confirmación
  const [eliminandoId, setEliminandoId] = useState(null)
  const [aviso, setAviso] = useState(null) // { tipo: 'exito' | 'error', titulo, detalle }

  async function confirmarEliminacion() {
    const coche = pendiente
    setPendiente(null)
    setAviso(null)
    setEliminandoId(coche.id)
    try {
      await eliminarCoche(coche.id)
      setAviso({ tipo: 'exito', titulo: 'Coche eliminado', detalle: `${coche.marca.nombre} ${coche.modelo} ya no está en el catálogo` })
      // Se vuelve a pedir la página actual: los demás coches suben de sitio y el total cambia
      await coches.recargar()
    } catch (fallo) {
      setAviso({ tipo: 'error', titulo: 'No se pudo eliminar el coche', detalle: mensajeDeError(fallo) })
    } finally {
      setEliminandoId(null)
    }
  }

  return (
    <section>
      <h2>Coches disponibles</h2>

      {!esAdmin && (
        <p className="nota">
          {autenticado ? (
            'Tu cuenta no tiene permisos de administrador: puedes ver los coches, pero no eliminarlos.'
          ) : (
            <>
              Para eliminar coches,{' '}
              <button type="button" className="enlace" onClick={onIniciarSesion}>
                inicia sesión como administrador
              </button>
              .
            </>
          )}
        </p>
      )}

      {aviso && (
        <div className={`mensaje mensaje-${aviso.tipo}`} role={aviso.tipo === 'error' ? 'alert' : 'status'}>
          <strong>{aviso.titulo}</strong>
          <span>{aviso.detalle}</span>
          <button type="button" className="cerrar" aria-label="Cerrar aviso" onClick={() => setAviso(null)}>
            ×
          </button>
        </div>
      )}

      <EstadoCarga
        cargando={coches.cargando}
        error={coches.error}
        vacio={coches.items.length === 0}
        textoVacio="No hay coches disponibles en este momento."
        textoCargando="Cargando coches..."
        onReintentar={coches.recargar}
      >
        <ul className="rejilla">
          {coches.items.map((coche) => (
            <li key={coche.id}>
              <TarjetaCoche
                coche={coche}
                onEliminar={esAdmin ? setPendiente : undefined}
                eliminando={eliminandoId === coche.id}
                bloqueada={eliminandoId !== null}
              />
            </li>
          ))}
        </ul>
        <Paginador pagina={coches.pagina} totalPaginas={coches.totalPaginas} total={coches.total} porPagina={coches.porPagina} onCambiar={coches.irAPagina} />
      </EstadoCarga>

      {pendiente && (
        <DialogoConfirmacion
          titulo="Eliminar coche"
          mensaje={`¿Seguro que quieres eliminar ${pendiente.marca.nombre} ${pendiente.modelo}? Esta acción no se puede deshacer y también se eliminarán sus fotos.`}
          textoAceptar="Eliminar"
          peligro
          onAceptar={confirmarEliminacion}
          onCancelar={() => setPendiente(null)}
        />
      )}
    </section>
  )
}
