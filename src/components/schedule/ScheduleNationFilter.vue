<script setup>
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useScheduleStore } from '@/stores/schedule'
import { useAppStore } from '@/stores/app'
import { useI18n } from 'vue-i18n'

const store = useScheduleStore()
const app = useAppStore()
const { favoriteNation, favRecents } = storeToRefs(app)
const {
  nationPanelOpen,
  nationSearch,
  nationFilter,
  loadingEntries,
  entriesLoaded,
  nations,
} = storeToRefs(store)
const { t } = useI18n()

const fav = computed(() => favoriteNation.value || null)
const recents = computed(() =>
  favRecents.value.filter((n) => n !== fav.value).slice(0, 5),
)

const toggleLabel = computed(() =>
  nationFilter.value
    ? t('filter_nation_btn_active', { nation: nationFilter.value })
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
      :class="{ open: nationPanelOpen }"
      @click="store.toggleNationPanel()"
    >
      <span>{{ toggleLabel }}</span>
      <span class="chevron">▶</span>
    </button>

    <div
      v-if="nationPanelOpen"
      class="collapsible-body"
    >
      <div
        v-if="loadingEntries"
        class="entries-loading"
      >
        <div class="spinner spinner-sm" />
        {{ t('loading') }}
      </div>

      <template v-else>
        <input
          v-model="nationSearch"
          class="nation-search"
          type="text"
          :placeholder="`🔍 ${t('search_nation')}`"
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
              @click="store.setNation(fav)"
            >{{ fav }}</span>
            <button
              type="button"
              class="fav-clear"
              :title="t('fav_remove')"
              @click="store.toggleFavNation(fav)"
            >
              ✕
            </button>
          </div>
          <div
            v-if="recents.length"
            class="fav-recents"
          >
            <span>🕐 {{ t('recents_label') }}</span>
            <span
              v-for="n in recents"
              :key="n"
              class="recent-chip"
              @click="store.setNation(n)"
            >{{ n }}</span>
          </div>
        </div>

        <div class="pills nation-pills-scroll">
          <div
            class="pill"
            :class="{ active: !nationFilter }"
            @click="store.setNation(null)"
          >
            {{ t('all') }}
          </div>
          <div
            v-for="n in nations"
            :key="n"
            class="pill nation-pill"
            :class="{ active: nationFilter === n }"
            @click="store.setNation(n)"
          >
            <button
              type="button"
              class="fav-star"
              :class="{ 'is-fav': fav === n }"
              :title="fav === n ? t('fav_remove') : t('fav_add')"
              @click="onStarClick($event, n)"
            >
              {{ fav === n ? '★' : '☆' }}
            </button>
            <span>{{ n }}</span>
          </div>
        </div>

        <div
          v-if="nationFilter"
          class="nation-active-hint"
        >
          {{ t('sched_filter_active') }}
          <strong>{{ nationFilter }}</strong>
          <span
            style="cursor: pointer; margin-left: 4px; color: var(--text-muted)"
            @click="store.setNation(null)"
          >✕</span>
        </div>
      </template>
    </div>
  </div>
</template>
