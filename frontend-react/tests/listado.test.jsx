import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, within, waitFor } from '@testing-library/react'
import { montarApp, crearCoche, respuestaDePagina } from './helpers.jsx'
import { obtenerSesion } from '../src/servicios/services/authService.js'
import { obtenerPerfil } from '../src/servicios/services/perfilService.js'
import { buscarCoches, eliminarCoche } from '../src/servicios/services/cocheService.js'

vi.mock('../src/servicios/services/authService.js', () => ({ login: vi.fn(), logout: vi.fn(), obtenerSesion: vi.fn() }))
vi.mock('../src/servicios/services/perfilService.js', () => ({ obtenerPerfil: vi.fn() }))
vi.mock('../src/servicios/services/cocheService.js', () => ({ buscarCoches: vi.fn(), eliminarCoche: vi.fn() }))

let catalogo
const conSesion = (rol) => {
  obtenerSesion.mockResolvedValue({ id: 'u1', email: 'ana@ua.es' })
  obtenerPerfil.mockResolvedValue({ id: 'u1', nombre: 'Ana', rol })
}
const crearCatalogo = (n) => Array.from({ length: n }, (_, i) => crearCoche(i + 1))
const titulos = () => screen.queryAllByRole('heading', { level: 3 }).map((h) => h.textContent)

beforeEach(() => {
  vi.clearAllMocks()
  obtenerSesion.mockResolvedValue(null)
  catalogo = crearCatalogo(25)
  buscarCoches.mockImplementation(async (f) => respuestaDePagina(catalogo, f))
  eliminarCoche.mockImplementation(async (id) => catalogo.splice(catalogo.findIndex((c) => c.id === id), 1)[0])
})

describe('listado con datos', () => {
  it('muestra la primera página con sus coches y el paginador', async () => {
    montarApp()
    expect(await screen.findByText('Seat Modelo 1')).toBeInTheDocument()
    expect(buscarCoches).toHaveBeenCalledWith({ pagina: 1, porPagina: 9 })
    expect(titulos()).toHaveLength(9)
    expect(titulos()[8]).toBe('Seat Modelo 9')
    expect(screen.getByText('Mostrando 1-9 de 25 coches')).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: /^Página \d$/ })).toHaveLength(3)
  })

  it('cada tarjeta muestra el precio, el año, el kilometraje y las etiquetas', async () => {
    catalogo = [crearCoche(1, { modelo: 'Ibiza', precio: 18500, km: 45000, anio: 2019, combustible: 'diesel', transmision: 'automatico' })]
    montarApp()
    const tarjeta = (await screen.findByText('Seat Ibiza')).closest('article')
    const texto = tarjeta.textContent.replace(/\u00a0/g, ' ')
    expect(texto).toContain('18.500 €')
    expect(texto).toContain('2019 · 45.000 km')
    expect(within(tarjeta).getByText('Diésel')).toBeInTheDocument()
    expect(within(tarjeta).getByText('Automático')).toBeInTheDocument()
    expect(within(tarjeta).getByRole('img')).toHaveAttribute('src', 'https://fotos.test/1.jpg')
  })

  it('un coche sin foto muestra un marcador', async () => {
    catalogo = [crearCoche(1, { foto_principal: null })]
    montarApp()
    expect(await screen.findByText('Sin foto')).toBeInTheDocument()
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })

  it('al pulsar una página pide esa página; la última puede tener menos coches', async () => {
    const { usuario } = montarApp()
    await screen.findByText('Seat Modelo 1')
    await usuario.click(screen.getByRole('button', { name: 'Página 3' }))
    expect(await screen.findByText('Seat Modelo 19')).toBeInTheDocument()
    expect(buscarCoches).toHaveBeenLastCalledWith({ pagina: 3, porPagina: 9 })
    expect(titulos()).toHaveLength(7)
    expect(screen.getByText('Mostrando 19-25 de 25 coches')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Página 3' })).toHaveAttribute('aria-current', 'page')
  })

  it('anterior y siguiente avanzan y retroceden, y se desactivan en los extremos', async () => {
    const { usuario } = montarApp()
    await screen.findByText('Seat Modelo 1')
    expect(screen.getByRole('button', { name: 'Página anterior' })).toBeDisabled()
    await usuario.click(screen.getByRole('button', { name: 'Página siguiente' }))
    expect(await screen.findByText('Seat Modelo 10')).toBeInTheDocument()
    await usuario.click(screen.getByRole('button', { name: 'Página anterior' }))
    expect(await screen.findByText('Seat Modelo 1')).toBeInTheDocument()
    await usuario.click(screen.getByRole('button', { name: 'Página 3' }))
    await screen.findByText('Seat Modelo 19')
    expect(screen.getByRole('button', { name: 'Página siguiente' })).toBeDisabled()
  })
})

describe('estados del listado', () => {
  it('mientras carga por primera vez muestra un indicador', async () => {
    let terminar
    buscarCoches.mockReturnValue(new Promise((resolver) => (terminar = resolver)))
    montarApp()
    expect(await screen.findByText('Cargando coches...')).toBeInTheDocument()
    terminar(respuestaDePagina(catalogo, { pagina: 1, porPagina: 9 }))
    expect(await screen.findByText('Seat Modelo 1')).toBeInTheDocument()
    expect(screen.queryByText('Cargando coches...')).not.toBeInTheDocument()
  })

  it('sin coches muestra un mensaje de lista vacía, que no es un error', async () => {
    catalogo = []
    montarApp()
    expect(await screen.findByText('No hay coches disponibles en este momento.')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('si falla la carga muestra el error con un botón para reintentar, y no el mensaje de lista vacía', async () => {
    buscarCoches.mockRejectedValueOnce(new Error('Failed to fetch'))
    montarApp()
    expect(await screen.findByRole('alert')).toHaveTextContent('No se pudo conectar con el servidor')
    expect(screen.queryByText('No hay coches disponibles en este momento.')).not.toBeInTheDocument()
  })

  it('al reintentar tras un error vuelve a pedir los datos y muestra la lista', async () => {
    buscarCoches.mockRejectedValueOnce(new Error('Failed to fetch'))
    const { usuario } = montarApp()
    await usuario.click(await screen.findByRole('button', { name: 'Reintentar' }))
    expect(await screen.findByText('Seat Modelo 1')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(buscarCoches).toHaveBeenCalledTimes(2)
  })

  it('un error ya escrito en español se muestra tal cual', async () => {
    buscarCoches.mockRejectedValueOnce(new Error('Buscar coches: error interno'))
    montarApp()
    expect(await screen.findByRole('alert')).toHaveTextContent('Buscar coches: error interno')
  })

  it('al cambiar de página, los coches anteriores siguen en pantalla marcados como ocupados', async () => {
    const { usuario } = montarApp()
    await screen.findByText('Seat Modelo 1')
    let terminar
    buscarCoches.mockReturnValueOnce(new Promise((resolver) => (terminar = resolver)))
    await usuario.click(screen.getByRole('button', { name: 'Página 2' }))
    expect(screen.getByText('Seat Modelo 1').closest('[aria-busy]')).toHaveAttribute('aria-busy', 'true')
    terminar(respuestaDePagina(catalogo, { pagina: 2, porPagina: 9 }))
    expect(await screen.findByText('Seat Modelo 10')).toBeInTheDocument()
  })
})

describe('quién ve el botón de eliminar', () => {
  it('un visitante no lo ve y se le invita a iniciar sesión como administrador', async () => {
    montarApp()
    await screen.findByText('Seat Modelo 1')
    expect(screen.queryByRole('button', { name: /^Eliminar/ })).not.toBeInTheDocument()
    expect(screen.getByText(/inicia sesión como administrador/)).toBeInTheDocument()
  })

  it('un usuario normal tampoco, y se le explica por qué', async () => {
    conSesion('cliente')
    montarApp()
    await screen.findByText('Seat Modelo 1')
    expect(screen.queryByRole('button', { name: /^Eliminar/ })).not.toBeInTheDocument()
    expect(screen.getByText(/no tiene permisos de administrador/)).toBeInTheDocument()
  })

  it('un administrador lo ve en cada tarjeta y no ve la nota', async () => {
    conSesion('admin')
    montarApp()
    await screen.findByText('Seat Modelo 1')
    expect(screen.getAllByRole('button', { name: /^Eliminar/ })).toHaveLength(9)
    expect(screen.queryByText(/inicia sesión como administrador/)).not.toBeInTheDocument()
    expect(screen.queryByText(/no tiene permisos de administrador/)).not.toBeInTheDocument()
  })
})

describe('eliminar un coche', () => {
  const pulsarEliminar = async (usuario, modelo) => usuario.click(screen.getByRole('button', { name: `Eliminar Seat ${modelo}` }))

  it('pide confirmación nombrando el coche, sin borrar todavía', async () => {
    conSesion('admin')
    const { usuario } = montarApp()
    await screen.findByText('Seat Modelo 1')
    await pulsarEliminar(usuario, 'Modelo 2')
    const dialogo = screen.getByRole('dialog', { name: 'Eliminar coche' })
    expect(dialogo).toHaveTextContent('Seat Modelo 2')
    expect(dialogo).toHaveTextContent('no se puede deshacer')
    expect(dialogo).toHaveTextContent('sus fotos')
    expect(eliminarCoche).not.toHaveBeenCalled()
  })

  it('el foco empieza en «Cancelar» (la opción segura)', async () => {
    conSesion('admin')
    const { usuario } = montarApp()
    await screen.findByText('Seat Modelo 1')
    await pulsarEliminar(usuario, 'Modelo 2')
    expect(within(screen.getByRole('dialog')).getByRole('button', { name: 'Cancelar' })).toHaveFocus()
  })

  it('«Cancelar», Escape y pulsar fuera del diálogo no eliminan nada', async () => {
    conSesion('admin')
    const { usuario } = montarApp()
    await screen.findByText('Seat Modelo 1')

    await pulsarEliminar(usuario, 'Modelo 2')
    await usuario.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Cancelar' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

    await pulsarEliminar(usuario, 'Modelo 2')
    await usuario.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

    await pulsarEliminar(usuario, 'Modelo 2')
    await usuario.click(document.querySelector('.fondo-dialogo'))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

    expect(eliminarCoche).not.toHaveBeenCalled()
    expect(titulos()).toHaveLength(9)
    expect(buscarCoches).toHaveBeenCalledTimes(1)
  })

  it('al confirmar lo elimina, avisa y el coche desaparece del listado con el total actualizado', async () => {
    conSesion('admin')
    const { usuario } = montarApp()
    await screen.findByText('Seat Modelo 1')
    await pulsarEliminar(usuario, 'Modelo 2')
    await usuario.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Eliminar' }))
    expect(eliminarCoche).toHaveBeenCalledWith(2)
    expect(await screen.findByRole('status')).toHaveTextContent('Coche eliminado')
    await waitFor(() => expect(screen.queryByText('Seat Modelo 2')).not.toBeInTheDocument())
    expect(screen.getByText('Seat Modelo 10')).toBeInTheDocument() // el siguiente sube a la página
    expect(screen.getByText('Mostrando 1-9 de 24 coches')).toBeInTheDocument()
    expect(buscarCoches).toHaveBeenCalledTimes(2)
  })

  it('el aviso se puede cerrar', async () => {
    conSesion('admin')
    const { usuario } = montarApp()
    await screen.findByText('Seat Modelo 1')
    await pulsarEliminar(usuario, 'Modelo 2')
    await usuario.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Eliminar' }))
    await usuario.click(await screen.findByRole('button', { name: 'Cerrar aviso' }))
    expect(screen.queryByText('Coche eliminado')).not.toBeInTheDocument()
  })

  it('mientras se elimina, todos los botones de eliminar están desactivados', async () => {
    conSesion('admin')
    let terminar
    eliminarCoche.mockReturnValue(new Promise((resolver) => (terminar = resolver)))
    const { usuario } = montarApp()
    await screen.findByText('Seat Modelo 1')
    await pulsarEliminar(usuario, 'Modelo 2')
    await usuario.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Eliminar' }))
    const botones = screen.getAllByRole('button', { name: /^Eliminar/ })
    expect(botones.every((b) => b.disabled)).toBe(true)
    expect(screen.getByText('Eliminando...')).toBeInTheDocument()
    terminar({ id: 2 })
    await waitFor(() => expect(screen.getAllByRole('button', { name: /^Eliminar/ }).every((b) => !b.disabled)).toBe(true))
  })

  it('si el servidor lo rechaza, lo explica y el coche sigue en el listado', async () => {
    conSesion('admin')
    eliminarCoche.mockRejectedValue(new Error('No autorizado'))
    const { usuario } = montarApp()
    await screen.findByText('Seat Modelo 1')
    await pulsarEliminar(usuario, 'Modelo 2')
    await usuario.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Eliminar' }))
    const alerta = await screen.findByRole('alert')
    expect(alerta).toHaveTextContent('No se pudo eliminar el coche')
    expect(alerta).toHaveTextContent('No tienes permiso para realizar esta acción')
    expect(screen.getByText('Seat Modelo 2')).toBeInTheDocument()
    expect(screen.queryByText('Coche eliminado')).not.toBeInTheDocument()
    expect(buscarCoches).toHaveBeenCalledTimes(1)
  })

  it('si no hay conexión, lo explica y se puede volver a intentar', async () => {
    conSesion('admin')
    eliminarCoche.mockRejectedValueOnce(new Error('Failed to fetch'))
    const { usuario } = montarApp()
    await screen.findByText('Seat Modelo 1')
    await pulsarEliminar(usuario, 'Modelo 2')
    await usuario.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Eliminar' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('No se pudo conectar con el servidor')
    await pulsarEliminar(usuario, 'Modelo 2')
    await usuario.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Eliminar' }))
    expect(await screen.findByRole('status')).toHaveTextContent('Coche eliminado')
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('si el coche ya no existe (lo borró otra persona), muestra el mensaje del servidor', async () => {
    conSesion('admin')
    eliminarCoche.mockRejectedValue(new Error('Coche no encontrado o sin permisos'))
    const { usuario } = montarApp()
    await screen.findByText('Seat Modelo 1')
    await pulsarEliminar(usuario, 'Modelo 2')
    await usuario.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Eliminar' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Coche no encontrado o sin permisos')
  })
})

describe('el listado tras eliminar', () => {
  it('si se elimina el único coche de la última página, pasa a la página anterior', async () => {
    conSesion('admin')
    catalogo = crearCatalogo(10) // 9 por página: la página 2 tiene un solo coche
    const { usuario } = montarApp()
    await screen.findByText('Seat Modelo 1')
    await usuario.click(screen.getByRole('button', { name: 'Página 2' }))
    await screen.findByText('Seat Modelo 10')
    await usuario.click(screen.getByRole('button', { name: 'Eliminar Seat Modelo 10' }))
    await usuario.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Eliminar' }))
    await waitFor(() => expect(screen.getByText('Mostrando 1-9 de 9 coches')).toBeInTheDocument())
    expect(titulos()).toHaveLength(9)
    expect(screen.getByRole('button', { name: 'Página 1' })).toHaveAttribute('aria-current', 'page')
  })

  it('si se eliminan todos los coches, aparece el mensaje de que no hay ninguno', async () => {
    conSesion('admin')
    catalogo = crearCatalogo(1)
    const { usuario } = montarApp()
    await screen.findByText('Seat Modelo 1')
    await usuario.click(screen.getByRole('button', { name: 'Eliminar Seat Modelo 1' }))
    await usuario.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Eliminar' }))
    expect(await screen.findByText('No hay coches disponibles en este momento.')).toBeInTheDocument()
  })

  it('si no es el último de su página, se queda en la misma página', async () => {
    conSesion('admin')
    catalogo = crearCatalogo(12)
    const { usuario } = montarApp()
    await screen.findByText('Seat Modelo 1')
    await usuario.click(screen.getByRole('button', { name: 'Página 2' }))
    await screen.findByText('Seat Modelo 10')
    await usuario.click(screen.getByRole('button', { name: 'Eliminar Seat Modelo 10' }))
    await usuario.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Eliminar' }))
    await waitFor(() => expect(screen.queryByText('Seat Modelo 10')).not.toBeInTheDocument())
    expect(titulos()).toEqual(['Seat Modelo 11', 'Seat Modelo 12'])
    expect(screen.getByRole('button', { name: 'Página 2' })).toHaveAttribute('aria-current', 'page')
  })
})

describe('recorrido completo', () => {
  it('un visitante entra como administrador, elimina un coche y cierra sesión: el botón de eliminar desaparece', async () => {
    const { login, logout } = await import('../src/servicios/services/authService.js')
    login.mockResolvedValue({ usuario: { id: 'u1', email: 'ana@ua.es' }, sesion: {} })
    logout.mockResolvedValue()
    obtenerPerfil.mockResolvedValue({ id: 'u1', nombre: 'Ana', rol: 'admin' })

    const { usuario } = montarApp()
    await screen.findByText('Seat Modelo 1')
    expect(screen.queryByRole('button', { name: /^Eliminar/ })).not.toBeInTheDocument()

    await usuario.click(screen.getByRole('button', { name: 'Iniciar sesión' }))
    await usuario.type(screen.getByLabelText('Email'), 'ana@ua.es')
    await usuario.type(screen.getByLabelText('Contraseña'), 'secreto123')
    await usuario.click(screen.getByRole('button', { name: 'Entrar' }))
    await screen.findByText('Ana')
    expect(screen.getAllByRole('button', { name: /^Eliminar/ })).toHaveLength(9)

    await usuario.click(screen.getByRole('button', { name: 'Eliminar Seat Modelo 3' }))
    await usuario.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Eliminar' }))
    await waitFor(() => expect(screen.queryByText('Seat Modelo 3')).not.toBeInTheDocument())

    await usuario.click(screen.getByRole('button', { name: 'Cerrar sesión' }))
    await screen.findByRole('button', { name: 'Iniciar sesión' })
    expect(screen.queryByRole('button', { name: /^Eliminar/ })).not.toBeInTheDocument()
    expect(screen.queryByText('Ana')).not.toBeInTheDocument()
  })
})
