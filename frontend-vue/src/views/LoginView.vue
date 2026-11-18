<script setup>
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import InputText from 'primevue/inputtext'
import Password from 'primevue/password'
import Button from 'primevue/button'
import Message from 'primevue/message'
import { loginSchema } from '../servicios/validation/usuario.js'
import { useSesionStore } from '../stores/sesion.js'
import { useNotificaciones } from '../composables/useNotificaciones.js'
import { mensajeDeError } from '../utils/errores.js'

const sesion = useSesionStore()
const router = useRouter()
const route = useRoute()
const notificaciones = useNotificaciones()

const formulario = reactive({ email: '', password: '' })
const errores = ref({}) // mensaje de validación de cada campo
const errorGeneral = ref('') // fallo devuelto por el servidor (credenciales, red...)

// Solo se admite volver a una dirección interna de la aplicación
function destinoTrasLogin() {
  const destino = route.query.redirect
  return typeof destino === 'string' && destino.startsWith('/') && !destino.startsWith('//') ? destino : { name: 'listado' }
}

async function enviar() {
  errorGeneral.value = ''
  const resultado = loginSchema.safeParse(formulario)
  if (!resultado.success) {
    errores.value = {}
    for (const problema of resultado.error.issues) errores.value[problema.path[0]] ??= problema.message
    return
  }
  errores.value = {}

  try {
    await sesion.entrar(resultado.data.email, resultado.data.password)
    notificaciones.exito('Sesión iniciada', `Bienvenido, ${sesion.nombre}`)
    router.push(destinoTrasLogin())
  } catch (error) {
    errorGeneral.value = mensajeDeError(error)
  }
}
</script>

<template>
  <section class="login">
    <h2>Iniciar sesión</h2>
    <form novalidate @submit.prevent="enviar">
      <div class="campo">
        <label for="email">Email</label>
        <InputText id="email" v-model="formulario.email" type="email" autocomplete="email" :invalid="!!errores.email" fluid />
        <small v-if="errores.email" class="error" id="error-email">{{ errores.email }}</small>
      </div>

      <div class="campo">
        <label for="password">Contraseña</label>
        <Password
          input-id="password"
          v-model="formulario.password"
          :feedback="false"
          toggle-mask
          autocomplete="current-password"
          :invalid="!!errores.password"
          fluid
        />
        <small v-if="errores.password" class="error" id="error-password">{{ errores.password }}</small>
      </div>

      <Message v-if="errorGeneral" severity="error" :closable="false">{{ errorGeneral }}</Message>

      <Button type="submit" label="Entrar" icon="pi pi-sign-in" :loading="sesion.cargando" :disabled="sesion.cargando" />
    </form>
    <p class="alternativa">¿No tienes cuenta? <RouterLink :to="{ name: 'registro' }">Regístrate</RouterLink></p>
  </section>
</template>

<style scoped>
.login {
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
