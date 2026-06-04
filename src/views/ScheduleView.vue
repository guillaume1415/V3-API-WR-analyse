<script setup>
import { onMounted } from 'vue'
import { useScheduleStore } from '@/stores/schedule'
import { usePolling } from '@/composables/usePolling'
import ScheduleSidebar from '@/components/schedule/ScheduleSidebar.vue'
import ScheduleMain from '@/components/schedule/ScheduleMain.vue'
import ScheduleStartListModal from '@/components/schedule/ScheduleStartListModal.vue'
import '@/assets/styles/schedule.css'

const store = useScheduleStore()
const POLL_MS = 30_000

store.initFromSavedComp()

usePolling(() => store.refreshRaces(), POLL_MS)

onMounted(() => {
  store.search()
})
</script>

<template>
  <div class="schedule-page">
    <aside class="schedule-sidebar">
      <ScheduleSidebar />
    </aside>
    <section class="schedule-main">
      <ScheduleMain />
    </section>
    <ScheduleStartListModal />
  </div>
</template>
