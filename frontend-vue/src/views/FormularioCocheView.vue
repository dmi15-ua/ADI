<script setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import FormularioCoche from '../components/FormularioCoche.vue'
import { useCochesStore } from '../stores/coches.js'
import { useMarcasStore } from '../stores/marcas.js'
import { useNotificaciones } from '../composables/useNotificaciones.js'
import { useVolverAlListado } from '../composables/useVolverAlListado.js'
import { mensajeDeError } from '../utils/errores.js'

// Pantalla de creación de un coche (solo administradores: la ruta está protegida y, además, lo exige Supabase).
// En la iteración 15 la misma pantalla servirá para editar.
const coches = useCochesStore()
const marcas = useMarcasStore()
const router = useRouter()
const notificaciones = useNotificaciones()
const volver = useVolverAlListado()

const guardando = ref(false)
const errorGeneral = ref('')

onMounted(() => marcas.cargar())

async function guardar(datos) {
  errorGeneral.value = ''
  guardando.value = true
  try {
    const coche = await coches.crear(datos)
    notificaciones.exito('Coche creado', `${datos.modelo} se ha añadido al catálogo`)
    router.push({ name: 'coche-detalle', params: { id: coche.id } })
  } catch (fallo) {
    // El formulario se queda como estaba, para poder corregir y volver a intentarlo
    errorGeneral.value = mensajeDeError(fallo, 'No se pudo crear el coche')
  } finally {
    guardando.value = false
  }
}
</script>

<template>
  <section class="pantalla">
    <h2>Nuevo coche</h2>
    <FormularioCoche
      :marcas="marcas.marcas"
      :cargando-marcas="marcas.cargando"
      :error-marcas="marcas.error"
      :guardando="guardando"
      :error-general="errorGeneral"
      texto-guardar="Crear coche"
      @guardar="guardar"
      @cancelar="volver"
      @reintentar-marcas="marcas.cargar({ forzar: true })"
    />
  </section>
</template>

<style scoped>
.pantalla {
  max-width: 820px;
  margin: 0 auto;
}
h2 {
  margin-top: 0;
}
</style>
