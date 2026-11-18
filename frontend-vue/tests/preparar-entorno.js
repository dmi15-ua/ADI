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
