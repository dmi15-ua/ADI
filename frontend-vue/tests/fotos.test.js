import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import App from '../src/App.vue'
import { crearEntornoUI, crearDetalleDePrueba, crearCocheDePrueba, respuestaDePagina } from './helpers.js'
import { buscarCoches, obtenerCoche } from '../src/servicios/services/cocheService.js'
import { anadirFoto, eliminarFoto } from '../src/servicios/services/fotoService.js'
import { obtenerSesion } from '../src/servicios/services/authService.js'
import { obtenerPerfil } from '../src/servicios/services/perfilService.js'

vi.mock('../src/servicios/services/authService.js', () => ({
  login: vi.fn(),
  logout: vi.fn(),
  obtenerSesion: vi.fn(),
  registrar: vi.fn()
}))
vi.mock('../src/servicios/services/perfilService.js', () => ({ obtenerPerfil: vi.fn() }))
vi.mock('../src/servicios/services/cocheService.js', () => ({
  buscarCoches: vi.fn(),
  obtenerCoche: vi.fn(),
  crearCoche: vi.fn(),
  actualizarCoche: vi.fn(),
  eliminarCoche: vi.fn()
}))
vi.mock('../src/servicios/services/fotoService.js', () => ({ anadirFoto: vi.fn(), eliminarFoto: vi.fn() }))

let fotosDelCoche // lo que "hay en la base de datos"
let w

const conSesion = (rol) => {
  obtenerSesion.mockResolvedValue({ id: 'u1', email: 'a@b.com' })
  obtenerPerfil.mockResolvedValue({ id: 'u1', nombre: 'Ana', rol })
}
const foto = (id, extra = {}) => ({ id, coche_id: 5, url: `https://fotos.test/${id}.jpg`, orden: id, es_principal: false, ...extra })

beforeEach(() => {
  vi.clearAllMocks()
  obtenerSesion.mockResolvedValue(null)
  fotosDelCoche = [foto(1), foto(2, { es_principal: true }), foto(3)]
  buscarCoches.mockImplementation(async (f) => respuestaDePagina([crearCocheDePrueba(5)], f))
  obtenerCoche.mockImplementation(async (id) => crearDetalleDePrueba(Number(id), { modelo: 'Ibiza', foto_coche: fotosDelCoche.map((f) => ({ ...f })) }))
  anadirFoto.mockImplementation(async (cocheId, datos) => {
    const nueva = foto(10 + fotosDelCoche.length, { url: datos.url, es_principal: !!datos.es_principal })
    if (datos.es_principal) fotosDelCoche = fotosDelCoche.map((f) => ({ ...f, es_principal: false }))
    fotosDelCoche.push(nueva)
    return nueva
  })
  eliminarFoto.mockImplementation(async (id) => {
    fotosDelCoche = fotosDelCoche.filter((f) => f.id !== id)
    return { id }
  })
})
afterEach(() => {
  w?.unmount()
  document.body.innerHTML = ''
})

async function abrir(ruta = '/coches/5') {
  const { router, plugins } = crearEntornoUI(ruta)
  await router.isReady()
  w = mount(App, { global: { plugins }, attachTo: document.body })
  await flushPromises()
  return router
}
const gestor = () => w.find('section[aria-labelledby="titulo-gestor-fotos"]')
const filas = () => gestor().findAll('li')
const miniaturas = () => w.findAll('.galeria .miniaturas button')
const dialogo = () => document.body.querySelector('.p-dialog')
const botonDelDialogo = (texto) => [...dialogo().querySelectorAll('button')].find((b) => b.textContent.includes(texto))
const escribirYAnadir = async (url) => {
  await gestor().find('#foto-url').setValue(url)
  await gestor().find('form').trigger('submit')
  await flushPromises()
}
const pulsarEliminar = async (n) => {
  await gestor().find(`button[aria-label="Eliminar la foto ${n}"]`).trigger('click')
  await flushPromises()
}
const responder = async (texto) => {
  botonDelDialogo(texto).click()
  await flushPromises()
}

describe('quién ve la gestión de fotos', () => {
  it('un administrador la ve, con las fotos del coche y la principal marcada', async () => {
    conSesion('admin')
    await abrir()
    expect(gestor().exists()).toBe(true)
    expect(filas()).toHaveLength(3)
    expect(filas()[1].text()).toContain('Principal')
    expect(filas()[0].text()).not.toContain('Principal')
  })

  it('un usuario normal y un visitante no la ven, pero sí la galería', async () => {
    conSesion('cliente')
    await abrir()
    expect(gestor().exists()).toBe(false)
    expect(miniaturas()).toHaveLength(3)
    w.unmount()
    obtenerSesion.mockResolvedValue(null)
    await abrir()
    expect(gestor().exists()).toBe(false)
    expect(miniaturas()).toHaveLength(3)
  })

  it('un coche sin fotos lo indica', async () => {
    conSesion('admin')
    fotosDelCoche = []
    await abrir()
    expect(gestor().text()).toContain('Este coche todavía no tiene fotos.')
  })
})

describe('añadir una foto', () => {
  it('la añade, avisa, vacía el formulario y la galería la muestra sin recargar la página', async () => {
    conSesion('admin')
    await abrir()
    await escribirYAnadir('https://fotos.test/nueva.jpg')
    expect(anadirFoto).toHaveBeenCalledWith(5, { url: 'https://fotos.test/nueva.jpg' })
    expect(document.body.textContent).toContain('Foto añadida')
    expect(filas()).toHaveLength(4)
    expect(miniaturas()).toHaveLength(4)
    expect(gestor().find('#foto-url').element.value).toBe('')
    expect(obtenerCoche).toHaveBeenCalledTimes(2) // la carga inicial y el refresco
  })

  it('como principal, la anterior principal deja de serlo', async () => {
    conSesion('admin')
    await abrir()
    await gestor().find('#foto-url').setValue('https://fotos.test/nueva.jpg')
    gestor().findComponent('[data-campo="es_principal"]').vm.$emit('update:modelValue', true)
    await flushPromises()
    await gestor().find('form').trigger('submit')
    await flushPromises()
    expect(anadirFoto).toHaveBeenCalledWith(5, { url: 'https://fotos.test/nueva.jpg', es_principal: true })
    const principales = filas().filter((f) => f.text().includes('Principal'))
    expect(principales).toHaveLength(1)
    expect(principales[0].text()).toContain('nueva.jpg')
  })

  it('una dirección no válida no llega al servidor', async () => {
    conSesion('admin')
    await abrir()
    await escribirYAnadir('esto no es una url')
    expect(gestor().find('#error-foto-url').text()).toContain('URL no válida')
    expect(anadirFoto).not.toHaveBeenCalled()
  })

  it('el refresco de la ficha no la vacía ni muestra el indicador de carga', async () => {
    conSesion('admin')
    await abrir()
    let terminar
    obtenerCoche.mockReturnValueOnce(new Promise((resolver) => (terminar = resolver)))
    await gestor().find('#foto-url').setValue('https://fotos.test/nueva.jpg')
    await gestor().find('form').trigger('submit')
    await flushPromises()
    expect(w.find('main h2').text()).toBe('Seat Ibiza')
    expect(w.find('main .estado-cargando').exists()).toBe(false)
    expect(filas()).toHaveLength(3) // todavía las de antes
    terminar(crearDetalleDePrueba(5, { modelo: 'Ibiza', foto_coche: fotosDelCoche }))
    await flushPromises()
    expect(filas()).toHaveLength(4)
  })

  it('mientras se añade, los botones están desactivados', async () => {
    conSesion('admin')
    let terminar
    anadirFoto.mockReturnValue(new Promise((resolver) => (terminar = resolver)))
    await abrir()
    await escribirYAnadir('https://fotos.test/nueva.jpg')
    expect(gestor().find('button[type="submit"]').attributes('disabled')).toBeDefined()
    expect(gestor().find('button[aria-label="Eliminar la foto 1"]').attributes('disabled')).toBeDefined()
    terminar({ id: 99 })
    await flushPromises()
  })

  it('si el servidor lo rechaza, lo explica y conserva la dirección escrita', async () => {
    conSesion('admin')
    anadirFoto.mockRejectedValue(new Error('No autorizado'))
    await abrir()
    await escribirYAnadir('https://fotos.test/nueva.jpg')
    expect(gestor().find('[role="alert"]').text()).toContain('No tienes permiso para realizar esta acción')
    expect(gestor().find('#foto-url').element.value).toBe('https://fotos.test/nueva.jpg')
    expect(filas()).toHaveLength(3)
    expect(obtenerCoche).toHaveBeenCalledTimes(1)
  })

  it('tras un error se puede volver a intentar y el error desaparece', async () => {
    conSesion('admin')
    anadirFoto.mockRejectedValueOnce(new Error('Failed to fetch'))
    await abrir()
    await escribirYAnadir('https://fotos.test/nueva.jpg')
    expect(gestor().find('[role="alert"]').text()).toContain('No se pudo conectar con el servidor')
    await gestor().find('form').trigger('submit')
    await flushPromises()
    expect(gestor().find('[role="alert"]').exists()).toBe(false)
    expect(filas()).toHaveLength(4)
  })

  it('si la foto se guarda pero falla el refresco, lo avisa sin decir que falló el cambio', async () => {
    conSesion('admin')
    await abrir()
    obtenerCoche.mockRejectedValueOnce(new Error('Failed to fetch'))
    await escribirYAnadir('https://fotos.test/nueva.jpg')
    expect(document.body.textContent).toContain('Foto añadida')
    expect(document.body.textContent).toContain('Cambio guardado')
    expect(document.body.textContent).toContain('Recarga la página')
    expect(gestor().find('[role="alert"]').exists()).toBe(false)
  })
})

describe('eliminar una foto', () => {
  it('pide confirmación; si se cancela no se elimina nada', async () => {
    conSesion('admin')
    await abrir()
    await pulsarEliminar(1)
    expect(dialogo().textContent).toContain('Eliminar foto')
    expect(dialogo().textContent).toContain('no se puede deshacer')
    expect(dialogo().textContent).not.toContain('foto principal')
    await responder('Cancelar')
    expect(eliminarFoto).not.toHaveBeenCalled()
    expect(filas()).toHaveLength(3)
  })

  it('al confirmar la elimina, avisa y desaparece de la ficha sin recargar', async () => {
    conSesion('admin')
    await abrir()
    await pulsarEliminar(1)
    await responder('Eliminar')
    expect(eliminarFoto).toHaveBeenCalledWith(1)
    expect(document.body.textContent).toContain('Foto eliminada')
    expect(filas()).toHaveLength(2)
    expect(miniaturas()).toHaveLength(2)
  })

  it('si es la principal, el aviso lo dice, y la ficha pasa a mostrar la primera que quede', async () => {
    conSesion('admin')
    await abrir()
    await pulsarEliminar(2)
    expect(dialogo().textContent).toContain('Es la foto principal')
    await responder('Eliminar')
    expect(eliminarFoto).toHaveBeenCalledWith(2)
    expect(filas().some((f) => f.text().includes('Principal'))).toBe(false)
    expect(w.find('img.grande').attributes('src')).toBe('https://fotos.test/1.jpg')
  })

  it('mientras se elimina, los botones están desactivados', async () => {
    conSesion('admin')
    let terminar
    eliminarFoto.mockReturnValue(new Promise((resolver) => (terminar = resolver)))
    await abrir()
    await pulsarEliminar(1)
    await responder('Eliminar')
    expect(gestor().findAll('li button').every((b) => b.attributes('disabled') !== undefined)).toBe(true)
    expect(gestor().find('button[type="submit"]').attributes('disabled')).toBeDefined()
    terminar({ id: 1 })
    await flushPromises()
    expect(gestor().findAll('li button').every((b) => b.attributes('disabled') === undefined)).toBe(true)
  })

  it('si falla, lo explica y la foto sigue en la ficha', async () => {
    conSesion('admin')
    eliminarFoto.mockRejectedValue(new Error('No autorizado'))
    await abrir()
    await pulsarEliminar(1)
    await responder('Eliminar')
    expect(document.body.textContent).toContain('No se pudo eliminar la foto')
    expect(document.body.textContent).toContain('No tienes permiso para realizar esta acción')
    expect(document.body.textContent).not.toContain('Foto eliminada')
    expect(filas()).toHaveLength(3)
    expect(obtenerCoche).toHaveBeenCalledTimes(1)
  })

  it('si la foto ya no existe (la borró otra persona), muestra el mensaje del servidor', async () => {
    conSesion('admin')
    eliminarFoto.mockRejectedValue(new Error('Foto no encontrada o sin permisos'))
    await abrir()
    await pulsarEliminar(1)
    await responder('Eliminar')
    expect(document.body.textContent).toContain('Foto no encontrada o sin permisos')
  })
})

describe('el resto de la ficha', () => {
  it('los botones de editar y eliminar el coche siguen funcionando junto a la gestión de fotos', async () => {
    conSesion('admin')
    await abrir()
    const botones = w.findAll('main .barra button').map((b) => b.text())
    expect(botones).toEqual(expect.arrayContaining(['Editar', 'Eliminar']))
  })
})
