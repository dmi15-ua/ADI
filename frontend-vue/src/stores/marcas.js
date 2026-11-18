import { defineStore } from 'pinia'
import { ref } from 'vue'
import { listarMarcas } from '../servicios/services/marcaService.js'
import { mensajeDeError } from '../utils/errores.js'

// Marcas de coches. Las usan varias pantallas (formulario de coche, y más adelante los filtros),
// así que se piden una sola vez y se comparten.
export const useMarcasStore = defineStore('marcas', () => {
  const marcas = ref([])
  const cargando = ref(false)
  const error = ref('')
  const cargadas = ref(false)

  let enCurso = null
  function cargar({ forzar = false } = {}) {
    if (cargadas.value && !forzar) return Promise.resolve()
    enCurso ??= (async () => {
      cargando.value = true
      error.value = ''
      try {
        marcas.value = await listarMarcas()
        cargadas.value = true
      } catch (fallo) {
        error.value = mensajeDeError(fallo, 'No se pudieron cargar las marcas')
      } finally {
        cargando.value = false
        enCurso = null
      }
    })()
    return enCurso
  }

  return { marcas, cargando, error, cargadas, cargar }
})
