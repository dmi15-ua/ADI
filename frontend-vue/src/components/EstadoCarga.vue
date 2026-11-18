<script setup>
import Button from 'primevue/button'
import Message from 'primevue/message'
import ProgressSpinner from 'primevue/progressspinner'

// Muestra el estado de una carga de datos: cargando, error (con botón para reintentar), vacío o el contenido.
// Distingue un error al obtener los datos de que simplemente no haya datos.
defineProps({
  cargando: { type: Boolean, default: false },
  error: { type: String, default: '' },
  vacio: { type: Boolean, default: false },
  textoVacio: { type: String, default: 'No hay datos que mostrar.' },
  textoCargando: { type: String, default: 'Cargando...' }
})
defineEmits(['reintentar'])
</script>

<template>
  <div v-if="error" class="estado estado-error" role="alert">
    <Message severity="error" :closable="false">{{ error }}</Message>
    <Button label="Reintentar" icon="pi pi-refresh" severity="secondary" @click="$emit('reintentar')" />
  </div>
  <div v-else-if="cargando && vacio" class="estado estado-cargando" aria-live="polite">
    <ProgressSpinner aria-label="Cargando" />
    <span>{{ textoCargando }}</span>
  </div>
  <div v-else-if="vacio" class="estado estado-vacio">
    <i class="pi pi-inbox" aria-hidden="true" />
    <p>{{ textoVacio }}</p>
  </div>
  <div v-else :class="{ ocupado: cargando }" :aria-busy="cargando">
    <slot />
  </div>
</template>

<style scoped>
.estado {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 3rem 1rem;
  text-align: center;
}
.estado-vacio i {
  font-size: 2.5rem;
  color: var(--p-text-muted-color, #64748b);
}
.ocupado {
  opacity: 0.5;
  pointer-events: none;
}
</style>
