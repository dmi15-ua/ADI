import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import PrimeVue from 'primevue/config'
import FiltrosCoches from '../src/components/FiltrosCoches.vue'
import { localeEs } from '../src/locale.js'
import { campoFormulario, ponerCampo } from './helpers.js'

const marcas = [
  { id: 1, nombre: 'Seat' },
  { id: 2, nombre: 'Renault' }
]
const montar = (props = {}) => mount(FiltrosCoches, { props: { marcas, ...props }, global: { plugins: [[PrimeVue, { locale: localeEs }]] } })
const enviar = (w) => w.find('form').trigger('submit')
const botonLimpiar = (w) => w.findAll('button').find((b) => b.text() === 'Limpiar')

describe('campos', () => {
  it('muestra todos los filtros con su etiqueta', () => {
    const w = montar()
    const etiquetas = w.findAll('label').map((l) => l.text())
    for (const texto of ['Modelo', 'Marca', 'Combustible', 'Transmisión', 'Precio mínimo', 'Precio máximo', 'Ordenar por']) expect(etiquetas).toContain(texto)
    expect(w.find('form').attributes('role')).toBe('search')
  })

  it('las marcas son las que se le pasan y el orden ofrece las cuatro opciones', () => {
    const w = montar()
    expect(campoFormulario(w, 'marca_id').props('options')).toEqual(marcas)
    expect(campoFormulario(w, 'orden').props('options').map((o) => o.valor)).toEqual(['recientes', 'precio_asc', 'precio_desc', 'km_asc'])
    expect(campoFormulario(w, 'orden').props('modelValue')).toBe('recientes')
  })

  it('se rellena con los filtros aplicados', () => {
    const w = montar({ filtros: { texto: 'ibiza', marca_id: 2, combustible: 'diesel', transmision: 'manual', precio_min: 5000, precio_max: 15000, orden: 'precio_asc' } })
    expect(w.find('#texto').element.value).toBe('ibiza')
    expect(campoFormulario(w, 'marca_id').props('modelValue')).toBe(2)
    expect(campoFormulario(w, 'combustible').props('modelValue')).toBe('diesel')
    expect(campoFormulario(w, 'transmision').props('modelValue')).toBe('manual')
    expect(campoFormulario(w, 'precio_min').props('modelValue')).toBe(5000)
    expect(campoFormulario(w, 'precio_max').props('modelValue')).toBe(15000)
    expect(campoFormulario(w, 'orden').props('modelValue')).toBe('precio_asc')
  })

  it('cuando cambian los filtros aplicados (atrás/adelante del navegador) se vuelve a rellenar', async () => {
    const w = montar({ filtros: { texto: 'ibiza' } })
    await w.setProps({ filtros: { texto: 'clio', combustible: 'electrico' } })
    expect(w.find('#texto').element.value).toBe('clio')
    expect(campoFormulario(w, 'combustible').props('modelValue')).toBe('electrico')
    await w.setProps({ filtros: {} })
    expect(w.find('#texto').element.value).toBe('')
    expect(campoFormulario(w, 'combustible').props('modelValue')).toBeNull()
  })
})

describe('buscar', () => {
  it('no busca mientras se escribe: solo al enviar', async () => {
    const w = montar()
    await w.find('#texto').setValue('ibiza')
    ponerCampo(w, 'combustible', 'diesel')
    await w.vm.$nextTick()
    expect(w.emitted('buscar')).toBeUndefined()
  })

  it('sin nada escrito emite un objeto vacío', async () => {
    const w = montar()
    await enviar(w)
    expect(w.emitted('buscar')[0][0]).toEqual({})
  })

  it('emite solo los filtros con valor, con el texto recortado', async () => {
    const w = montar()
    await w.find('#texto').setValue('  ibiza  ')
    ponerCampo(w, 'marca_id', 1)
    ponerCampo(w, 'precio_max', 12000)
    await w.vm.$nextTick()
    await enviar(w)
    expect(w.emitted('buscar')[0][0]).toEqual({ texto: 'ibiza', marca_id: 1, precio_max: 12000 })
  })

  it('el orden por defecto no se emite, y otro sí', async () => {
    const w = montar()
    ponerCampo(w, 'orden', 'precio_desc')
    await w.vm.$nextTick()
    await enviar(w)
    expect(w.emitted('buscar')[0][0]).toEqual({ orden: 'precio_desc' })
    ponerCampo(w, 'orden', 'recientes')
    await w.vm.$nextTick()
    await enviar(w)
    expect(w.emitted('buscar')[1][0]).toEqual({})
  })

  it('un precio mínimo mayor que el máximo se avisa y no se busca; al corregirlo desaparece el aviso', async () => {
    const w = montar()
    ponerCampo(w, 'precio_min', 20000)
    ponerCampo(w, 'precio_max', 10000)
    await w.vm.$nextTick()
    await enviar(w)
    expect(w.find('#error-precios').text()).toBe('El precio mínimo no puede ser mayor que el máximo')
    expect(w.emitted('buscar')).toBeUndefined()
    ponerCampo(w, 'precio_max', 25000)
    await w.vm.$nextTick()
    expect(w.find('#error-precios').exists()).toBe(false)
    await enviar(w)
    expect(w.emitted('buscar')[0][0]).toEqual({ precio_min: 20000, precio_max: 25000 })
  })

  it('mínimo y máximo iguales es un intervalo válido', async () => {
    const w = montar()
    ponerCampo(w, 'precio_min', 10000)
    ponerCampo(w, 'precio_max', 10000)
    await w.vm.$nextTick()
    await enviar(w)
    expect(w.emitted('buscar')[0][0]).toEqual({ precio_min: 10000, precio_max: 10000 })
  })

  it('el precio 0 cuenta como filtro', async () => {
    const w = montar()
    ponerCampo(w, 'precio_min', 0)
    await w.vm.$nextTick()
    await enviar(w)
    expect(w.emitted('buscar')[0][0]).toEqual({ precio_min: 0 })
  })
})

describe('limpiar', () => {
  it('está desactivado si no hay nada escrito ni aplicado', () => {
    const w = montar()
    expect(botonLimpiar(w).attributes('disabled')).toBeDefined()
  })

  it('se activa al escribir algo, y vacía los campos y busca sin filtros', async () => {
    const w = montar()
    await w.find('#texto').setValue('ibiza')
    ponerCampo(w, 'combustible', 'diesel')
    await w.vm.$nextTick()
    expect(botonLimpiar(w).attributes('disabled')).toBeUndefined()
    await botonLimpiar(w).trigger('click')
    expect(w.find('#texto').element.value).toBe('')
    expect(campoFormulario(w, 'combustible').props('modelValue')).toBeNull()
    expect(w.emitted('buscar')[0][0]).toEqual({})
  })

  it('está activo si hay filtros aplicados aunque no se haya tocado nada', () => {
    const w = montar({ filtros: { marca_id: 1 } })
    expect(botonLimpiar(w).attributes('disabled')).toBeUndefined()
  })
})

describe('marcas', () => {
  it('mientras se cargan, la lista indica que está cargando', () => {
    const w = montar({ marcas: [], cargandoMarcas: true })
    expect(campoFormulario(w, 'marca_id').props('loading')).toBe(true)
  })

  it('si no se pueden cargar, la lista se desactiva y se puede reintentar; el resto de filtros siguen funcionando', async () => {
    const w = montar({ marcas: [], errorMarcas: 'No se pudieron cargar las marcas' })
    expect(campoFormulario(w, 'marca_id').props('disabled')).toBe(true)
    expect(campoFormulario(w, 'combustible').props('disabled')).toBeFalsy()
    await w.find('button.reintentar').trigger('click')
    expect(w.emitted('reintentar-marcas')).toHaveLength(1)
  })

  it('con las marcas disponibles no hay botón de reintentar', () => {
    expect(montar().find('button.reintentar').exists()).toBe(false)
  })
})
