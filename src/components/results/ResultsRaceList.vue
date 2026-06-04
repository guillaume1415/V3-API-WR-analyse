<script setup>
import { storeToRefs } from 'pinia'
import { useResultsStore } from '@/stores/results'
import { fmtDate } from '@/lib/format'
import { useI18n } from 'vue-i18n'
import ResultsNationFilter from './ResultsNationFilter.vue'
import RaceDetailPanel from './RaceDetailPanel.vue'
import LoadingSpinner from '@/components/shared/LoadingSpinner.vue'

const store = useResultsStore()
const {
  loadingRaces,
  races,
  classFilter,
  raceClasses,
  sortedRaceGroupKeys,
  raceGroups,
  openRaces,
  filteredRaces,
} = storeToRefs(store)
const { t, locale } = useI18n()

function phaseName(r) {
  return typeof r.racePhase === 'object' ? r.racePhase?.DisplayName : r.racePhase
}
</script>

<template>
  <LoadingSpinner
    v-if="loadingRaces"
    :message="t('loading_races')"
  />

  <div
    v-else-if="!races.length"
    class="empty"
  >
    {{ t('no_official') }}
  </div>

  <div v-else>
    <div
      class="section-title"
      style="margin-bottom: 0"
    >
      {{ t('races_count', { n: races.length }) }}
    </div>

    <div
      v-if="raceClasses.length > 1"
      class="class-filters"
    >
      <div
        class="pill"
        :class="{ active: !classFilter }"
        @click="classFilter = null"
      >
        {{ t('all') }}
      </div>
      <div
        v-for="c in raceClasses"
        :key="c"
        class="pill"
        :class="{ active: classFilter === c }"
        @click="classFilter = c"
      >
        {{ c }}
      </div>
    </div>

    <ResultsNationFilter />

    <div
      class="race-list"
      style="margin-top: 10px"
    >
      <div
        v-if="!filteredRaces.length"
        class="empty"
        style="padding: 24px"
      >
        {{ t('no_race_filter') }}
      </div>

      <template v-else>
        <template
          v-for="cls in sortedRaceGroupKeys"
          :key="cls"
        >
          <div
            v-if="!classFilter"
            class="group-label"
          >
            {{ cls }}
          </div>
          <template
            v-for="r in raceGroups[cls]"
            :key="r.id"
          >
            <div
              class="race-item"
              :class="{ open: openRaces.has(r.id) }"
              @click="store.toggleRaceDetail(r.id)"
            >
              <div class="race-item-name">
                {{ r.DisplayName || r.id }}
              </div>
              <div class="race-item-meta">
                {{ fmtDate(r.Date || r.date, locale) }}
              </div>
              <span class="badge badge-muted">{{ phaseName(r) || '—' }}</span>
              <span class="race-chevron">▼</span>
            </div>
            <div
              v-if="openRaces.has(r.id)"
              class="race-detail-panel"
            >
              <RaceDetailPanel
                :race-state="openRaces.get(r.id)"
                @set-tab="(tab) => store.setRaceTab(r.id, tab)"
              />
            </div>
          </template>
        </template>
      </template>
    </div>
  </div>
</template>
