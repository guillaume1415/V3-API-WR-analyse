import { onMounted, onUnmounted, ref } from 'vue'

export function usePolling(callback, intervalMs, { immediate = true } = {}) {
  const active = ref(false)
  let timer = null

  async function tick() {
    await callback()
  }

  function start() {
    stop()
    active.value = true
    timer = setInterval(tick, intervalMs)
    if (immediate) tick()
  }

  function stop() {
    if (timer) {
      clearInterval(timer)
      timer = null
    }
    active.value = false
  }

  onMounted(start)
  onUnmounted(stop)

  return { start, stop, active }
}
