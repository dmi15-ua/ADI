<script setup>
import { computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Button from 'primevue/button'
import Paginator from 'primevue/paginator'
import CocheCard from '../components/CocheCard.vue'
import EstadoCarga from '../components/EstadoCarga.vue'
import FiltrosCoches from '../components/FiltrosCoches.vue'
import { useCochesStore } from '../stores/coches.js'
import { useMarcasStore } from '../stores/marcas.js'
import { useSesionStore } from '../stores/sesion.js'
import { filtrosDesdeQuery, hayFiltros, queryDesdeFiltros } from '../utils/filtros.js'

const coches = useCochesStore()
const sesion = useSesionStore()
const marcas = useMarcasStore()
const route = useRoute()
const router = useRouter()

// La página y los filtros viven en la URL (?pagina=2&marca=1&precio_max=15000): así funciona atrás/adelante y se puede compartir o recargar
onMounted(() => marcas.cargar())
const filtros = computed(() => filtrosDesdeQuery(route.query))
const pagina = computed(() => {
  const n = Number(route.query.pagina)
  return Number.isInteger(n) && n >= 1 ? n : 1
})

// Carga una página con unos filtros. Si se pide una página que ya no existe (por ejemplo, tras borrar el último coche de la última
// página, o al endurecer los filtros), se va a la última que quede.
async function cargarPagina(p, f) {
  await coches.cargar({ pagina: p, filtros: f })
  if (!coches.error && coches.items.length === 0 && coches.total > 0 && p > coches.totalPaginas) {
    irAPagina(coches.totalPaginas)
  }
}

// Cambiar la página o cualquier filtro vuelve a pedir los datos; otros parámetros de la URL no
const peticion = computed(() => JSON.stringify([pagina.value, filtros.value]))
watch(peticion, () => cargarPagina(pagina.value, filtros.value), { immediate: true })

function irAPagina(n, reemplazar = true) {
  const query = { ...route.query }
  if (n > 1) query.pagina = String(n)
  else delete query.pagina
  return reemplazar ? router.replace({ query }) : router.push({ query })
}

// Al eliminar un coche se vuelve a pedir la página actual: los demás coches suben de sitio y el total cambia
const alEliminar = () => cargarPagina(pagina.value, filtros.value)
const alCambiarPagina = (evento) => irAPagina(evento.page + 1, false)
const sinCoches = computed(() => coches.items.length === 0)
const textoVacio = computed(() =>
  hayFiltros(filtros.value) ? 'No se han encontrado coches con esos filtros.' : 'No hay coches disponibles en este momento.'
)

// Buscar con otros filtros lleva a la primera página; es una navegación nueva, así que «atrás» recupera la búsqueda anterior
const buscar = (nuevos) => router.push({ query: queryDesdeFiltros(nuevos) })
</script>

<template>
  <section>
    <div class="cabecera">
      <h2>Coches disponibles</h2>
      <Button v-if="sesion.esAdmin" label="Nuevo coche" icon="pi pi-plus" @click="router.push({ name: 'coche-nuevo' })" />
    </div>

    <FiltrosCoches
      :filtros="filtros"
      :marcas="marcas.marcas"
      :cargando-marcas="marcas.cargando"
      :error-marcas="marcas.error"
      @buscar="buscar"
      @reintentar-marcas="marcas.cargar({ forzar: true })"
    />

    <EstadoCarga
      :cargando="coches.cargando"
      :error="coches.error"
      :vacio="sinCoches"
      :texto-vacio="textoVacio"
      texto-cargando="Cargando coches..."
      @reintentar="coches.reintentar()"
    >
      <ul class="rejilla">
        <li v-for="coche in coches.items" :key="coche.id"><CocheCard :coche="coche" @eliminado="alEliminar" /></li>
      </ul>

      <Paginator
        :rows="coches.porPagina"
        :total-records="coches.total"
        :first="(coches.pagina - 1) * coches.porPagina"
        template="PrevPageLink PageLinks NextPageLink CurrentPageReport"
        current-page-report-template="Mostrando {first}-{last} de {totalRecords} coches"
        @page="alCambiarPagina"
      />
    </EstadoCarga>
  </section>
</template>

<style scoped>
.cabecera {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;
}
h2 {
  margin: 0;
}
.rejilla {
  list-style: none;
  margin: 0 0 1rem;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 1rem;
}
</style>
