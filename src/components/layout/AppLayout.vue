<script setup>
import AppHeader from './AppHeader.vue'
import AppSidebar from './AppSidebar.vue'

defineProps({
  showSidebar: { type: Boolean, default: false },
})
</script>

<template>
  <AppHeader />
  <div class="layout">
    <AppSidebar v-if="showSidebar">
      <slot name="sidebar" />
    </AppSidebar>
    <main>
      <slot />
    </main>
  </div>
</template>
