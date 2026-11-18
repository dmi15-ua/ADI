<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import { etiquetaCombustible, etiquetaTransmision, formatoKm, formatoPrecio } from '../utils/formato.js'

const props = defineProps({ coche: { type: Object, required: true } })
const router = useRouter()

const titulo = computed(() => `${props.coche.marca.nombre} ${props.coche.modelo}`)
const destino = computed(() => ({ name: 'coche-detalle', params: { id: props.coche.id } }))
</script>

<template>
  <article class="coche">
    <RouterLink :to="destino" class="foto" :aria-label="`Ver ${titulo}`" tabindex="-1">
      <img v-if="coche.foto_principal" :src="coche.foto_principal" :alt="titulo" loading="lazy" />
      <div v-else class="sin-foto"><i class="pi pi-image" aria-hidden="true" /><span>Sin foto</span></div>
    </RouterLink>

    <div class="cuerpo">
      <h3><RouterLink :to="destino">{{ titulo }}</RouterLink></h3>
      <p class="precio">{{ formatoPrecio(coche.precio) }}</p>
      <p class="datos">{{ coche.anio }} · {{ formatoKm(coche.km) }}</p>
      <div class="etiquetas">
        <Tag :value="etiquetaCombustible(coche.combustible)" severity="info" />
        <Tag :value="etiquetaTransmision(coche.transmision)" severity="secondary" />
      </div>
    </div>

    <footer>
      <Button label="Ver detalle" icon="pi pi-eye" size="small" outlined @click="router.push(destino)" />
    </footer>
  </article>
</template>

<style scoped>
.coche {
  display: flex;
  flex-direction: column;
  background: white;
  border: 1px solid var(--p-surface-200, #e2e8f0);
  border-radius: 0.75rem;
  overflow: hidden;
}
.foto {
  display: block;
  color: inherit;
  text-decoration: none;
  aspect-ratio: 16 / 10;
  background: var(--p-surface-100, #f1f5f9);
}
.foto img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.sin-foto {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
  color: var(--p-text-muted-color, #64748b);
}
.sin-foto i {
  font-size: 2rem;
}
.cuerpo {
  flex: 1;
  padding: 0.75rem 1rem 0;
}
h3 {
  margin: 0 0 0.25rem;
  font-size: 1.1rem;
}
h3 a {
  color: inherit;
  text-decoration: none;
}
.precio {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 700;
}
.datos {
  margin: 0.25rem 0 0.5rem;
  color: var(--p-text-muted-color, #64748b);
}
.etiquetas {
  display: flex;
  gap: 0.4rem;
  flex-wrap: wrap;
}
footer {
  padding: 0.75rem 1rem 1rem;
}
</style>
