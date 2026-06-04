<template>
  <div class="loading">
    <div class="spinner" />
    <span v-if="message">{{ message }}</span>
  </div>
</template>

<script setup>
defineProps({
  message: { type: String, default: '' },
})
</script>
