<script setup>
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useCompareStore } from '@/stores/compare'
import { yearOptions } from '@/lib/competitions'
import { useI18n } from 'vue-i18n'
import LoadingSpinner from '@/components/shared/LoadingSpinner.vue'

const props = defineProps({
  slotKey: { type: String, required: true },
  labelKey: { type: String, required: true },
})

const compare = useCompareStore()
const { slotA, slotB } = storeToRefs(compare)
const slot = computed(() => (props.slotKey === 'a' ? slotA.value : slotB.value))
const { t } = useI18n()
const years = yearOptions()
const activeClass = computed(() => (props.slotKey === 'a' ? 'active-a' : 'active-b'))
</script>

<template>
  <div
    class="cmp-selector"
    :class="{ 'slot-b': slotKey === 'b' }"
  >
    <div>
      <span
        class="cmp-label"
        :class="slotKey === 'a' ? 'cmp-label-a' : 'cmp-label-b'"
      >{{ t(labelKey) }}</span>
    </div>

    <div class="filter-group">
      <label>{{ t('lbl_year') }}</label>
      <select v-model.number="slot.year">
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
      <select v-model="slot.category">
        <option
          v-for="cat in compare.categories"
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
      @click="compare.searchSlot(slotKey)"
    >
      {{ t('btn_search') }}
    </button>

    <LoadingSpinner
      v-if="slot.loading"
      style="padding: 20px 0"
    />

    <div
      v-else-if="slot.searched && !slot.competitions.length"
      class="empty"
      style="padding: 12px 0; font-size: 0.8rem"
    >
      {{ t('cmp_no_comp') }}
    </div>

    <template v-else>
      <div
        v-for="c in slot.competitions"
        :key="c.id"
        class="cmp-comp-card"
        :class="{ [activeClass]: slot.selected?.id === c.id }"
        @click="compare.selectComp(slotKey, c.id)"
      >
        <div style="font-weight: 600; font-size: 0.84rem">
          {{ c.DisplayName || c.CompetitionCode || c.id }}
        </div>
        <div
          v-if="c.venue?.DisplayName"
          style="font-size: 0.74rem; color: var(--text-muted)"
        >
          📍 {{ c.venue.DisplayName }}
        </div>
      </div>

      <LoadingSpinner
        v-if="slot.loadingEntries"
        :message="t('loading_entries')"
        style="padding: 12px 0"
      />
      <div
        v-else-if="slot.selected && slot.entries.length"
        style="font-size: 0.75rem; color: var(--green); padding: 4px 0"
      >
        {{ t('cmp_loaded', { n: slot.entries.length }) }}
      </div>
    </template>
  </div>
</template>
