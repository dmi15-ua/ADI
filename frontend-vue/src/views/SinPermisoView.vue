<script setup>
</script>

<template>
  <section class="sin-permiso">
    <h2>No tienes permiso</h2>
    <p>Esta pantalla es solo para administradores.</p>
    <RouterLink :to="{ name: 'listado' }">Volver al listado de coches</RouterLink>
  </section>
</template>
