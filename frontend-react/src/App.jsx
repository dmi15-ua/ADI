import { useState } from 'react'
import { useSesion } from './contexto/SesionContext.jsx'
import ListadoCoches from './componentes/ListadoCoches.jsx'
import LoginForm from './componentes/LoginForm.jsx'

// La aplicación solo tiene dos pantallas (listado e inicio de sesión), así que no usa un router: basta un estado.
export default function App() {
  const { iniciada, autenticado, nombre, esAdmin, salir } = useSesion()
  const [verLogin, setVerLogin] = useState(false)

  // Hasta saber si hay una sesión guardada no se pinta nada que dependa de ella
  if (!iniciada) {
    return (
      <div className="contenedor estado estado-cargando" role="status">
        <span className="spinner" aria-hidden="true" />
        <span>Cargando...</span>
      </div>
    )
  }

  const mostrandoLogin = verLogin && !autenticado

  return (
    <>
      <header className="cabecera">
        <span className="marca">Concesionario (React)</span>
        <div className="sesion">
          {autenticado ? (
            <>
              <span>{nombre}</span>
              {esAdmin && <span className="etiqueta etiqueta-ok">Admin</span>}
              <button type="button" className="boton boton-secundario" onClick={salir}>
                Cerrar sesión
              </button>
            </>
          ) : (
            !mostrandoLogin && (
              <button type="button" className="boton" onClick={() => setVerLogin(true)}>
                Iniciar sesión
              </button>
            )
          )}
        </div>
      </header>
      <main className="contenedor">
        {mostrandoLogin ? <LoginForm onEntrar={() => setVerLogin(false)} onCancelar={() => setVerLogin(false)} /> : <ListadoCoches onIniciarSesion={() => setVerLogin(true)} />}
      </main>
    </>
  )
}
