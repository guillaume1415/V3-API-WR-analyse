<script setup>
import { storeToRefs } from 'pinia'
import { useResultsStore } from '@/stores/results'
import { fmtDate } from '@/lib/format'
import { useI18n } from 'vue-i18n'

const store = useResultsStore()
const { competitions, selectedComp, year, category } = storeToRefs(store)
const { t, locale } = useI18n()
</script>

<template>
  <div>
    <div class="section-title">
      {{ t('comps_label', { year, cat: category }) }}
    </div>
    <div style="font-size: 0.78rem; color: var(--text-muted); margin-top: 2px">
      {{ t('comps_count', { n: competitions.length }) }}
    </div>
  </div>
  <div class="cards-grid">
    <div
      v-for="c in competitions"
      :key="c.id"
      class="card"
      :class="{ active: selectedComp?.id === c.id }"
      @click="store.selectComp(c.id)"
    >
      <div class="card-title">
        {{ c.DisplayName || c.CompetitionCode || c.id }}
      </div>
      <div class="card-meta">
        <span>📍 {{ c.venue?.DisplayName || '—' }}<template v-if="c.venue?.country?.DisplayName">, {{ c.venue.country.DisplayName }}</template></span>
        <span>📅 {{ fmtDate(c.StartDate, locale) }}<template v-if="fmtDate(c.EndDate, locale) !== fmtDate(c.StartDate, locale)"> → {{ fmtDate(c.EndDate, locale) }}</template></span>
      </div>
    </div>
  </div>
</template>
