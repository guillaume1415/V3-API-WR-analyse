<script setup>
import { onMounted, onUnmounted, ref, watch } from 'vue'
import Plotly from 'plotly.js-dist-min'
import { useAppStore } from '@/stores/app'
import { plotConfig } from './chartTheme'

const props = defineProps({
  data: { type: Array, default: () => [] },
  layout: { type: Object, default: () => ({}) },
})

const app = useAppStore()
const el = ref(null)
let ro = null

async function render() {
  if (!el.value || !props.data.length) return
  const layout = { ...props.layout, autosize: true }
  await Plotly.react(el.value, props.data, layout, plotConfig)
}

function resize() {
  if (el.value) Plotly.Plots.resize(el.value)
}

onMounted(() => {
  render()
  ro = new ResizeObserver(() => requestAnimationFrame(resize))
  if (el.value) ro.observe(el.value)
})

onUnmounted(() => {
  ro?.disconnect()
  if (el.value) Plotly.purge(el.value)
})

watch(
  () => [props.data, props.layout, app.theme],
  () => render(),
  { deep: true },
)
</script>

<template>
  <div
    ref="el"
    class="plotly-chart"
  />
</template>

<style scoped>
.plotly-chart {
  width: 100%;
  height: 200px;
}

.plotly-chart :deep(.modebar) {
  top: 2px;
  right: 2px;
}
</style>
