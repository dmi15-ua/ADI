<script setup>
import { useRouter } from 'vue-router'
import Menubar from 'primevue/menubar'
import Toast from 'primevue/toast'
import ConfirmDialog from 'primevue/confirmdialog'
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import ProgressSpinner from 'primevue/progressspinner'
import { useSesionStore } from './stores/sesion.js'
import { useNotificaciones } from './composables/useNotificaciones.js'
import { mensajeDeError } from './utils/errores.js'

const router = useRouter()
const sesion = useSesionStore()
const notificaciones = useNotificaciones()

const opciones = [{ label: 'Coches', to: { name: 'listado' } }]

async function cerrarSesion() {
  try {
    await sesion.salir()
    notificaciones.exito('Sesión cerrada')
  } catch (error) {
    notificaciones.error('No se pudo cerrar la sesión en el servidor', mensajeDeError(error))
  }
  // Al salir se vuelve a una pantalla pública, para no dejar visible nada que sea solo de administradores
  router.push({ name: 'listado' })
}
</script>

<template>
  <header>
    <Menubar :model="opciones">
      <template #start>
        <RouterLink :to="{ name: 'listado' }" class="marca">Concesionario</RouterLink>
      </template>
      <template #item="{ item, props }">
        <RouterLink :to="item.to" v-bind="props.action">{{ item.label }}</RouterLink>
      </template>
      <template #end>
        <div class="zona-sesion">
          <ProgressSpinner v-if="!sesion.iniciada" class="comprobando" aria-label="Comprobando la sesión" />
          <template v-else-if="sesion.autenticado">
            <span class="usuario">{{ sesion.nombre }}</span>
            <Tag v-if="sesion.esAdmin" value="Admin" severity="success" />
            <Button label="Cerrar sesión" icon="pi pi-sign-out" size="small" severity="secondary" @click="cerrarSesion" />
          </template>
          <template v-else>
            <Button label="Registrarse" size="small" severity="secondary" outlined @click="router.push({ name: 'registro' })" />
            <Button label="Iniciar sesión" icon="pi pi-sign-in" size="small" @click="router.push({ name: 'login' })" />
          </template>
        </div>
      </template>
    </Menubar>
  </header>

  <main class="contenedor">
    <RouterView />
  </main>

  <!-- Contenedores globales: avisos y diálogos de confirmación -->
  <Toast position="top-right" />
  <ConfirmDialog />
</template>

<style scoped>
.zona-sesion {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}
.comprobando {
  width: 1.5rem;
  height: 1.5rem;
}
</style>
