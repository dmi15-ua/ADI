<script setup>
import { computed, reactive, ref, watch } from 'vue'
import InputText from 'primevue/inputtext'
import Checkbox from 'primevue/checkbox'
import Button from 'primevue/button'
import Message from 'primevue/message'
import Tag from 'primevue/tag'
import { fotoSchema } from '../servicios/validation/foto.js'

// Gestión de las fotos de un coche (solo la ven los administradores): lista las que tiene, permite eliminarlas
// y añadir una nueva escribiendo la dirección (URL) de una imagen. No habla con el servidor: emite «anadir» y «eliminar».
const props = defineProps({
  fotos: { type: Array, default: () => [] },
  anadiendo: { type: Boolean, default: false },
  eliminandoId: { type: [Number, String], default: null },
  errorAnadir: { type: String, default: '' } // error devuelto por el servidor al añadir
})
const emit = defineEmits(['anadir', 'eliminar'])

const url = ref('')
const principal = ref(false)
const errorUrl = ref('')
const ocupado = computed(() => props.anadiendo || props.eliminandoId !== null)

// Una imagen que no se puede cargar (dirección rota o que no es una imagen) se marca para que se pueda detectar y eliminar
const fallidas = reactive({})

watch(url, () => (errorUrl.value = ''))

// Cuando termina de añadirse una foto sin error, el formulario se vacía; si falló, conserva lo escrito
watch(
  () => props.anadiendo,
  (ahora, antes) => {
    if (antes && !ahora && !props.errorAnadir) {
      url.value = ''
      principal.value = false
    }
  }
)

function enviar() {
  if (!url.value.trim()) {
    errorUrl.value = 'Escribe la dirección de la imagen'
    return
  }
  const datos = { url: url.value, ...(principal.value ? { es_principal: true } : {}) }
  const resultado = fotoSchema.safeParse(datos)
  if (!resultado.success) {
    errorUrl.value = resultado.error.issues[0].message
    return
  }
  emit('anadir', resultado.data)
}
</script>

<template>
  <section class="gestor" aria-labelledby="titulo-gestor-fotos">
    <h3 id="titulo-gestor-fotos">Gestionar fotos</h3>

    <ul v-if="fotos.length" class="lista">
      <li v-for="(foto, i) in fotos" :key="foto.id">
        <img v-if="!fallidas[foto.id]" :src="foto.url" alt="" @error="fallidas[foto.id] = true" />
        <div v-else class="fallida" role="img" aria-label="No se puede mostrar la imagen"><i class="pi pi-exclamation-triangle" aria-hidden="true" /></div>
        <div class="texto">
          <span class="url" :title="foto.url">{{ foto.url }}</span>
          <span v-if="fallidas[foto.id]" class="aviso">No se puede mostrar esta imagen</span>
        </div>
        <Tag v-if="foto.es_principal" value="Principal" severity="success" />
        <Button
          icon="pi pi-trash"
          severity="danger"
          text
          rounded
          :aria-label="`Eliminar la foto ${i + 1}`"
          :loading="eliminandoId === foto.id"
          :disabled="ocupado"
          @click="emit('eliminar', foto)"
        />
      </li>
    </ul>
    <p v-else class="vacio">Este coche todavía no tiene fotos.</p>

    <form class="nueva" aria-label="Añadir una foto" @submit.prevent="enviar">
      <label for="foto-url">Dirección (URL) de la imagen</label>
      <InputText id="foto-url" v-model="url" placeholder="https://ejemplo.com/foto.jpg" maxlength="2000" :invalid="!!errorUrl" fluid />
      <small v-if="errorUrl" class="error" id="error-foto-url">{{ errorUrl }}</small>

      <div class="principal">
        <Checkbox input-id="foto-principal" data-campo="es_principal" v-model="principal" binary />
        <label for="foto-principal">Usar como foto principal</label>
      </div>

      <Message v-if="errorAnadir" severity="error" :closable="false" role="alert">{{ errorAnadir }}</Message>

      <Button type="submit" label="Añadir foto" icon="pi pi-plus" size="small" :loading="anadiendo" :disabled="ocupado" />
    </form>
  </section>
</template>

<style scoped>
.gestor {
  margin-top: 1.5rem;
  padding: 1rem;
  background: white;
  border: 1px solid var(--p-surface-200, #e2e8f0);
  border-radius: 0.75rem;
}
h3 {
  margin: 0 0 0.75rem;
  font-size: 1.05rem;
}
.lista {
  list-style: none;
  margin: 0 0 1rem;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.lista li {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}
.lista img,
.fallida {
  width: 64px;
  height: 42px;
  flex: none;
  border-radius: 0.375rem;
  object-fit: cover;
  background: var(--p-surface-100, #f1f5f9);
}
.fallida {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--p-red-600, #dc2626);
}
.texto {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}
.url {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.875rem;
}
.aviso {
  font-size: 0.8rem;
  color: var(--p-red-600, #dc2626);
}
.vacio {
  margin: 0 0 1rem;
  color: var(--p-text-muted-color, #64748b);
}
.nueva {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  align-items: flex-start;
}
.nueva label {
  font-size: 0.875rem;
  font-weight: 600;
}
.nueva > * {
  align-self: stretch;
}
.nueva > button {
  align-self: flex-start;
}
.principal {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.principal label {
  font-weight: 400;
}
.error {
  color: var(--p-red-600, #dc2626);
}
</style>
