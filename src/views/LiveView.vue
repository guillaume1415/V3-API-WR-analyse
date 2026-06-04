<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const welcomeKey = computed(() => route.meta.welcomeKey || 'welcome')
</script>

<template>
  <div class="empty">
    {{ $t(welcomeKey) }}
  </div>
</template>
