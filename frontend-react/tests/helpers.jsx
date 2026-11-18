import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SesionProvider } from '../src/contexto/SesionContext.jsx'
import App from '../src/App.jsx'

// Datos de prueba: un coche tal como lo devuelve buscarCoches (con su marca y su foto principal)
export function crearCoche(id, extra = {}) {
  return {
    id,
    marca_id: 1,
    modelo: `Modelo ${id}`,
    precio: 10000 + id * 100,
    km: 20000 + id * 1000,
    anio: 2020,
    combustible: 'gasolina',
    transmision: 'manual',
    potencia_cv: 110,
    descripcion: null,
    equipamiento: [],
    disponible: true,
    marca: { id: 1, nombre: 'Seat' },
    foto_principal: `https://fotos.test/${id}.jpg`,
    ...extra
  }
}

// Simula la respuesta de buscarCoches sobre una lista completa (misma forma que la del servicio)
export function respuestaDePagina(todos, { pagina = 1, porPagina = 10 } = {}) {
  const desde = (pagina - 1) * porPagina
  return { datos: todos.slice(desde, desde + porPagina), pagina, porPagina, total: todos.length, totalPaginas: Math.ceil(todos.length / porPagina) }
}

export function montarApp() {
  const usuario = userEvent.setup()
  const resultado = render(
    <SesionProvider>
      <App />
    </SesionProvider>
  )
  return { usuario, ...resultado }
}
