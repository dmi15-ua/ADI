<script setup>
import { computed, watch } from 'vue'
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import EstadoCarga from '../components/EstadoCarga.vue'
import GaleriaFotos from '../components/GaleriaFotos.vue'
import { useCochesStore } from '../stores/coches.js'
import { useVolverAlListado } from '../composables/useVolverAlListado.js'
import { etiquetaCombustible, etiquetaTransmision, formatoKm, formatoPrecio } from '../utils/formato.js'

const props = defineProps({ id: { type: String, required: true } }) // viene de la ruta /coches/:id

const coches = useCochesStore()
const volver = useVolverAlListado()

watch(
  () => props.id,
  (id) => coches.cargarDetalle(id),
  { immediate: true }
)

const coche = computed(() => coches.detalle)
const titulo = computed(() => (coche.value ? `${coche.value.marca.nombre} ${coche.value.modelo}` : ''))

// El título de la pestaña incluye el coche que se está viendo
watch(titulo, (t) => {
  if (t) document.title = `Concesionario · ${t}`
})
</script>

<template>
  <section>
    <Button label="Volver al listado" icon="pi pi-arrow-left" severity="secondary" text @click="volver" />

    <div v-if="coches.detalleNoEncontrado" class="no-encontrado" role="alert">
      <i class="pi pi-search" aria-hidden="true" />
      <h2>Coche no encontrado</h2>
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
      <article v-if="coche" class="detalle">
        <GaleriaFotos :fotos="coche.foto_coche" :descripcion="titulo" />

        <div class="ficha">
          <h2>{{ titulo }}</h2>
          <p class="precio">{{ formatoPrecio(coche.precio) }}</p>
          <div class="etiquetas">
            <Tag :value="etiquetaCombustible(coche.combustible)" severity="info" />
            <Tag :value="etiquetaTransmision(coche.transmision)" severity="secondary" />
            <Tag v-if="coche.disponible" value="Disponible" severity="success" />
            <Tag v-else value="No disponible" severity="danger" />
          </div>

          <h3>Ficha técnica</h3>
          <dl class="datos">
            <dt>Año</dt><dd>{{ coche.anio }}</dd>
            <dt>Kilometraje</dt><dd>{{ formatoKm(coche.km) }}</dd>
            <dt>Potencia</dt><dd>{{ coche.potencia_cv }} CV</dd>
            <dt>Combustible</dt><dd>{{ etiquetaCombustible(coche.combustible) }}</dd>
            <dt>Transmisión</dt><dd>{{ etiquetaTransmision(coche.transmision) }}</dd>
          </dl>

          <h3>Descripción</h3>
          <p v-if="coche.descripcion">{{ coche.descripcion }}</p>
          <p v-else class="vacio">Sin descripción.</p>

          <h3>Equipamiento</h3>
          <ul v-if="coche.equipamiento.length" class="equipamiento">
            <li v-for="elemento in coche.equipamiento" :key="elemento"><Tag :value="elemento" severity="secondary" /></li>
          </ul>
          <p v-else class="vacio">No se ha indicado el equipamiento.</p>
        </div>
      </article>
    </EstadoCarga>
  </section>
</template>

<style scoped>
.detalle {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 1.5rem;
  margin-top: 0.5rem;
}
@media (min-width: 800px) {
  .detalle {
    grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr);
  }
}
h2 {
  margin: 0 0 0.25rem;
}
h3 {
  margin: 1.5rem 0 0.5rem;
  font-size: 1.05rem;
}
.precio {
  margin: 0 0 0.75rem;
  font-size: 1.75rem;
  font-weight: 700;
}
.etiquetas {
  display: flex;
  gap: 0.4rem;
  flex-wrap: wrap;
}
.datos {
  display: grid;
  grid-template-columns: max-content 1fr;
  gap: 0.35rem 1.5rem;
  margin: 0;
}
.datos dt {
  color: var(--p-text-muted-color, #64748b);
}
.datos dd {
  margin: 0;
  font-weight: 600;
}
.equipamiento {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  gap: 0.4rem;
  flex-wrap: wrap;
}
.vacio {
  color: var(--p-text-muted-color, #64748b);
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
