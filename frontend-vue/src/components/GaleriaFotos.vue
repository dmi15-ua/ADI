<script setup>
import { computed, reactive, ref, watch } from 'vue'

// Galería de fotos de un coche: una foto grande y las miniaturas para cambiar de foto.
// La foto principal es la que se muestra al empezar.
const props = defineProps({
  fotos: { type: Array, default: () => [] },
  descripcion: { type: String, default: 'Foto del coche' }
})

const indice = ref(0)
const indicePrincipal = computed(() => Math.max(0, props.fotos.findIndex((f) => f.es_principal)))
watch(() => props.fotos, () => (indice.value = indicePrincipal.value), { immediate: true })

const actual = computed(() => props.fotos[indice.value])

// Una foto cuya dirección no carga (o no es una imagen) se sustituye por un marcador, en lugar del icono de imagen rota
const fallidas = reactive({})
</script>

<template>
  <div class="galeria">
    <div v-if="fotos.length === 0" class="sin-fotos">
      <i class="pi pi-image" aria-hidden="true" />
      <span>Este coche no tiene fotos</span>
    </div>

    <template v-else>
      <img
        v-if="!fallidas[actual.id]"
        class="grande"
        :src="actual.url"
        :alt="`${descripcion} (foto ${indice + 1} de ${fotos.length})`"
        @error="fallidas[actual.id] = true"
      />
      <div v-else class="sin-fotos" role="img" :aria-label="`${descripcion}: la foto ${indice + 1} no se puede mostrar`">
        <i class="pi pi-exclamation-triangle" aria-hidden="true" />
        <span>No se puede mostrar esta foto</span>
      </div>
      <ul v-if="fotos.length > 1" class="miniaturas">
        <li v-for="(foto, i) in fotos" :key="foto.id">
          <button
            type="button"
            :class="{ activa: i === indice }"
            :aria-label="`Ver la foto ${i + 1}`"
            :aria-pressed="i === indice"
            @click="indice = i"
          >
            <img v-if="!fallidas[foto.id]" :src="foto.url" alt="" @error="fallidas[foto.id] = true" />
            <span v-else class="miniatura-rota"><i class="pi pi-exclamation-triangle" aria-hidden="true" /></span>
          </button>
        </li>
      </ul>
    </template>
  </div>
</template>

<style scoped>
.grande {
  width: 100%;
  aspect-ratio: 16 / 10;
  object-fit: cover;
  border-radius: 0.75rem;
  display: block;
  background: var(--p-surface-100, #f1f5f9);
}
.sin-fotos {
  aspect-ratio: 16 / 10;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  border-radius: 0.75rem;
  background: var(--p-surface-100, #f1f5f9);
  color: var(--p-text-muted-color, #64748b);
}
.sin-fotos i {
  font-size: 2.5rem;
}
.miniaturas {
  list-style: none;
  margin: 0.75rem 0 0;
  padding: 0;
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}
.miniaturas button {
  padding: 0;
  border: 2px solid transparent;
  border-radius: 0.5rem;
  overflow: hidden;
  cursor: pointer;
  background: none;
  display: block;
}
.miniaturas button.activa {
  border-color: var(--p-primary-color, #10b981);
}
.miniatura-rota {
  width: 88px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--p-surface-100, #f1f5f9);
  color: var(--p-red-600, #dc2626);
}
.miniaturas img {
  width: 88px;
  height: 56px;
  object-fit: cover;
  display: block;
}
</style>
