<script setup>
import { useRouter } from 'vue-router'
import Menubar from 'primevue/menubar'
import Button from 'primevue/button'
import Toast from 'primevue/toast'
import ConfirmDialog from 'primevue/confirmdialog'

const router = useRouter()

// Opciones del menú principal. En la iteración 11 se añadirá la zona de sesión.
const opciones = [{ label: 'Coches', to: { name: 'listado' } }]
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
        <Button label="Iniciar sesión" icon="pi pi-sign-in" size="small" @click="router.push({ name: 'login' })" />
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
