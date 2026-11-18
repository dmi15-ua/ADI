<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import InputText from 'primevue/inputtext'
import Password from 'primevue/password'
import Button from 'primevue/button'
import Message from 'primevue/message'
import { registroSchema } from '../servicios/validation/usuario.js'
import { useSesionStore } from '../stores/sesion.js'
import { useNotificaciones } from '../composables/useNotificaciones.js'
import { mensajeDeError } from '../utils/errores.js'

const sesion = useSesionStore()
const router = useRouter()
const notificaciones = useNotificaciones()

const formulario = reactive({ nombre: '', email: '', password: '', repetir: '', telefono: '' })
const errores = ref({})
const errorGeneral = ref('')
const pendienteDeConfirmar = ref(false) // la cuenta se ha creado pero hay que confirmar el email

async function enviar() {
  errorGeneral.value = ''
  errores.value = {}

  // Las mismas reglas que aplica el backend (esquema de la capa de servicios) más la repetición de la contraseña
  const datos = {
    nombre: formulario.nombre,
    email: formulario.email,
    password: formulario.password,
    telefono: formulario.telefono.trim() || undefined // el teléfono es opcional
  }
  const resultado = registroSchema.safeParse(datos)
  if (!resultado.success) {
    for (const problema of resultado.error.issues) errores.value[problema.path[0]] ??= problema.message
  }
  if (formulario.repetir !== formulario.password) errores.value.repetir = 'Las contraseñas no coinciden'
  if (Object.keys(errores.value).length > 0) return

  try {
    const dentro = await sesion.registrarse(resultado.data)
    if (dentro) {
      notificaciones.exito('Cuenta creada', `Bienvenido, ${sesion.nombre}`)
      router.push({ name: 'listado' })
    } else {
      pendienteDeConfirmar.value = true
    }
  } catch (error) {
    errorGeneral.value = mensajeDeError(error)
  }
}
</script>

<template>
  <section class="registro">
    <h2>Crear cuenta</h2>

    <Message v-if="pendienteDeConfirmar" severity="success" :closable="false">
      Cuenta creada. Te hemos enviado un correo para confirmar tu email; después podrás
      <RouterLink :to="{ name: 'login' }">iniciar sesión</RouterLink>.
    </Message>

    <form v-else novalidate @submit.prevent="enviar">
      <div class="campo">
        <label for="nombre">Nombre</label>
        <InputText id="nombre" v-model="formulario.nombre" autocomplete="name" :invalid="!!errores.nombre" fluid />
        <small v-if="errores.nombre" class="error" id="error-nombre">{{ errores.nombre }}</small>
      </div>

      <div class="campo">
        <label for="email">Email</label>
        <InputText id="email" v-model="formulario.email" type="email" autocomplete="email" :invalid="!!errores.email" fluid />
        <small v-if="errores.email" class="error" id="error-email">{{ errores.email }}</small>
      </div>

      <div class="campo">
        <label for="password">Contraseña (mínimo 8 caracteres)</label>
        <Password input-id="password" v-model="formulario.password" :feedback="false" toggle-mask autocomplete="new-password" :invalid="!!errores.password" fluid />
        <small v-if="errores.password" class="error" id="error-password">{{ errores.password }}</small>
      </div>

      <div class="campo">
        <label for="repetir">Repite la contraseña</label>
        <Password input-id="repetir" v-model="formulario.repetir" :feedback="false" toggle-mask autocomplete="new-password" :invalid="!!errores.repetir" fluid />
        <small v-if="errores.repetir" class="error" id="error-repetir">{{ errores.repetir }}</small>
      </div>

      <div class="campo">
        <label for="telefono">Teléfono (opcional)</label>
        <InputText id="telefono" v-model="formulario.telefono" type="tel" autocomplete="tel" :invalid="!!errores.telefono" fluid />
        <small v-if="errores.telefono" class="error" id="error-telefono">{{ errores.telefono }}</small>
      </div>

      <Message v-if="errorGeneral" severity="error" :closable="false">{{ errorGeneral }}</Message>

      <Button type="submit" label="Crear cuenta" icon="pi pi-user-plus" :loading="sesion.cargando" :disabled="sesion.cargando" />
    </form>

    <p class="alternativa">¿Ya tienes cuenta? <RouterLink :to="{ name: 'login' }">Inicia sesión</RouterLink></p>
  </section>
</template>

<style scoped>
.registro {
  max-width: 420px;
  margin: 2rem auto;
}
form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.campo {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}
.error {
  color: var(--p-red-500, #ef4444);
}
.alternativa {
  margin-top: 1.5rem;
  text-align: center;
}
</style>
