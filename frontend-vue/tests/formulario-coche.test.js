import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import PrimeVue from 'primevue/config'
import Select from 'primevue/select'
import FormularioCoche from '../src/components/FormularioCoche.vue'
import { localeEs } from '../src/locale.js'
import { campoFormulario, ponerCampo, rellenarFormularioCoche, valoresValidosDeCoche } from './helpers.js'

const marcas = [
  { id: 1, nombre: 'Seat' },
  { id: 2, nombre: 'Renault' }
]
const montar = (props = {}) =>
  mount(FormularioCoche, { props: { marcas, textoGuardar: 'Crear coche', ...props }, global: { plugins: [[PrimeVue, { locale: localeEs }]] } })
const enviar = (w) => w.find('form').trigger('submit')
const error = (w, campo) => w.find(`#error-${campo}`)
const botonGuardar = (w) => w.find('button[type="submit"]')
const anioMaximo = new Date().getFullYear() + 1

describe('campos del formulario', () => {
  it('muestra todos los campos con su etiqueta', () => {
    const w = montar()
    const etiquetas = w.findAll('label').map((l) => l.text())
    for (const texto of ['Marca', 'Modelo', 'Precio', 'Kilometraje', 'Año', 'Potencia (CV)', 'Combustible', 'Transmisión', 'Descripción (opcional)', 'Equipamiento (opcional)', 'Disponible para la venta']) {
      expect(etiquetas).toContain(texto)
    }
  })

  it('la lista de marcas son las que se le pasan', () => {
    const w = montar()
    expect(campoFormulario(w, 'marca_id').props('options')).toEqual(marcas)
  })

  it('las opciones de combustible y transmisión son las que admite el backend', () => {
    const w = montar()
    expect(campoFormulario(w, 'combustible').props('options').map((o) => o.valor)).toEqual(['gasolina', 'diesel', 'electrico'])
    expect(campoFormulario(w, 'transmision').props('options').map((o) => o.valor)).toEqual(['manual', 'automatico'])
  })

  it('por defecto el coche está disponible', async () => {
    const w = montar()
    await rellenarFormularioCoche(w)
    await enviar(w)
    expect(w.emitted('guardar')[0][0].disponible).toBe(true)
  })

  it('cuenta los caracteres de la descripción', async () => {
    const w = montar()
    await w.find('#descripcion').setValue('Muy cuidado')
    expect(w.text()).toContain('11 / 2000')
  })
})

describe('validación', () => {
  it('con el formulario vacío muestra un error en cada campo obligatorio y no guarda', async () => {
    const w = montar()
    await enviar(w)
    expect(error(w, 'marca_id').text()).toBe('Selecciona una marca')
    expect(error(w, 'modelo').text()).toBe('El modelo es obligatorio')
    expect(error(w, 'precio').text()).toBe('El precio debe ser un número')
    expect(error(w, 'km').text()).toBe('El kilometraje debe ser un número')
    expect(error(w, 'anio').text()).toBe('El año debe ser un número')
    expect(error(w, 'potencia_cv').text()).toBe('La potencia debe ser un número')
    expect(error(w, 'combustible').text()).toBe('Selecciona el combustible')
    expect(error(w, 'transmision').text()).toBe('Selecciona la transmisión')
    expect(error(w, 'descripcion').exists()).toBe(false)
    expect(w.emitted('guardar')).toBeUndefined()
  })

  it.each([
    ['precio igual a cero', { precio: 0 }, 'precio', 'El precio debe ser mayor que 0'],
    ['kilometraje negativo', { km: -1 }, 'km', 'El kilometraje no puede ser negativo'],
    ['año anterior a 1950', { anio: 1800 }, 'anio', 'Año no válido'],
    ['año demasiado en el futuro', { anio: anioMaximo + 5 }, 'anio', 'Año no válido'],
    ['potencia igual a cero', { potencia_cv: 0 }, 'potencia_cv', 'La potencia debe ser mayor que 0'],
    ['modelo solo con espacios', { modelo: '   ' }, 'modelo', 'El modelo es obligatorio']
  ])('rechaza %s', async (_nombre, cambio, campo, mensaje) => {
    const w = montar()
    await rellenarFormularioCoche(w, cambio)
    await enviar(w)
    expect(error(w, campo).text()).toBe(mensaje)
    expect(w.emitted('guardar')).toBeUndefined()
  })

  it('solo muestra errores en los campos que fallan', async () => {
    const w = montar()
    await rellenarFormularioCoche(w, { precio: 0 })
    await enviar(w)
    expect(w.findAll('small.error')).toHaveLength(1)
  })

  it('los límites admitidos son los del backend (año entre 1950 y el año siguiente al actual)', async () => {
    const w = montar()
    await rellenarFormularioCoche(w, { anio: 1950 })
    await enviar(w)
    expect(w.emitted('guardar')).toHaveLength(1)
    await rellenarFormularioCoche(w, { anio: anioMaximo })
    await enviar(w)
    expect(w.emitted('guardar')).toHaveLength(2)
  })

  it('el error de un campo desaparece en cuanto se corrige, sin volver a enviar, y los demás se mantienen', async () => {
    const w = montar()
    await enviar(w)
    expect(error(w, 'precio').exists()).toBe(true)
    expect(error(w, 'modelo').exists()).toBe(true)
    ponerCampo(w, 'precio', 18500)
    await w.vm.$nextTick()
    expect(error(w, 'precio').exists()).toBe(false)
    expect(error(w, 'modelo').exists()).toBe(true)
    await w.find('#modelo').setValue('Ibiza')
    expect(error(w, 'modelo').exists()).toBe(false)
  })

  it('al corregir los datos y volver a enviar, desaparecen los errores', async () => {
    const w = montar()
    await rellenarFormularioCoche(w, { precio: 0 })
    await enviar(w)
    expect(error(w, 'precio').exists()).toBe(true)
    ponerCampo(w, 'precio', 18500)
    await enviar(w)
    expect(error(w, 'precio').exists()).toBe(false)
    expect(w.emitted('guardar')).toHaveLength(1)
  })
})

describe('datos que se envían', () => {
  it('con todos los campos correctos emite «guardar» con los datos limpios', async () => {
    const w = montar()
    await rellenarFormularioCoche(w, { descripcion: '  Único dueño  ', equipamiento: 'Aire acondicionado,  Bluetooth , ,GPS' })
    await enviar(w)
    expect(w.emitted('guardar')).toHaveLength(1)
    expect(w.emitted('guardar')[0][0]).toEqual({
      ...valoresValidosDeCoche,
      descripcion: 'Único dueño',
      equipamiento: ['Aire acondicionado', 'Bluetooth', 'GPS'],
      disponible: true
    })
  })

  it('los campos opcionales vacíos no se envían', async () => {
    const w = montar()
    await rellenarFormularioCoche(w)
    await enviar(w)
    const datos = w.emitted('guardar')[0][0]
    expect(datos.descripcion).toBeUndefined()
    expect(datos.equipamiento).toBeUndefined()
  })

  it('el modelo se envía sin espacios sobrantes', async () => {
    const w = montar()
    await rellenarFormularioCoche(w, { modelo: '  Golf GTI ' })
    await enviar(w)
    expect(w.emitted('guardar')[0][0].modelo).toBe('Golf GTI')
  })

  it('se puede marcar el coche como no disponible', async () => {
    const w = montar()
    await rellenarFormularioCoche(w)
    ponerCampo(w, 'disponible', false)
    await enviar(w)
    expect(w.emitted('guardar')[0][0].disponible).toBe(false)
  })
})

describe('estado del formulario', () => {
  it('mientras guarda, los botones están desactivados', () => {
    const w = montar({ guardando: true })
    expect(botonGuardar(w).attributes('disabled')).toBeDefined()
    expect(w.findAll('button').find((b) => b.text() === 'Cancelar').attributes('disabled')).toBeDefined()
  })

  it('muestra el error que devuelve el servidor', () => {
    const w = montar({ errorGeneral: 'No tienes permiso para realizar esta acción' })
    expect(w.find('[role="alert"]').text()).toContain('No tienes permiso para realizar esta acción')
  })

  it('el botón de cancelar emite «cancelar»', async () => {
    const w = montar()
    await w.findAll('button').find((b) => b.text() === 'Cancelar').trigger('click')
    expect(w.emitted('cancelar')).toHaveLength(1)
  })

  it('el texto del botón de guardar es el que se indica', () => {
    expect(botonGuardar(montar({ textoGuardar: 'Guardar cambios' })).text()).toBe('Guardar cambios')
  })
})

describe('marcas', () => {
  it('mientras se cargan, la lista desplegable lo indica', () => {
    const w = montar({ marcas: [], cargandoMarcas: true })
    expect(w.findComponent(Select).props('loading')).toBe(true)
  })

  it('si fallan, muestra el error con un botón para reintentar', async () => {
    const w = montar({ marcas: [], errorMarcas: 'No se pudo conectar con el servidor' })
    expect(w.text()).toContain('No se pudo conectar con el servidor')
    await w.findAll('button').find((b) => b.text() === 'Reintentar').trigger('click')
    expect(w.emitted('reintentar-marcas')).toHaveLength(1)
  })

  it('si no hay ninguna marca avisa de que hay que crearla antes', () => {
    const w = montar({ marcas: [] })
    expect(w.text()).toContain('No hay marcas dadas de alta')
  })

  it('con marcas no muestra ningún aviso', () => {
    const w = montar()
    expect(w.text()).not.toContain('No hay marcas')
  })
})

describe('datos iniciales (para editar)', () => {
  const valores = { ...valoresValidosDeCoche, descripcion: 'Muy cuidado', equipamiento: ['GPS', 'Bluetooth'], disponible: false }

  it('rellena los campos con los valores recibidos', async () => {
    const w = montar({ valores })
    expect(w.find('#modelo').element.value).toBe('Ibiza')
    expect(w.find('#descripcion').element.value).toBe('Muy cuidado')
    expect(w.find('#equipamiento').element.value).toBe('GPS, Bluetooth')
    expect(campoFormulario(w, 'precio').props('modelValue')).toBe(18500)
    expect(campoFormulario(w, 'marca_id').props('modelValue')).toBe(1)
  })

  it('se puede guardar sin tocar nada y emite los mismos datos', async () => {
    const w = montar({ valores })
    await enviar(w)
    expect(w.emitted('guardar')[0][0]).toEqual({ ...valoresValidosDeCoche, descripcion: 'Muy cuidado', equipamiento: ['GPS', 'Bluetooth'], disponible: false })
  })
})

describe('modo editar', () => {
  const valores = { ...valoresValidosDeCoche, descripcion: 'Muy cuidado', equipamiento: ['GPS'], disponible: true }

  it('al borrar la descripción y el equipamiento los envía vacíos, para poder quitarlos', async () => {
    const w = montar({ modo: 'editar', valores })
    await w.find('#descripcion').setValue('')
    await w.find('#equipamiento').setValue('')
    await enviar(w)
    const datos = w.emitted('guardar')[0][0]
    expect(datos.descripcion).toBe('')
    expect(datos.equipamiento).toEqual([])
  })

  it('al crear, en cambio, los opcionales vacíos no se envían', async () => {
    const w = montar({ modo: 'crear', valores: valoresValidosDeCoche })
    await enviar(w)
    const datos = w.emitted('guardar')[0][0]
    expect(datos.descripcion).toBeUndefined()
    expect(datos.equipamiento).toBeUndefined()
  })

  it('«cancelar» entrega los datos tal como están en ese momento', async () => {
    const w = montar({ modo: 'editar', valores })
    await w.find('#modelo').setValue('Leon')
    await w.findAll('button').find((b) => b.text() === 'Cancelar').trigger('click')
    expect(w.emitted('cancelar')[0][0].modelo).toBe('Leon')
  })
})
