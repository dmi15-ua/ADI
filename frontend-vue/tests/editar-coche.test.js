import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import App from '../src/App.vue'
import {
  crearEntornoUI,
  crearEntornoUIConHistorialReal,
  crearCocheDePrueba,
  crearDetalleDePrueba,
  respuestaDePagina,
  campoFormulario,
  ponerCampo
} from './helpers.js'
import { buscarCoches, obtenerCoche, actualizarCoche } from '../src/servicios/services/cocheService.js'
import { listarMarcas } from '../src/servicios/services/marcaService.js'
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
vi.mock('../src/servicios/services/marcaService.js', () => ({ listarMarcas: vi.fn() }))

const marcas = [
  { id: 1, nombre: 'Seat' },
  { id: 2, nombre: 'Renault' }
]
let catalogo
let w
let routerReal

const conSesion = (rol) => {
  obtenerSesion.mockResolvedValue({ id: 'u1', email: 'a@b.com' })
  obtenerPerfil.mockResolvedValue({ id: 'u1', nombre: 'Ana', rol })
}

beforeEach(() => {
  vi.clearAllMocks()
  obtenerSesion.mockResolvedValue(null)
  catalogo = Array.from({ length: 5 }, (_, i) => crearCocheDePrueba(i + 1))
  listarMarcas.mockResolvedValue(marcas)
  buscarCoches.mockImplementation(async (filtros) => respuestaDePagina(catalogo, filtros))
  obtenerCoche.mockImplementation(async (id) => crearDetalleDePrueba(Number(id), { modelo: 'Ibiza', precio: 18500 }))
  actualizarCoche.mockImplementation(async (id, cambios) => ({ id: Number(id), ...cambios }))
})
afterEach(() => {
  w?.unmount()
  routerReal?.options.history.destroy()
  routerReal = undefined
  document.body.innerHTML = ''
})

async function abrir(ruta = '/coches/5/editar') {
  const { router, plugins } = crearEntornoUI(ruta)
  await router.isReady()
  w = mount(App, { global: { plugins }, attachTo: document.body })
  await flushPromises()
  return router
}
async function abrirConHistorialReal(ruta) {
  const { router, plugins } = crearEntornoUIConHistorialReal(ruta)
  routerReal = router
  w = mount(App, { global: { plugins }, attachTo: document.body })
  await router.isReady()
  await flushPromises()
  return router
}
const enviar = async () => {
  await w.find('form').trigger('submit')
  await flushPromises()
}
const boton = (texto, ambito = 'main') => w.findAll(`${ambito} button`).find((b) => b.text().includes(texto))
// Un usuario tarda en pulsar el botón: se espera a que el formulario procese el cambio antes de enviarlo
const poner = async (campo, valor) => {
  ponerCampo(w, campo, valor)
  await flushPromises()
}
const botonDelDocumento = (texto) => [...document.body.querySelectorAll('button')].find((b) => b.textContent.includes(texto))

describe('acceso a la pantalla', () => {
  it('un administrador ve el formulario con los datos actuales del coche', async () => {
    conSesion('admin')
    await abrir()
    expect(obtenerCoche).toHaveBeenCalledWith('5')
    expect(w.find('main h2').text()).toBe('Editar Seat Ibiza')
    expect(w.find('#modelo').element.value).toBe('Ibiza')
    expect(w.find('#descripcion').element.value).toBe('Único dueño y revisiones al día')
    expect(w.find('#equipamiento').element.value).toBe('Aire acondicionado, Bluetooth')
    expect(campoFormulario(w, 'precio').props('modelValue')).toBe(18500)
    expect(campoFormulario(w, 'marca_id').props('modelValue')).toBe(1)
    expect(boton('Guardar cambios')).toBeTruthy()
  })

  it('un usuario normal no puede entrar', async () => {
    conSesion('cliente')
    const router = await abrir()
    expect(router.currentRoute.value.name).toBe('sin-permiso')
    expect(obtenerCoche).not.toHaveBeenCalled()
  })

  it('un visitante es llevado al login y, al entrar, vuelve a la edición', async () => {
    const router = await abrir()
    expect(router.currentRoute.value.name).toBe('login')
    expect(router.currentRoute.value.query.redirect).toBe('/coches/5/editar')
  })

  it('si el coche no existe lo dice y ofrece volver al listado', async () => {
    conSesion('admin')
    obtenerCoche.mockRejectedValue(new Error('Coche no encontrado'))
    await abrir('/coches/999/editar')
    expect(w.find('main').text()).toContain('Coche no encontrado')
    expect(w.find('main form').exists()).toBe(false)
    expect(w.find('main a[href="/"]').exists()).toBe(true)
  })

  it('mientras carga y si falla la carga, no hay formulario; se puede reintentar', async () => {
    conSesion('admin')
    obtenerCoche.mockRejectedValueOnce(new Error('Failed to fetch'))
    await abrir()
    expect(w.find('main form').exists()).toBe(false)
    expect(w.find('main').text()).toContain('No se pudo conectar con el servidor')
    await boton('Reintentar').trigger('click')
    await flushPromises()
    expect(w.find('main form').exists()).toBe(true)
    expect(w.find('#modelo').element.value).toBe('Ibiza')
  })
})

describe('guardar los cambios', () => {
  it('envía solo los campos modificados, avisa y lleva a la ficha', async () => {
    conSesion('admin')
    const router = await abrir()
    await poner('precio', 17000)
    await w.find('#modelo').setValue('Leon')
    await enviar()
    expect(actualizarCoche).toHaveBeenCalledTimes(1)
    expect(actualizarCoche).toHaveBeenCalledWith('5', { modelo: 'Leon', precio: 17000 })
    expect(router.currentRoute.value.name).toBe('coche-detalle')
    expect(router.currentRoute.value.params.id).toBe('5')
    expect(document.body.textContent).toContain('Coche actualizado')
  })

  it('se puede marcar el coche como no disponible', async () => {
    conSesion('admin')
    await abrir()
    await poner('disponible', false)
    await enviar()
    expect(actualizarCoche).toHaveBeenCalledWith('5', { disponible: false })
  })

  it('se puede borrar la descripción y el equipamiento', async () => {
    conSesion('admin')
    await abrir()
    await w.find('#descripcion').setValue('')
    await w.find('#equipamiento').setValue('')
    await enviar()
    expect(actualizarCoche).toHaveBeenCalledWith('5', { descripcion: '', equipamiento: [] })
  })

  it('si no se ha cambiado nada, avisa y no llama al servidor', async () => {
    conSesion('admin')
    const router = await abrir()
    await enviar()
    expect(actualizarCoche).not.toHaveBeenCalled()
    expect(document.body.textContent).toContain('No hay cambios que guardar')
    expect(router.currentRoute.value.name).toBe('coche-editar')
  })

  it('con datos no válidos muestra el error y no llama al servidor', async () => {
    conSesion('admin')
    await abrir()
    await poner('precio', 0)
    await enviar()
    expect(w.find('#error-precio').text()).toBe('El precio debe ser mayor que 0')
    expect(actualizarCoche).not.toHaveBeenCalled()
  })

  it('mientras guarda el botón está desactivado', async () => {
    conSesion('admin')
    let terminar
    actualizarCoche.mockReturnValue(new Promise((resolver) => (terminar = resolver)))
    await abrir()
    await poner('precio', 17000)
    await enviar()
    expect(boton('Guardar cambios').attributes('disabled')).toBeDefined()
    terminar({ id: 5 })
    await flushPromises()
  })

  it('la ficha y el listado muestran el cambio sin recargar la página', async () => {
    conSesion('admin')
    actualizarCoche.mockImplementation(async (id, cambios) => {
      Object.assign(catalogo[4], cambios)
      obtenerCoche.mockImplementation(async (n) => crearDetalleDePrueba(Number(n), { modelo: 'Leon', precio: 18500 }))
      return { id: Number(id), ...cambios }
    })
    const router = await abrir()
    await w.find('#modelo').setValue('Leon')
    await enviar()
    expect(w.find('main').text()).toContain('Leon')
    await router.push('/')
    await flushPromises()
    expect(w.find('main').text()).toContain('Seat Leon')
  })
})

describe('errores del servidor', () => {
  it('si no tiene permiso lo explica y conserva lo escrito', async () => {
    conSesion('admin')
    actualizarCoche.mockRejectedValue(new Error('No autorizado'))
    const router = await abrir()
    await w.find('#modelo').setValue('Leon')
    await enviar()
    expect(w.find('main [role="alert"]').text()).toContain('No tienes permiso para realizar esta acción')
    expect(router.currentRoute.value.name).toBe('coche-editar')
    expect(w.find('#modelo').element.value).toBe('Leon')
    expect(boton('Guardar cambios').attributes('disabled')).toBeUndefined()
  })

  it('si no hay conexión lo explica y se puede reintentar', async () => {
    conSesion('admin')
    actualizarCoche.mockRejectedValueOnce(new Error('Failed to fetch'))
    const router = await abrir()
    await w.find('#modelo').setValue('Leon')
    await enviar()
    expect(w.find('main [role="alert"]').text()).toContain('No se pudo conectar con el servidor')
    await enviar()
    expect(actualizarCoche).toHaveBeenCalledTimes(2)
    expect(router.currentRoute.value.name).toBe('coche-detalle')
  })

  it('si el coche ya no existe al guardar, el error del servidor se muestra tal cual', async () => {
    conSesion('admin')
    actualizarCoche.mockRejectedValue(new Error('Coche no encontrado o sin permisos'))
    await abrir()
    await w.find('#modelo').setValue('Leon')
    await enviar()
    expect(w.find('main [role="alert"]').text()).toContain('Coche no encontrado o sin permisos')
  })
})

describe('cancelar', () => {
  it('sin cambios, cancelar vuelve directamente sin preguntar (si se entró directamente, a la ficha)', async () => {
    conSesion('admin')
    const router = await abrir()
    await boton('Cancelar').trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.name).toBe('coche-detalle')
    expect(router.currentRoute.value.params.id).toBe('5')
    expect(document.body.textContent).not.toContain('Cambios sin guardar')
  })

  it('con cambios pide confirmación; si se sigue editando, se conserva lo escrito', async () => {
    conSesion('admin')
    const router = await abrir()
    await w.find('#modelo').setValue('Leon')
    await boton('Cancelar').trigger('click')
    await flushPromises()
    expect(document.body.textContent).toContain('Cambios sin guardar')
    botonDelDocumento('Seguir editando').click()
    await flushPromises()
    expect(router.currentRoute.value.name).toBe('coche-editar')
    expect(w.find('#modelo').element.value).toBe('Leon')
    expect(actualizarCoche).not.toHaveBeenCalled()
  })

  it('con cambios y confirmando el descarte, vuelve sin guardar nada', async () => {
    conSesion('admin')
    const router = await abrir()
    await w.find('#modelo').setValue('Leon')
    await boton('Cancelar').trigger('click')
    await flushPromises()
    botonDelDocumento('Descartar cambios').click()
    await flushPromises()
    expect(router.currentRoute.value.name).toBe('coche-detalle')
    expect(actualizarCoche).not.toHaveBeenCalled()
  })

  it('si solo se ha escrito y borrado lo mismo, no cuenta como cambio', async () => {
    conSesion('admin')
    const router = await abrir()
    await w.find('#modelo').setValue('Leon')
    await w.find('#modelo').setValue('Ibiza')
    await boton('Cancelar').trigger('click')
    await flushPromises()
    expect(document.body.textContent).not.toContain('Cambios sin guardar')
    expect(router.currentRoute.value.name).toBe('coche-detalle')
  })

  it('desde el listado, cancelar vuelve al listado en la misma página', async () => {
    conSesion('admin')
    const router = await abrirConHistorialReal('/?pagina=1')
    await w.findAll('main article button').find((b) => b.text().includes('Editar')).trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.name).toBe('coche-editar')
    await boton('Cancelar').trigger('click')
    await new Promise((resolver) => setTimeout(resolver, 30))
    await flushPromises()
    expect(router.currentRoute.value.name).toBe('listado')
  })

  it('desde la ficha, cancelar vuelve a la ficha', async () => {
    conSesion('admin')
    const router = await abrirConHistorialReal('/coches/5')
    await boton('Editar').trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.name).toBe('coche-editar')
    await boton('Cancelar').trigger('click')
    await new Promise((resolver) => setTimeout(resolver, 30))
    await flushPromises()
    expect(router.currentRoute.value.name).toBe('coche-detalle')
  })
})

describe('botones «Editar»', () => {
  it('en la ficha, un administrador lo ve y lleva a la edición', async () => {
    conSesion('admin')
    const router = await abrir('/coches/5')
    await boton('Editar').trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.name).toBe('coche-editar')
    expect(router.currentRoute.value.params.id).toBe('5')
  })

  it('en la ficha, un usuario normal o un visitante no lo ven', async () => {
    conSesion('cliente')
    await abrir('/coches/5')
    expect(boton('Editar')).toBeUndefined()
    w.unmount()
    obtenerSesion.mockResolvedValue(null)
    await abrir('/coches/5')
    expect(boton('Editar')).toBeUndefined()
  })

  it('en el listado, un administrador lo ve en cada tarjeta', async () => {
    conSesion('admin')
    const router = await abrir('/')
    const botones = w.findAll('main article button').filter((b) => b.text().includes('Editar'))
    expect(botones).toHaveLength(5)
    await botones[2].trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.name).toBe('coche-editar')
    expect(router.currentRoute.value.params.id).toBe('3')
  })

  it('en el listado, un usuario normal no lo ve', async () => {
    conSesion('cliente')
    await abrir('/')
    expect(w.findAll('main article button').some((b) => b.text().includes('Editar'))).toBe(false)
  })
})
