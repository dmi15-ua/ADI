import { useState } from 'react'
import { loginSchema } from '../servicios/validation/usuario.js'
import { mensajeDeError } from '../utils/errores.js'
import { useSesion } from '../contexto/SesionContext.jsx'

// Formulario de inicio de sesión. Valida con el esquema de la capa de servicios (el mismo del backend)
// y, si va bien, entra y avisa con «onEntrar».
export default function LoginForm({ onEntrar, onCancelar }) {
  const { entrar } = useSesion()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errores, setErrores] = useState({}) // mensaje de validación de cada campo
  const [errorGeneral, setErrorGeneral] = useState('') // fallo devuelto por el servidor (credenciales, red...)
  const [enviando, setEnviando] = useState(false)

  async function enviar(evento) {
    evento.preventDefault()
    setErrorGeneral('')
    const resultado = loginSchema.safeParse({ email, password })
    if (!resultado.success) {
      const nuevos = {}
      for (const problema of resultado.error.issues) nuevos[problema.path[0]] ??= problema.message
      setErrores(nuevos)
      return
    }
    setErrores({})
    setEnviando(true)
    try {
      await entrar(resultado.data.email, resultado.data.password)
      onEntrar()
    } catch (fallo) {
      setErrorGeneral(mensajeDeError(fallo))
      setEnviando(false)
    }
  }

  return (
    <section className="login">
      <h2>Iniciar sesión</h2>
      <form noValidate onSubmit={enviar}>
        <div className="campo">
          <label htmlFor="email">Email</label>
          <input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} aria-invalid={!!errores.email} aria-describedby={errores.email ? 'error-email' : undefined} />
          {errores.email && (
            <small className="error" id="error-email">
              {errores.email}
            </small>
          )}
        </div>
        <div className="campo">
          <label htmlFor="password">Contraseña</label>
          <input id="password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} aria-invalid={!!errores.password} aria-describedby={errores.password ? 'error-password' : undefined} />
          {errores.password && (
            <small className="error" id="error-password">
              {errores.password}
            </small>
          )}
        </div>
        {errorGeneral && (
          <p className="mensaje mensaje-error" role="alert">
            {errorGeneral}
          </p>
        )}
        <div className="acciones">
          <button type="submit" className="boton" disabled={enviando}>
            {enviando ? 'Entrando...' : 'Entrar'}
          </button>
          <button type="button" className="boton boton-secundario" disabled={enviando} onClick={onCancelar}>
            Cancelar
          </button>
        </div>
      </form>
    </section>
  )
}
