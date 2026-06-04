<script setup>
import { storeToRefs } from 'pinia'
import { useScheduleStore } from '@/stores/schedule'
import { COMPETITION_CATEGORIES, yearOptions } from '@/lib/competitions'
import { fmtDate } from '@/lib/format'
import { useI18n } from 'vue-i18n'

const store = useScheduleStore()
const { year, category, competitions, loadingComps, searched, selectedComp } = storeToRefs(store)
const { t, locale } = useI18n()

const years = yearOptions()

function compName(c) {
  return c.DisplayName || c.CompetitionCode || c.id
}
</script>

<template>
  <div class="filter-group">
    <label>{{ t('lbl_year') }}</label>
    <select v-model.number="year">
      <option
        v-for="y in years"
        :key="y"
        :value="y"
      >
        {{ y }}
      </option>
    </select>
  </div>

  <div class="filter-group">
    <label>{{ t('lbl_category') }}</label>
    <select v-model="category">
      <option
        v-for="cat in COMPETITION_CATEGORIES"
        :key="cat"
        :value="cat"
      >
        {{ cat }}
      </option>
    </select>
  </div>

  <button
    class="btn"
    type="button"
    :disabled="loadingComps"
    @click="store.search()"
  >
    {{ t('btn_search') }}
  </button>

  <hr v-if="competitions.length || (searched && !competitions.length)">

  <div
    v-if="searched && !competitions.length && !loadingComps"
    class="empty"
    style="padding: 8px 0"
  >
    {{ t('no_comps') }}
  </div>

  <div
    v-if="competitions.length"
    class="comp-list"
  >
    <div
      v-for="c in competitions"
      :key="c.id"
      class="comp-card"
      :class="{ active: selectedComp?.id === c.id }"
      @click="store.selectComp(c.id)"
    >
      <div class="comp-card-name">
        {{ compName(c) }}
      </div>
      <div class="comp-card-meta">
        <template v-if="c.venue?.DisplayName">📍 {{ c.venue.DisplayName }} · </template>
        📅 {{ fmtDate(c.StartDate, locale) }}
        <template v-if="fmtDate(c.EndDate, locale) !== fmtDate(c.StartDate, locale)">
          → {{ fmtDate(c.EndDate, locale) }}
        </template>
      </div>
    </div>
  </div>
</template>
