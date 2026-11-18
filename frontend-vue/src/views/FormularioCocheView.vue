<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import FormularioCoche from '../components/FormularioCoche.vue'
import EstadoCarga from '../components/EstadoCarga.vue'
import { useCochesStore } from '../stores/coches.js'
import { useMarcasStore } from '../stores/marcas.js'
import { useNotificaciones } from '../composables/useNotificaciones.js'
import { useConfirmacion } from '../composables/useConfirmacion.js'
import { useVolverAlListado } from '../composables/useVolverAlListado.js'
import { diferencias } from '../utils/cambios.js'
import { mensajeDeError } from '../utils/errores.js'

// Pantalla del formulario de un coche, para crear (/coches/nuevo) y para editar (/coches/:id/editar).
// Solo administradores: las rutas están protegidas y, además, lo exige Supabase.
const props = defineProps({ id: { type: String, default: null } }) // solo llega al editar

const coches = useCochesStore()
const marcas = useMarcasStore()
const router = useRouter()
const notificaciones = useNotificaciones()
const { confirmar } = useConfirmacion()
const volver = useVolverAlListado()

const editando = computed(() => props.id !== null)
const coche = computed(() => coches.detalle)
const guardando = ref(false)
const errorGeneral = ref('')

onMounted(() => marcas.cargar())

// Al editar hay que traer los datos actuales del coche, que son los valores iniciales del formulario
watch(
  () => props.id,
  (id) => {
    if (id !== null) coches.cargarDetalle(id)
  },
  { immediate: true }
)

async function guardar(datos) {
  errorGeneral.value = ''
  if (editando.value) return guardarCambios(datos)
  return guardarNuevo(datos)
}

async function guardarNuevo(datos) {
  guardando.value = true
  try {
    const creado = await coches.crear(datos)
    notificaciones.exito('Coche creado', `${datos.modelo} se ha añadido al catálogo`)
    router.push({ name: 'coche-detalle', params: { id: creado.id } })
  } catch (fallo) {
    // El formulario se queda como estaba, para poder corregir y volver a intentarlo
    errorGeneral.value = mensajeDeError(fallo, 'No se pudo crear el coche')
  } finally {
    guardando.value = false
  }
}

async function guardarCambios(datos) {
  // Solo se envía lo que ha cambiado; si no ha cambiado nada, no hay nada que guardar
  const cambios = diferencias(coche.value, datos)
  if (Object.keys(cambios).length === 0) {
    notificaciones.aviso('No hay cambios que guardar')
    return
  }
  guardando.value = true
  try {
    await coches.actualizar(props.id, cambios)
    notificaciones.exito('Coche actualizado', 'Los cambios se han guardado')
    router.push({ name: 'coche-detalle', params: { id: props.id } })
  } catch (fallo) {
    errorGeneral.value = mensajeDeError(fallo, 'No se pudieron guardar los cambios')
  } finally {
    guardando.value = false
  }
}

// Cancelar no guarda nada. Si al editar hay cambios sin guardar, se pide confirmar antes de descartarlos.
async function cancelar(datosActuales) {
  if (editando.value && Object.keys(diferencias(coche.value, datosActuales)).length > 0) {
    const descartar = await confirmar({
      titulo: 'Cambios sin guardar',
      mensaje: 'Has modificado el coche y no has guardado los cambios. ¿Quieres descartarlos?',
      textoAceptar: 'Descartar cambios',
      textoCancelar: 'Seguir editando',
      peligro: true
    })
    if (!descartar) return
  }
  if (editando.value) volverDeEditar()
  else volver()
}

// Al editar, cancelar devuelve a donde se estaba (la ficha o el listado, en su misma página).
// Si se entró directamente a la pantalla, no hay a dónde volver y se va a la ficha del coche.
function volverDeEditar() {
  if (typeof router.options.history.state.back === 'string') router.back()
  else router.push({ name: 'coche-detalle', params: { id: props.id } })
}

const titulo = computed(() => {
  if (!editando.value) return 'Nuevo coche'
  return coche.value ? `Editar ${coche.value.marca.nombre} ${coche.value.modelo}` : 'Editar coche'
})
</script>

<template>
  <section class="pantalla">
    <h2>{{ titulo }}</h2>

    <!-- Crear -->
    <FormularioCoche
      v-if="!editando"
      :marcas="marcas.marcas"
      :cargando-marcas="marcas.cargando"
      :error-marcas="marcas.error"
      :guardando="guardando"
      :error-general="errorGeneral"
      texto-guardar="Crear coche"
      @guardar="guardar"
      @cancelar="cancelar"
      @reintentar-marcas="marcas.cargar({ forzar: true })"
    />

    <!-- Editar: primero se cargan los datos actuales del coche -->
    <div v-else-if="coches.detalleNoEncontrado" class="no-encontrado" role="alert">
      <i class="pi pi-search" aria-hidden="true" />
      <h3>Coche no encontrado</h3>
      <p>Este coche no existe o ya no está en el catálogo.</p>
      <RouterLink :to="{ name: 'listado' }">Ver todos los coches</RouterLink>
    </div>
    <EstadoCarga
      v-else
      :cargando="coches.cargandoDetalle"
      :error="coches.errorDetalle"
      :vacio="!coche"
      texto-vacio="No hay datos de este coche."
      texto-cargando="Cargando coche..."
      @reintentar="coches.reintentarDetalle()"
    >
      <FormularioCoche
        v-if="coche"
        :key="coche.id"
        modo="editar"
        :valores="coche"
        :marcas="marcas.marcas"
        :cargando-marcas="marcas.cargando"
        :error-marcas="marcas.error"
        :guardando="guardando"
        :error-general="errorGeneral"
        texto-guardar="Guardar cambios"
        @guardar="guardar"
        @cancelar="cancelar"
        @reintentar-marcas="marcas.cargar({ forzar: true })"
      />
    </EstadoCarga>
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
.no-encontrado {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 3rem 1rem;
  text-align: center;
}
.no-encontrado i {
  font-size: 2.5rem;
  color: var(--p-text-muted-color, #64748b);
}
</style>
