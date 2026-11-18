import { vi } from 'vitest'

// Cliente de Supabase falso: guarda las llamadas encadenadas y responde con lo que se le indique.
// Sirve para comprobar la capa de servicios sin red ni base de datos.
export function crearClienteFalso(respuestas = {}) {
  const llamadas = []
  const constructor = (tabla) => {
    const registro = { tabla, pasos: [] }
    llamadas.push(registro)
    const respuesta = () => respuestas[tabla] ?? { data: null, error: null }
    const consulta = new Proxy(
      {},
      {
        get(_, metodo) {
          if (metodo === 'then') {
            return (resolver, rechazar) => Promise.resolve(respuesta()).then(resolver, rechazar)
          }
          return (...args) => {
            registro.pasos.push([metodo, ...args])
            return metodo === 'single' || metodo === 'maybeSingle'
              ? Promise.resolve(respuesta())
              : consulta
          }
        }
      }
    )
    return consulta
  }
  return {
    llamadas,
    from: vi.fn(constructor),
    auth: {
      getUser: vi.fn(async () => ({ data: { user: { id: 'u1' } }, error: null })),
      getSession: vi.fn(async () => ({ data: { session: null }, error: null })),
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(async () => ({ error: null }))
    }
  }
}

// ---- Utilidades para probar la interfaz (a partir de la iteración 10) ----
import { createMemoryHistory, createWebHistory } from 'vue-router'
import PrimeVue from 'primevue/config'
import ToastService from 'primevue/toastservice'
import ConfirmationService from 'primevue/confirmationservice'
import { createPinia } from 'pinia'
import { localeEs } from '../src/locale.js'
import { crearRouter } from '../src/router/index.js'

// Plugins que necesita la aplicación (router en memoria, Pinia y PrimeVue). Devuelve también el router.
export function crearEntornoUI(rutaInicial = '/') {
  const pinia = createPinia()
  const router = crearRouter(createMemoryHistory(), pinia)
  router.push(rutaInicial)
  const plugins = [pinia, router, [PrimeVue, { locale: localeEs }], ToastService, ConfirmationService]
  return { router, plugins, pinia }
}

// ---- Datos de prueba de coches (iteración 12) ----
export function crearCocheDePrueba(id, extra = {}) {
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

// Simula la respuesta de buscarCoches sobre una lista completa de coches (misma forma que la del servicio)
export function respuestaDePagina(todos, { pagina = 1, porPagina = 10 } = {}) {
  const desde = (pagina - 1) * porPagina
  return {
    datos: todos.slice(desde, desde + porPagina),
    pagina,
    porPagina,
    total: todos.length,
    totalPaginas: Math.ceil(todos.length / porPagina)
  }
}

// Coche tal como lo devuelve obtenerCoche: con su marca completa y sus fotos
export function crearDetalleDePrueba(id, extra = {}) {
  const { foto_principal, ...coche } = crearCocheDePrueba(id)
  return {
    ...coche,
    descripcion: 'Único dueño y revisiones al día',
    equipamiento: ['Aire acondicionado', 'Bluetooth'],
    marca: { id: 1, nombre: 'Seat', pais: 'España' },
    foto_coche: [
      { id: id * 10 + 1, coche_id: id, url: `https://fotos.test/${id}-a.jpg`, orden: 0, es_principal: false },
      { id: id * 10 + 2, coche_id: id, url: `https://fotos.test/${id}-b.jpg`, orden: 1, es_principal: true },
      { id: id * 10 + 3, coche_id: id, url: `https://fotos.test/${id}-c.jpg`, orden: 2, es_principal: false }
    ],
    ...extra
  }
}

// Como crearEntornoUI, pero con el historial real del navegador (jsdom). El historial en memoria no guarda la página anterior
// (history.state.back), que se usa para volver al listado en la misma página; por eso se prueba con el real.
export function crearEntornoUIConHistorialReal(ruta = '/') {
  window.history.replaceState({}, '', ruta)
  const pinia = createPinia()
  const router = crearRouter(createWebHistory(), pinia)
  const plugins = [pinia, router, [PrimeVue, { locale: localeEs }], ToastService, ConfirmationService]
  return { router, plugins, pinia }
}

// ---- Formulario de coche (iteración 14) ----
// Los campos con listas desplegables y números de PrimeVue se rellenan emitiendo su valor, como haría el componente al elegir
export const campoFormulario = (w, nombre) => w.findComponent(`[data-campo="${nombre}"]`)
export const ponerCampo = (w, nombre, valor) => campoFormulario(w, nombre).vm.$emit('update:modelValue', valor)

export const valoresValidosDeCoche = {
  marca_id: 1,
  modelo: 'Ibiza',
  precio: 18500,
  km: 45000,
  anio: 2019,
  combustible: 'diesel',
  transmision: 'manual',
  potencia_cv: 110
}

export async function rellenarFormularioCoche(w, valores = {}) {
  const { modelo, descripcion, equipamiento, ...numericosYListas } = { ...valoresValidosDeCoche, ...valores }
  await w.find('#modelo').setValue(modelo)
  for (const [nombre, valor] of Object.entries(numericosYListas)) ponerCampo(w, nombre, valor)
  if (descripcion !== undefined) await w.find('#descripcion').setValue(descripcion)
  if (equipamiento !== undefined) await w.find('#equipamiento').setValue(equipamiento)
}
