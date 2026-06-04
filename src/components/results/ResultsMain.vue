<script setup>
import { storeToRefs } from 'pinia'
import { useResultsStore } from '@/stores/results'
import { useI18n } from 'vue-i18n'
import ResultsCompGrid from './ResultsCompGrid.vue'
import ResultsRaceList from './ResultsRaceList.vue'
import ResultsEntriesList from './ResultsEntriesList.vue'
import LoadingSpinner from '@/components/shared/LoadingSpinner.vue'

const store = useResultsStore()
const {
  error,
  loadingComps,
  competitions,
  searched,
  selectedComp,
  compTab,
} = storeToRefs(store)
const { t } = useI18n()
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
    v-else-if="!competitions.length"
    class="empty"
  >
    {{ searched ? t('no_comps') : t('welcome_results') }}
  </div>

  <template v-else>
    <ResultsCompGrid />

    <template v-if="selectedComp">
      <hr>
      <div class="breadcrumb">
        <button
          type="button"
          @click="store.clearSelection()"
        >
          {{ t('breadcrumb_comps') }}
        </button>
        <span class="sep">›</span>
        <span>{{ selectedComp.DisplayName || selectedComp.id }}</span>
      </div>

      <div class="tabs">
        <button
          type="button"
          class="tab"
          :class="{ active: compTab === 'races' }"
          @click="store.setCompTab('races')"
        >
          {{ t('tab_races') }}
        </button>
        <button
          type="button"
          class="tab"
          :class="{ active: compTab === 'entries' }"
          @click="store.setCompTab('entries')"
        >
          {{ t('tab_entries') }}
        </button>
      </div>

      <ResultsRaceList v-if="compTab === 'races'" />
      <ResultsEntriesList v-else />
    </template>
  </template>
</template>
