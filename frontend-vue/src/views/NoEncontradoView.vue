<script setup>
</script>

<template>
  <section class="no-encontrado">
    <h2>Página no encontrada</h2>
    <p>La dirección que has escrito no existe.</p>
    <RouterLink :to="{ name: 'listado' }">Volver al listado de coches</RouterLink>
  </section>
</template>
