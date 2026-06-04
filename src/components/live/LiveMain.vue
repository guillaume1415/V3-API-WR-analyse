<script setup>
import { storeToRefs } from 'pinia'
import { useLiveStore } from '@/stores/live'
import { fmtDate } from '@/lib/format'
import { racePhaseLabel, raceStatusClass } from '@/lib/liveFormat'
import { useI18n } from 'vue-i18n'
import LoadingSpinner from '@/components/shared/LoadingSpinner.vue'
import LiveTrackerPanel from './LiveTrackerPanel.vue'

const store = useLiveStore()
const {
  error,
  loadingComps,
  competitions,
  searched,
  selectedComp,
  selectedRace,
  loadingRaces,
  races,
  raceClasses,
  classFilter,
  racesByDate,
  loadingTracker,
  trackerData,
  year,
  category,
} = storeToRefs(store)

const { t, locale } = useI18n()
</script>

<template>
  <div
    v-if="error"
    class="error-box"
  >
    <strong>{{ t('err_label') }}</strong> — {{ error }}
  </div>

  <LoadingSpinner
    v-else-if="loadingComps"
    :message="t('searching')"
  />

  <div
    v-else-if="!searched"
    class="empty"
  >
    {{ t('welcome_live') }}
  </div>

  <div
    v-else-if="!competitions.length"
    class="empty"
  >
    {{ t('no_comps') }}
  </div>

  <template v-else-if="!selectedComp">
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

  <template v-else-if="!selectedRace">
    <div class="breadcrumb">
      <button
        type="button"
        @click="store.backToComps()"
      >
        {{ t('breadcrumb_comps') }}
      </button>
      <span class="sep">›</span>
      <span>{{ selectedComp.DisplayName || '' }}</span>
    </div>

    <LoadingSpinner
      v-if="loadingRaces"
      :message="t('loading_races')"
    />

    <div
      v-else-if="!races.length"
      class="empty"
    >
      {{ t('no_races') }}
    </div>

    <template v-else>
      <div>
        <div class="section-title">
          {{ t('races_count_live', { n: races.length }) }}
        </div>
      </div>

      <div
        v-if="raceClasses.length > 1"
        class="class-filters"
      >
        <div
          class="pill"
          :class="{ active: !classFilter }"
          @click="store.setClassFilter(null)"
        >
          {{ t('all') }}
        </div>
        <div
          v-for="c in raceClasses"
          :key="c"
          class="pill"
          :class="{ active: classFilter === c }"
          @click="store.setClassFilter(c)"
        >
          {{ c }}
        </div>
      </div>

      <div class="race-list">
        <template
          v-for="date in Object.keys(racesByDate).sort()"
          :key="date"
        >
          <div class="group-label">
            {{ fmtDate(date, locale) }}
          </div>
          <div
            v-for="r in racesByDate[date]"
            :key="r.id"
            class="race-item"
            @click="store.selectRace(r.id)"
          >
            <span class="race-item-name">
              {{ r.event?.boatClass?.DisplayName || '' }} · {{ racePhaseLabel(r) }}
            </span>
            <span class="race-item-meta">{{ (r.DateString || '').slice(11, 16) }}</span>
            <span
              class="badge"
              :class="raceStatusClass(r.raceStatus?.DisplayName || '')"
            >
              {{ r.raceStatus?.DisplayName || '—' }}
            </span>
          </div>
        </template>
      </div>
    </template>
  </template>

  <template v-else>
    <div class="breadcrumb">
      <button
        type="button"
        @click="store.backToComps()"
      >
        {{ t('breadcrumb_comps') }}
      </button>
      <span class="sep">›</span>
      <button
        type="button"
        @click="store.backToRaces()"
      >
        {{ selectedComp.DisplayName || '' }}
      </button>
      <span class="sep">›</span>
      <span>{{ selectedRace.DisplayName || '' }}</span>
    </div>

    <LoadingSpinner
      v-if="loadingTracker && !trackerData"
      :message="t('loading_tracker')"
    />

    <div
      v-else-if="!trackerData?.config"
      class="error-box"
    >
      {{ t('no_live_data') }}
    </div>

    <LiveTrackerPanel v-else />
  </template>
</template>
