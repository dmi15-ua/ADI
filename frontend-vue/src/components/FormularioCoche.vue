<script setup>
import { computed, reactive, ref, watch } from 'vue'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Select from 'primevue/select'
import Textarea from 'primevue/textarea'
import ToggleSwitch from 'primevue/toggleswitch'
import Button from 'primevue/button'
import Message from 'primevue/message'
import { cocheSchema } from '../servicios/validation/coche.js'

// Formulario de datos de un coche. Sirve para crear y (iteración 15) para editar.
// Valida en el cliente con el mismo esquema que el backend y, si todo es correcto, emite «guardar» con los datos limpios.
const props = defineProps({
  marcas: { type: Array, default: () => [] },
  cargandoMarcas: { type: Boolean, default: false },
  errorMarcas: { type: String, default: '' },
  guardando: { type: Boolean, default: false },
  errorGeneral: { type: String, default: '' }, // error devuelto por el servidor al guardar
  valores: { type: Object, default: null }, // datos iniciales (edición)
  textoGuardar: { type: String, default: 'Guardar' },
  modo: { type: String, default: 'crear' } // 'crear' o 'editar'
})
const emit = defineEmits(['guardar', 'cancelar', 'reintentar-marcas'])

const COMBUSTIBLES = [
  { valor: 'gasolina', etiqueta: 'Gasolina' },
  { valor: 'diesel', etiqueta: 'Diésel' },
  { valor: 'electrico', etiqueta: 'Eléctrico' }
]
const TRANSMISIONES = [
  { valor: 'manual', etiqueta: 'Manual' },
  { valor: 'automatico', etiqueta: 'Automático' }
]
const ANIO_MAXIMO = new Date().getFullYear() + 1
const MAX_DESCRIPCION = 2000

const inicial = props.valores ?? {}
const formulario = reactive({
  marca_id: inicial.marca_id ?? null,
  modelo: inicial.modelo ?? '',
  precio: inicial.precio ?? null,
  km: inicial.km ?? null,
  anio: inicial.anio ?? null,
  combustible: inicial.combustible ?? null,
  transmision: inicial.transmision ?? null,
  potencia_cv: inicial.potencia_cv ?? null,
  descripcion: inicial.descripcion ?? '',
  equipamiento: (inicial.equipamiento ?? []).join(', '), // se escribe separado por comas
  disponible: inicial.disponible ?? true
})
const errores = ref({})

// El error de un campo desaparece en cuanto se modifica, sin esperar a volver a enviar el formulario
watch(
  () => ({ ...formulario }),
  (nuevo, anterior) => {
    for (const campo of Object.keys(nuevo)) {
      if (nuevo[campo] !== anterior[campo]) delete errores.value[campo]
    }
  }
)

// Campos que son listas desplegables: si no se ha elegido nada se pide con un mensaje más claro que el del esquema
const OBLIGATORIOS_A_ELEGIR = {
  marca_id: 'Selecciona una marca',
  combustible: 'Selecciona el combustible',
  transmision: 'Selecciona la transmisión'
}

function construirDatos() {
  const descripcion = formulario.descripcion.trim()
  const equipamiento = formulario.equipamiento.split(',').map((e) => e.trim()).filter(Boolean)
  const editando = props.modo === 'editar'
  return {
    marca_id: formulario.marca_id,
    modelo: formulario.modelo,
    precio: formulario.precio,
    km: formulario.km,
    anio: formulario.anio,
    combustible: formulario.combustible,
    transmision: formulario.transmision,
    potencia_cv: formulario.potencia_cv,
    // Al crear, los campos opcionales vacíos no se envían. Al editar sí, para poder borrar lo que ya había.
    descripcion: editando ? descripcion : descripcion || undefined,
    equipamiento: editando ? equipamiento : equipamiento.length ? equipamiento : undefined,
    disponible: formulario.disponible
  }
}

// Los mensajes del esquema están en español; si alguno viniera con el texto genérico de la librería (en inglés), se sustituye
const mensajeDelProblema = (problema) => (/^(Too |Invalid )/.test(problema.message) ? 'Valor no válido' : problema.message)

function enviar() {
  errores.value = {}
  const datos = construirDatos()
  const resultado = cocheSchema.safeParse(datos)

  if (!resultado.success) {
    for (const problema of resultado.error.issues) {
      const campo = problema.path[0]
      if (errores.value[campo]) continue
      errores.value[campo] = campo === 'descripcion' ? `La descripción no puede superar ${MAX_DESCRIPCION} caracteres` : mensajeDelProblema(problema)
    }
    for (const [campo, mensaje] of Object.entries(OBLIGATORIOS_A_ELEGIR)) {
      if (formulario[campo] === null) errores.value[campo] = mensaje
    }
    return
  }
  emit('guardar', resultado.data)
}

const sinMarcas = computed(() => !props.cargandoMarcas && !props.errorMarcas && props.marcas.length === 0)
</script>

<template>
  <form novalidate class="formulario" @submit.prevent="enviar">
    <Message v-if="errorMarcas" severity="error" :closable="false">
      {{ errorMarcas }}
      <Button label="Reintentar" size="small" severity="secondary" text @click="emit('reintentar-marcas')" />
    </Message>
    <Message v-else-if="sinMarcas" severity="warn" :closable="false">
      No hay marcas dadas de alta. Hay que crear al menos una marca antes de añadir coches.
    </Message>

    <div class="rejilla">
      <div class="campo">
        <label for="marca">Marca</label>
        <Select
          input-id="marca"
          data-campo="marca_id"
          v-model="formulario.marca_id"
          :options="marcas"
          option-label="nombre"
          option-value="id"
          :loading="cargandoMarcas"
          placeholder="Elige una marca"
          :invalid="!!errores.marca_id"
          fluid
        />
        <small v-if="errores.marca_id" class="error" id="error-marca_id">{{ errores.marca_id }}</small>
      </div>

      <div class="campo">
        <label for="modelo">Modelo</label>
        <InputText id="modelo" v-model="formulario.modelo" maxlength="100" :invalid="!!errores.modelo" fluid />
        <small v-if="errores.modelo" class="error" id="error-modelo">{{ errores.modelo }}</small>
      </div>

      <div class="campo">
        <label for="precio">Precio</label>
        <InputNumber
          input-id="precio"
          data-campo="precio"
          v-model="formulario.precio"
          suffix=" €"
          locale="es-ES"
          :max-fraction-digits="0"
          :min="0"
          :max="10000000"
          :invalid="!!errores.precio"
          fluid
        />
        <small v-if="errores.precio" class="error" id="error-precio">{{ errores.precio }}</small>
      </div>

      <div class="campo">
        <label for="km">Kilometraje</label>
        <InputNumber
          input-id="km"
          data-campo="km"
          v-model="formulario.km"
          suffix=" km"
          locale="es-ES"
          :max-fraction-digits="0"
          :invalid="!!errores.km"
          fluid
        />
        <small v-if="errores.km" class="error" id="error-km">{{ errores.km }}</small>
      </div>

      <div class="campo">
        <label for="anio">Año</label>
        <InputNumber
          input-id="anio"
          data-campo="anio"
          v-model="formulario.anio"
          :use-grouping="false"
          :max-fraction-digits="0"
          :placeholder="`Entre 1950 y ${ANIO_MAXIMO}`"
          :invalid="!!errores.anio"
          fluid
        />
        <small v-if="errores.anio" class="error" id="error-anio">{{ errores.anio }}</small>
      </div>

      <div class="campo">
        <label for="potencia_cv">Potencia (CV)</label>
        <InputNumber
          input-id="potencia_cv"
          data-campo="potencia_cv"
          v-model="formulario.potencia_cv"
          :use-grouping="false"
          :max-fraction-digits="0"
          :max="2000"
          :invalid="!!errores.potencia_cv"
          fluid
        />
        <small v-if="errores.potencia_cv" class="error" id="error-potencia_cv">{{ errores.potencia_cv }}</small>
      </div>

      <div class="campo">
        <label for="combustible">Combustible</label>
        <Select
          input-id="combustible"
          data-campo="combustible"
          v-model="formulario.combustible"
          :options="COMBUSTIBLES"
          option-label="etiqueta"
          option-value="valor"
          placeholder="Elige el combustible"
          :invalid="!!errores.combustible"
          fluid
        />
        <small v-if="errores.combustible" class="error" id="error-combustible">{{ errores.combustible }}</small>
      </div>

      <div class="campo">
        <label for="transmision">Transmisión</label>
        <Select
          input-id="transmision"
          data-campo="transmision"
          v-model="formulario.transmision"
          :options="TRANSMISIONES"
          option-label="etiqueta"
          option-value="valor"
          placeholder="Elige la transmisión"
          :invalid="!!errores.transmision"
          fluid
        />
        <small v-if="errores.transmision" class="error" id="error-transmision">{{ errores.transmision }}</small>
      </div>
    </div>

    <div class="campo">
      <label for="descripcion">Descripción (opcional)</label>
      <Textarea id="descripcion" v-model="formulario.descripcion" :maxlength="MAX_DESCRIPCION" rows="4" auto-resize :invalid="!!errores.descripcion" fluid />
      <small class="ayuda">{{ formulario.descripcion.length }} / {{ MAX_DESCRIPCION }}</small>
      <small v-if="errores.descripcion" class="error" id="error-descripcion">{{ errores.descripcion }}</small>
    </div>

    <div class="campo">
      <label for="equipamiento">Equipamiento (opcional)</label>
      <InputText id="equipamiento" v-model="formulario.equipamiento" placeholder="Separado por comas: Aire acondicionado, Bluetooth" :invalid="!!errores.equipamiento" fluid />
      <small v-if="errores.equipamiento" class="error" id="error-equipamiento">{{ errores.equipamiento }}</small>
    </div>

    <div class="campo interruptor">
      <ToggleSwitch input-id="disponible" data-campo="disponible" v-model="formulario.disponible" />
      <label for="disponible">Disponible para la venta</label>
    </div>

    <Message v-if="errorGeneral" severity="error" :closable="false" role="alert">{{ errorGeneral }}</Message>

    <div class="acciones">
      <Button type="button" label="Cancelar" severity="secondary" outlined :disabled="guardando" @click="emit('cancelar', construirDatos())" />
      <Button type="submit" :label="textoGuardar" icon="pi pi-check" :loading="guardando" :disabled="guardando" />
    </div>
  </form>
</template>

<style scoped>
.formulario {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.rejilla {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1rem;
}
.campo {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}
.interruptor {
  flex-direction: row;
  align-items: center;
  gap: 0.75rem;
}
.error {
  color: var(--p-red-500, #ef4444);
}
.ayuda {
  color: var(--p-text-muted-color, #64748b);
  text-align: right;
}
.acciones {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
}
</style>
