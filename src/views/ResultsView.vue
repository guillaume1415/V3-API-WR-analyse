<script setup>
import { onMounted, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useAppStore } from '@/stores/app'
import { useResultsStore } from '@/stores/results'
import { usePolling } from '@/composables/usePolling'
import ResultsSidebar from '@/components/results/ResultsSidebar.vue'
import ResultsMain from '@/components/results/ResultsMain.vue'
import CompareLayout from '@/components/compare/CompareLayout.vue'
import '@/assets/styles/results.css'

const app = useAppStore()
const results = useResultsStore()
const { compareMode } = storeToRefs(app)

const POLL_MS = 30_000

results.initFromSavedComp()

usePolling(() => {
  if (!compareMode.value) results.refreshAll()
}, POLL_MS)

onMounted(() => {
  if (!compareMode.value) results.search()
})

watch(compareMode, (on) => {
  if (!on && !results.searched) results.search()
})
</script>

<template>
  <CompareLayout v-if="compareMode" />
  <div
    v-else
    class="results-page"
  >
    <aside class="results-sidebar">
      <ResultsSidebar />
    </aside>
    <section class="results-main">
      <ResultsMain />
    </section>
  </div>
</template>
