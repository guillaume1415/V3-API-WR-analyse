<script setup>
import { computed, onMounted, onUnmounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useScheduleStore } from '@/stores/schedule'
import { fmtDate, fmtDay } from '@/lib/format'
import { useI18n } from 'vue-i18n'
import ScheduleRaceCard from './ScheduleRaceCard.vue'
import ScheduleNationFilter from './ScheduleNationFilter.vue'
import LoadingSpinner from '@/components/shared/LoadingSpinner.vue'

const store = useScheduleStore()
const {
  selectedComp,
  loadingRaces,
  races,
  dayFilter,
  phaseFilter,
  classFilter,
  days,
  phases,
  classes,
  racesByDay,
  statusCounts,
  filteredRaces,
  searched,
} = storeToRefs(store)

const { t, locale } = useI18n()

const sortedDays = computed(() => Object.keys(racesByDay.value).sort())

const statusLabels = computed(() => ({
  official: locale.value === 'fr' ? 'Officiel' : 'Official',
  scheduled: locale.value === 'fr' ? 'Prévu' : 'Scheduled',
  cancelled: locale.value === 'fr' ? 'Annulé' : 'Cancelled',
}))
</script>

<template>
  <LoadingSpinner
    v-if="loadingRaces"
    :message="t('loading_schedule')"
  />

  <div
    v-else-if="!selectedComp"
    class="empty"
  >
    {{ searched ? t('pick_comp') : t('welcome_schedule') }}
  </div>

  <div
    v-else-if="!races.length"
    class="empty"
  >
    {{ t('no_race') }}
  </div>

  <template v-else>
    <div>
      <div class="comp-header-title">
        {{ selectedComp.DisplayName || '' }}
      </div>
      <div class="comp-header-meta">
        {{ selectedComp.venue?.DisplayName || '' }}
        <template v-if="selectedComp.venue?.DisplayName"> · </template>
        {{ fmtDate(selectedComp.StartDate, locale) }} → {{ fmtDate(selectedComp.EndDate, locale) }}
      </div>
    </div>

    <div class="summary-bar">
      <div
        class="summary-item"
        v-html="t('sched_n_races', { n: `<strong>${statusCounts.total}</strong>` })"
      />
      <div
        v-if="statusCounts.official"
        class="summary-item"
      >
        <span class="badge badge-official">{{ statusLabels.official }}</span>
        {{ statusCounts.official }}
      </div>
      <div
        v-if="statusCounts.startList"
        class="summary-item"
      >
        <span class="badge badge-startlist">Start List</span>
        {{ statusCounts.startList }}
      </div>
      <div
        v-if="statusCounts.scheduled"
        class="summary-item"
      >
        <span class="badge badge-scheduled">{{ statusLabels.scheduled }}</span>
        {{ statusCounts.scheduled }}
      </div>
      <div
        v-if="statusCounts.cancelled"
        class="summary-item"
      >
        <span class="badge badge-cancelled">{{ statusLabels.cancelled }}</span>
        {{ statusCounts.cancelled }}
      </div>
    </div>

    <div>
      <div
        class="section-title"
        style="margin-bottom: 6px"
      >
        {{ t('filter_day') }}
      </div>
      <div class="day-tabs">
        <div
          class="day-tab"
          :class="{ active: !dayFilter }"
          @click="dayFilter = null"
        >
          {{ t('all') }}
        </div>
        <div
          v-for="d in days"
          :key="d"
          class="day-tab"
          :class="{ active: dayFilter === d }"
          @click="dayFilter = d"
        >
          {{ fmtDay(`${d}T00:00:00`, locale) }}
        </div>
      </div>
    </div>

    <div>
      <div
        class="section-title"
        style="margin-bottom: 6px"
      >
        {{ t('filter_phase') }}
      </div>
      <div class="pills">
        <div
          class="pill"
          :class="{ active: !phaseFilter }"
          @click="phaseFilter = null"
        >
          {{ t('all') }}
        </div>
        <div
          v-for="p in phases"
          :key="p"
          class="pill"
          :class="{ active: phaseFilter === p }"
          @click="phaseFilter = p"
        >
          {{ p }}
        </div>
      </div>
    </div>

    <div>
      <div
        class="section-title"
        style="margin-bottom: 6px"
      >
        {{ t('filter_class') }}
      </div>
      <div class="pills">
        <div
          class="pill"
          :class="{ active: !classFilter }"
          @click="classFilter = null"
        >
          {{ t('all') }}
        </div>
        <div
          v-for="c in classes"
          :key="c"
          class="pill"
          :class="{ active: classFilter === c }"
          @click="classFilter = c"
        >
          {{ c }}
        </div>
      </div>
    </div>

    <ScheduleNationFilter />

    <div
      v-if="!filteredRaces.length"
      class="empty"
    >
      {{ t('sched_no_for_filter') }}
    </div>

    <template v-else>
      <div
        v-for="day in sortedDays"
        :key="day"
      >
        <div class="day-header">
          📅 {{ fmtDay(`${day}T12:00:00`, locale) }} —
          {{ t('sched_n_races', { n: racesByDay[day].length }) }}
        </div>
        <div class="race-list">
          <ScheduleRaceCard
            v-for="race in racesByDay[day]"
            :key="race.id"
            :race="race"
            @open="store.openStartList"
          />
        </div>
      </div>
    </template>
  </template>
</template>
