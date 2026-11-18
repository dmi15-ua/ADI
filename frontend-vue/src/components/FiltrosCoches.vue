<script setup>
import { computed, reactive, ref, watch } from 'vue'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Select from 'primevue/select'
import Button from 'primevue/button'
import { hayFiltros } from '../utils/filtros.js'

// Barra de búsqueda del listado. No consulta nada por sí misma: se rellena con los filtros que están aplicados
// (los de la URL) y, al pulsar «Buscar», emite «buscar» con los nuevos. Nada se busca mientras se escribe.
const props = defineProps({
  filtros: { type: Object, default: () => ({}) }, // los filtros aplicados
  marcas: { type: Array, default: () => [] },
  cargandoMarcas: { type: Boolean, default: false },
  errorMarcas: { type: String, default: '' }
})
const emit = defineEmits(['buscar', 'reintentar-marcas'])

const COMBUSTIBLES = [
  { valor: 'gasolina', etiqueta: 'Gasolina' },
  { valor: 'diesel', etiqueta: 'Diésel' },
  { valor: 'electrico', etiqueta: 'Eléctrico' }
]
const TRANSMISIONES = [
  { valor: 'manual', etiqueta: 'Manual' },
  { valor: 'automatico', etiqueta: 'Automático' }
]
const ORDENES = [
  { valor: 'recientes', etiqueta: 'Más recientes' },
  { valor: 'precio_asc', etiqueta: 'Precio: de menor a mayor' },
  { valor: 'precio_desc', etiqueta: 'Precio: de mayor a menor' },
  { valor: 'km_asc', etiqueta: 'Menos kilómetros' }
]

// Lo que hay escrito en la barra (borrador). Se vuelve a rellenar cuando cambian los filtros aplicados,
// por ejemplo al usar atrás/adelante del navegador.
const borrador = reactive({ texto: '', marca_id: null, combustible: null, transmision: null, precio_min: null, precio_max: null, orden: 'recientes' })
const errorPrecios = ref('')

function rellenar(filtros) {
  borrador.texto = filtros.texto ?? ''
  borrador.marca_id = filtros.marca_id ?? null
  borrador.combustible = filtros.combustible ?? null
  borrador.transmision = filtros.transmision ?? null
  borrador.precio_min = filtros.precio_min ?? null
  borrador.precio_max = filtros.precio_max ?? null
  borrador.orden = filtros.orden ?? 'recientes'
  errorPrecios.value = ''
}
watch(() => props.filtros, rellenar, { immediate: true, deep: true })

// Los filtros que representa el borrador: solo los que tienen valor
function filtrosDelBorrador() {
  const filtros = {}
  const texto = borrador.texto.trim()
  if (texto) filtros.texto = texto
  if (borrador.marca_id !== null) filtros.marca_id = borrador.marca_id
  if (borrador.combustible !== null) filtros.combustible = borrador.combustible
  if (borrador.transmision !== null) filtros.transmision = borrador.transmision
  if (borrador.precio_min !== null) filtros.precio_min = borrador.precio_min
  if (borrador.precio_max !== null) filtros.precio_max = borrador.precio_max
  if (borrador.orden !== 'recientes') filtros.orden = borrador.orden
  return filtros
}

// «Limpiar» sirve si hay algo escrito o algo aplicado
const hayAlgo = computed(() => hayFiltros(filtrosDelBorrador()) || hayFiltros(props.filtros))

// Al corregir un precio, desaparece el aviso
watch([() => borrador.precio_min, () => borrador.precio_max], () => (errorPrecios.value = ''))

function buscar() {
  const filtros = filtrosDelBorrador()
  if (filtros.precio_min !== undefined && filtros.precio_max !== undefined && filtros.precio_min > filtros.precio_max) {
    errorPrecios.value = 'El precio mínimo no puede ser mayor que el máximo'
    return
  }
  errorPrecios.value = ''
  emit('buscar', filtros)
}

function limpiar() {
  rellenar({})
  emit('buscar', {})
}
</script>

<template>
  <form class="filtros" role="search" aria-label="Buscar coches" @submit.prevent="buscar">
    <div class="rejilla">
      <div class="campo campo-texto">
        <label for="texto">Modelo</label>
        <InputText id="texto" v-model="borrador.texto" maxlength="100" placeholder="Ibiza, Clio..." fluid />
      </div>

      <div class="campo">
        <label for="filtro-marca">Marca</label>
        <Select
          input-id="filtro-marca"
          data-campo="marca_id"
          v-model="borrador.marca_id"
          :options="marcas"
          option-label="nombre"
          option-value="id"
          :loading="cargandoMarcas"
          :disabled="!!errorMarcas"
          :placeholder="errorMarcas ? 'Marcas no disponibles' : 'Todas'"
          show-clear
          fluid
        />
        <button v-if="errorMarcas" type="button" class="reintentar" @click="emit('reintentar-marcas')">Reintentar</button>
      </div>

      <div class="campo">
        <label for="filtro-combustible">Combustible</label>
        <Select
          input-id="filtro-combustible"
          data-campo="combustible"
          v-model="borrador.combustible"
          :options="COMBUSTIBLES"
          option-label="etiqueta"
          option-value="valor"
          placeholder="Todos"
          show-clear
          fluid
        />
      </div>

      <div class="campo">
        <label for="filtro-transmision">Transmisión</label>
        <Select
          input-id="filtro-transmision"
          data-campo="transmision"
          v-model="borrador.transmision"
          :options="TRANSMISIONES"
          option-label="etiqueta"
          option-value="valor"
          placeholder="Todas"
          show-clear
          fluid
        />
      </div>

      <div class="campo">
        <label for="precio_min">Precio mínimo</label>
        <InputNumber
          input-id="precio_min"
          data-campo="precio_min"
          v-model="borrador.precio_min"
          suffix=" €"
          locale="es-ES"
          :max-fraction-digits="0"
          :min="0"
          :max="10000000"
          :invalid="!!errorPrecios"
          fluid
        />
      </div>

      <div class="campo">
        <label for="precio_max">Precio máximo</label>
        <InputNumber
          input-id="precio_max"
          data-campo="precio_max"
          v-model="borrador.precio_max"
          suffix=" €"
          locale="es-ES"
          :max-fraction-digits="0"
          :min="0"
          :max="10000000"
          :invalid="!!errorPrecios"
          fluid
        />
      </div>

      <div class="campo campo-ancho">
        <label for="filtro-orden">Ordenar por</label>
        <Select
          input-id="filtro-orden"
          data-campo="orden"
          v-model="borrador.orden"
          :options="ORDENES"
          option-label="etiqueta"
          option-value="valor"
          fluid
        />
      </div>
    </div>

    <small v-if="errorPrecios" class="error" id="error-precios" role="alert">{{ errorPrecios }}</small>

    <div class="acciones">
      <Button type="submit" label="Buscar" icon="pi pi-search" />
      <Button type="button" label="Limpiar" icon="pi pi-filter-slash" severity="secondary" outlined :disabled="!hayAlgo" @click="limpiar" />
    </div>
  </form>
</template>

<style scoped>
.filtros {
  background: white;
  border: 1px solid var(--p-surface-200, #e2e8f0);
  border-radius: 0.75rem;
  padding: 1rem;
  margin-bottom: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
.rejilla {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));
  gap: 0.75rem 1rem;
}
.campo {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}
.campo-texto,
.campo-ancho {
  grid-column: span 2;
}
@media (max-width: 480px) {
  .campo-texto,
  .campo-ancho {
    grid-column: auto;
  }
}
label {
  font-size: 0.875rem;
  font-weight: 600;
}
.error {
  color: var(--p-red-600, #dc2626);
}
.reintentar {
  align-self: flex-start;
  background: none;
  border: none;
  padding: 0;
  color: var(--p-primary-color, #059669);
  text-decoration: underline;
  cursor: pointer;
  font: inherit;
  font-size: 0.85rem;
}
.acciones {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}
</style>
