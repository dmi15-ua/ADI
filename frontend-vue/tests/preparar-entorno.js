// jsdom no implementa matchMedia, que PrimeVue usa en el menú. Se simula para los tests.
if (!window.matchMedia) {
  window.matchMedia = (consulta) => ({
    matches: false,
    media: consulta,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false
  })
}

// jsdom tampoco implementa ResizeObserver, que PrimeVue usa en algunos campos (Textarea, listas desplegables...)
if (!window.ResizeObserver) {
  window.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
}

// El listado pide las marcas para su filtro. Por defecto, en los tests no hay ninguna y no se toca la red;
// los tests que necesitan marcas concretas declaran su propio mock.
import { vi } from 'vitest'
vi.mock('../src/servicios/services/marcaService.js', () => ({ listarMarcas: vi.fn(async () => []) }))
