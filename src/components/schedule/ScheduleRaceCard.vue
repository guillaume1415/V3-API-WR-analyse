<script setup>
import { phaseBadgeClass, statusBadgeClass } from '@/lib/schedule'
import { fmtTime } from '@/lib/format'
import { useI18n } from 'vue-i18n'

defineProps({
  race: { type: Object, required: true },
})

defineEmits(['open'])

const { t, locale } = useI18n()
</script>

<template>
  <div
    class="race-card"
    @click="$emit('open', race.id)"
  >
    <div class="race-time">
      {{ fmtTime(race.DateString, locale) }}
      <small>{{ t('sched_local_time') }}</small>
    </div>
    <div
      class="race-nr"
      :title="`Race ${race.RaceNr || '—'}`"
    >
      {{ race.RaceNr || '—' }}
    </div>
    <div class="race-info">
      <div
        class="race-name"
        :title="race.RscCode || ''"
      >
        {{ race.DisplayName || race.id }}
      </div>
      <div class="race-tags">
        <span class="badge badge-class">{{ race.event?.boatClass?.DisplayName || '—' }}</span>
        <span
          class="badge"
          :class="phaseBadgeClass(race.racePhase?.DisplayName)"
        >
          {{ race.racePhase?.DisplayName || '—' }}
        </span>
        <span
          class="badge"
          :class="statusBadgeClass(race.raceStatus?.DisplayName)"
        >
          {{ race.raceStatus?.DisplayName || '—' }}
        </span>
      </div>
    </div>
    <div style="font-size: 0.7rem; color: var(--text-muted); flex-shrink: 0">
      👁
    </div>
  </div>
</template>
