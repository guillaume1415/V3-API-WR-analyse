<script setup>
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useResultsStore } from '@/stores/results'
import { useAppStore } from '@/stores/app'
import { useI18n } from 'vue-i18n'

const store = useResultsStore()
const app = useAppStore()
const { favoriteNation, favRecents } = storeToRefs(app)
const {
  raceNationPanelOpen,
  raceNationSearch,
  raceNationFilter,
  entries,
  loadingEntries,
  nations,
} = storeToRefs(store)
const { t } = useI18n()

const hasEntries = computed(() => entries.value.length > 0)
const fav = computed(() => favoriteNation.value || null)
/** 5 derniers clics (plus récent à gauche), hors favori */
const recents = computed(() =>
  favRecents.value.filter((n) => n !== fav.value).slice(0, 5),
)

const toggleLabel = computed(() =>
  raceNationFilter.value && hasEntries.value
    ? t('filter_nation_btn_active', { nation: raceNationFilter.value })
    : t('filter_nation_btn'),
)

function onStarClick(e, nation) {
  e.stopPropagation()
  store.toggleFavNation(nation)
}
</script>

<template>
  <div class="collapsible-panel">
    <button
      type="button"
      class="collapsible-toggle"
      :class="{ open: raceNationPanelOpen }"
      @click="store.toggleNationPanel()"
    >
      <span>{{ toggleLabel }}</span>
      <span class="chevron">▶</span>
    </button>
    <div
      v-if="raceNationPanelOpen"
      class="collapsible-body"
    >
      <div
        v-if="!hasEntries"
        style="font-size: 0.78rem; color: var(--text-muted); line-height: 1.55"
      >
        {{ t('filter_load_first', { link: '' }) }}
        <button
          type="button"
          style="color: var(--accent); background: none; border: none; cursor: pointer; font: inherit; padding: 0"
          @click="store.setCompTab('entries')"
        >
          {{ t('tab_entries') }}
        </button>
      </div>
      <template v-else>
        <input
          v-model="raceNationSearch"
          class="nation-search"
          type="text"
          :placeholder="t('search_nation')"
        >
        <div
          v-if="fav || recents.length"
          class="fav-section"
        >
          <div
            v-if="fav"
            class="fav-current"
          >
            <span class="star">★</span>
            <span>{{ t('fav_label') }}</span>
            <span
              class="nation-name"
              @click="store.setRaceNation(fav)"
            >{{ fav }}</span>
            <button
              type="button"
              class="fav-clear"
              @click="store.toggleFavNation(fav)"
            >
              ✕
            </button>
          </div>
          <div
            v-if="recents.length"
            class="fav-recents"
            style="display: flex; flex-wrap: wrap; gap: 4px; font-size: 0.75rem; color: var(--text-muted)"
          >
            <span>🕐 {{ t('recents_label') }}</span>
            <span
              v-for="n in recents"
              :key="n"
              class="recent-chip"
              @click="store.setRaceNation(n)"
            >{{ n }}</span>
          </div>
        </div>
        <div
          class="class-filters"
          style="padding: 0; max-height: 200px; overflow-y: auto; gap: 5px"
        >
          <div
            class="pill"
            :class="{ active: !raceNationFilter }"
            @click="store.setRaceNation(null)"
          >
            {{ t('all') }}
          </div>
          <div
            v-for="n in nations"
            :key="n"
            class="pill nation-pill"
            :class="{ active: raceNationFilter === n }"
            @click="store.setRaceNation(n)"
          >
            <button
              type="button"
              class="fav-star"
              :class="{ 'is-fav': fav === n }"
              @click="onStarClick($event, n)"
            >
              {{ fav === n ? '★' : '☆' }}
            </button>
            <span>{{ n }}</span>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>
