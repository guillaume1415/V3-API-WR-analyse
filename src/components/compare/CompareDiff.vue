<script setup>
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useCompareStore } from '@/stores/compare'
import {
  buildDiff,
  buildNationDiff,
  findDuplicateBoats,
  athleteLabelParts,
} from '@/lib/compare'
import { sortAthletes } from '@/lib/athletes'
import { useI18n } from 'vue-i18n'

const compare = useCompareStore()
const { slotA, slotB, diffTab, classFilter, nationFilter } = storeToRefs(compare)
const { t } = useI18n()

const ready = computed(() => slotA.value.entries.length > 0 && slotB.value.entries.length > 0)

const diff = computed(() =>
  ready.value ? buildDiff(slotA.value.entries, slotB.value.entries) : null,
)

const nationDiff = computed(() =>
  ready.value
    ? buildNationDiff(slotA.value.entries, slotB.value.entries, classFilter.value)
    : null,
)

const diffNations = computed(() => {
  if (!diff.value) return []
  return [
    ...new Set(
      diff.value.classes.flatMap((cls) => Object.keys(diff.value.byClass[cls]?.byCountry || {})),
    ),
  ].sort()
})

const filteredClasses = computed(() =>
  classFilter.value ? [classFilter.value] : diff.value?.classes || [],
)

const sortedNationCountries = computed(() => {
  if (!nationDiff.value) return []
  return [...nationDiff.value.countries]
    .filter((c) => !nationFilter.value || c === nationFilter.value)
    .sort((a, b) => {
      const da = nationDiff.value.nations[a].added.length + nationDiff.value.nations[a].removed.length
      const db = nationDiff.value.nations[b].added.length + nationDiff.value.nations[b].removed.length
      return db !== da ? db - da : a.localeCompare(b)
    })
})

function filterDups(entries) {
  return findDuplicateBoats(entries).filter(
    (d) =>
      (!classFilter.value || d.cls === classFilter.value) &&
      (!nationFilter.value || d.country === nationFilter.value),
  )
}

const aDups = computed(() => filterDups(slotA.value.entries))
const bDups = computed(() => filterDups(slotB.value.entries))

function dupCommonIds(boats) {
  const sets = boats.map((boat) => new Set((boat.boatAthletes || []).map((ba) => String(ba.personId))))
  if (!sets.length) return new Set()
  return new Set([...sets[0]].filter((id) => sets.every((s) => s.has(id))))
}
</script>

<template>
  <div class="cmp-diff">
    <div
      v-if="!ready"
      class="empty"
      style="padding: 60px 20px"
    >
      {{
        !slotA.entries.length && !slotB.entries.length
          ? t('cmp_no_pick')
          : t('cmp_waiting', { slot: !slotA.entries.length ? 'A' : 'B' })
      }}
    </div>

    <template v-else>
      <div
        v-if="diffTab !== 'multi'"
        class="cmp-legend"
      >
        <span class="cmp-label cmp-label-a">{{ slotA.selected?.DisplayName || 'A' }}</span>
        <span style="color: var(--text-muted)">vs</span>
        <span class="cmp-label cmp-label-b">{{ slotB.selected?.DisplayName || 'B' }}</span>
        <span class="diff-ath added">{{ t('cmp_legend_added') }}</span>
        <span class="diff-ath removed">{{ t('cmp_legend_removed') }}</span>
        <span class="diff-ath same">{{ t('cmp_legend_same') }}</span>
      </div>

      <div class="tabs">
        <button
          type="button"
          class="tab"
          :class="{ active: diffTab === 'events' }"
          @click="diffTab = 'events'"
        >
          {{ t('cmp_tab_events') }}
        </button>
        <button
          type="button"
          class="tab"
          :class="{ active: diffTab === 'nations' }"
          @click="diffTab = 'nations'"
        >
          {{ t('cmp_tab_nations') }}
        </button>
        <button
          type="button"
          class="tab"
          :class="{ active: diffTab === 'multi' }"
          @click="diffTab = 'multi'"
        >
          {{ t('cmp_tab_multi') }}
        </button>
      </div>

      <div v-if="diff && diff.classes.length > 1">
        <div
          class="section-title"
          style="margin-bottom: 6px"
        >
          {{ t('cmp_filter_class') }}
        </div>
        <div class="class-filters">
          <div
            class="pill"
            :class="{ active: !classFilter }"
            @click="classFilter = null"
          >
            {{ t('all') }}
          </div>
          <div
            v-for="c in diff.classes"
            :key="c"
            class="pill"
            :class="{ active: classFilter === c }"
            @click="classFilter = c"
          >
            {{ c }}
          </div>
        </div>
      </div>

      <div v-if="diffNations.length > 1">
        <div
          class="section-title"
          style="margin-bottom: 6px"
        >
          {{ t('cmp_filter_nation') }}
        </div>
        <div class="class-filters">
          <div
            class="pill"
            :class="{ active: !nationFilter }"
            @click="nationFilter = null"
          >
            {{ t('all') }}
          </div>
          <div
            v-for="n in diffNations"
            :key="n"
            class="pill"
            :class="{ active: nationFilter === n }"
            @click="nationFilter = n"
          >
            {{ n }}
          </div>
        </div>
      </div>

      <!-- Events tab -->
      <template v-if="diffTab === 'events'">
        <div
          v-if="!filteredClasses.length"
          class="empty"
        >
          {{ t('cmp_no_data') }}
        </div>
        <div
          v-for="cls in filteredClasses"
          v-else
          :key="cls"
          class="diff-class-block"
        >
          <div class="diff-class-header">
            {{ cls }}
            <template v-if="diff.byClass[cls]">
              <span
                v-if="
                  diff.byClass[cls].countries.some(
                    (c) =>
                      (!nationFilter || c === nationFilter) &&
                      (diff.byClass[cls].byCountry[c].added.length ||
                        diff.byClass[cls].byCountry[c].removed.length),
                  )
                "
                style="margin-left: auto; display: flex; gap: 4px"
              >
                <span class="diff-ath added">+{{
                  diff.byClass[cls].countries.reduce(
                    (s, c) =>
                      s +
                      (!nationFilter || c === nationFilter
                        ? diff.byClass[cls].byCountry[c].added.length
                        : 0),
                    0,
                  )
                }}</span>
                <span class="diff-ath removed">−{{
                  diff.byClass[cls].countries.reduce(
                    (s, c) =>
                      s +
                      (!nationFilter || c === nationFilter
                        ? diff.byClass[cls].byCountry[c].removed.length
                        : 0),
                    0,
                  )
                }}</span>
              </span>
              <span
                v-else
                style="color: var(--green); font-size: 0.75rem; margin-left: auto"
              >{{ t('cmp_no_change') }}</span>
            </template>
          </div>
          <div
            v-for="country in diff.byClass[cls]?.countries || []"
            :key="country"
          >
            <div
              v-if="!nationFilter || country === nationFilter"
              class="diff-country-row"
            >
              <div class="diff-flag">
                {{ country }}
              </div>
              <div class="diff-athletes">
                <template
                  v-for="a in diff.byClass[cls].byCountry[country].removed"
                  :key="`r-${a.id}`"
                >
                  <span class="diff-ath removed">− {{ athleteLabelParts(a, 'removed').name }}
                    <small v-if="athleteLabelParts(a, 'removed').suffix"> ({{ athleteLabelParts(a, 'removed').suffix }})</small>
                  </span>
                </template>
                <template
                  v-for="a in diff.byClass[cls].byCountry[country].same"
                  :key="`s-${a.id}`"
                >
                  <span class="diff-ath same">= {{ athleteLabelParts(a, 'same').name }}
                    <small v-if="athleteLabelParts(a, 'same').changed"> ({{ a.prevPosition }}→{{ a.position || '?' }})</small>
                    <small v-else-if="athleteLabelParts(a, 'same').suffix"> ({{ athleteLabelParts(a, 'same').suffix }})</small>
                  </span>
                </template>
                <template
                  v-for="a in diff.byClass[cls].byCountry[country].added"
                  :key="`a-${a.id}`"
                >
                  <span class="diff-ath added">+ {{ athleteLabelParts(a, 'added').name }}
                    <small v-if="athleteLabelParts(a, 'added').suffix"> ({{ athleteLabelParts(a, 'added').suffix }})</small>
                  </span>
                </template>
                <span
                  v-if="
                    !diff.byClass[cls].byCountry[country].added.length &&
                      !diff.byClass[cls].byCountry[country].removed.length &&
                      !diff.byClass[cls].byCountry[country].same.length
                  "
                  style="color: var(--text-muted); font-size: 0.75rem"
                >—</span>
              </div>
            </div>
          </div>
        </div>
      </template>

      <!-- Nations tab -->
      <template v-else-if="diffTab === 'nations'">
        <div
          v-if="nationDiff"
          class="cmp-summary"
        >
          <div style="padding: 12px 18px; border-right: 1px solid var(--border)">
            <div style="font-size: 0.7rem; text-transform: uppercase; color: var(--text-muted)">
              {{ t('cmp_total_persons') }}
            </div>
            <div style="font-size: 1.5rem; font-weight: 700">
              {{ nationDiff.totalSame + nationDiff.totalAdded }}
            </div>
            <div style="font-size: 0.72rem; color: var(--text-muted)">
              {{ t('cmp_total_sub') }}
            </div>
          </div>
          <div style="padding: 12px 18px; display: flex; gap: 16px; align-items: center; flex-wrap: wrap">
            <div style="text-align: center">
              <div class="nation-delta-neg">
                −{{ nationDiff.totalRemoved }}
              </div>
              <div style="font-size: 0.72rem; color: var(--text-muted)">
                {{ t('cmp_removed') }}
              </div>
            </div>
            <div style="text-align: center">
              <div>{{ nationDiff.totalSame }}</div>
              <div style="font-size: 0.72rem; color: var(--text-muted)">
                {{ t('cmp_unchanged') }}
              </div>
            </div>
            <div style="text-align: center">
              <div class="nation-delta-pos">
                +{{ nationDiff.totalAdded }}
              </div>
              <div style="font-size: 0.72rem; color: var(--text-muted)">
                {{ t('cmp_added') }}
              </div>
            </div>
          </div>
        </div>

        <div
          v-if="!sortedNationCountries.length"
          class="empty"
        >
          {{ t('cmp_no_nation') }}
        </div>
        <div
          v-for="country in sortedNationCountries"
          v-else
          :key="country"
          class="nation-card"
          :class="{ 'no-change': !nationDiff.nations[country].added.length && !nationDiff.nations[country].removed.length }"
        >
          <div class="nation-card-header">
            <div class="nation-card-name">
              {{ country }}
            </div>
            <div class="nation-card-stats">
              <div class="nation-stat total">
                <div class="nation-stat-val">
                  {{ nationDiff.nations[country].same.length + nationDiff.nations[country].added.length }}
                </div>
                <div class="nation-stat-lbl">
                  {{ t('cmp_total') }}
                </div>
              </div>
              <div class="nation-stat removed">
                <div class="nation-stat-val">
                  −{{ nationDiff.nations[country].removed.length }}
                </div>
                <div class="nation-stat-lbl">
                  {{ t('cmp_removed') }}
                </div>
              </div>
              <div class="nation-stat same">
                <div class="nation-stat-val">
                  {{ nationDiff.nations[country].same.length }}
                </div>
                <div class="nation-stat-lbl">
                  {{ t('cmp_unchanged') }}
                </div>
              </div>
              <div class="nation-stat added">
                <div class="nation-stat-val">
                  +{{ nationDiff.nations[country].added.length }}
                </div>
                <div class="nation-stat-lbl">
                  {{ t('cmp_added') }}
                </div>
              </div>
            </div>
          </div>
          <div
            v-if="nationDiff.nations[country].added.length || nationDiff.nations[country].removed.length || nationDiff.nations[country].same.length"
            class="nation-card-body"
          >
            <span
              v-for="a in nationDiff.nations[country].removed"
              :key="`r-${a.id}`"
              class="diff-ath removed"
            >− {{ a.name }}</span>
            <span
              v-for="a in nationDiff.nations[country].same"
              :key="`s-${a.id}`"
              class="diff-ath same"
            >= {{ a.name }}</span>
            <span
              v-for="a in nationDiff.nations[country].added"
              :key="`a-${a.id}`"
              class="diff-ath added"
            >+ {{ a.name }}</span>
          </div>
        </div>
      </template>

      <!-- Multi tab -->
      <template v-else>
        <div
          v-if="!aDups.length && !bDups.length"
          class="empty"
        >
          {{ t('cmp_no_dups') }}
        </div>
        <template v-else>
          <div
            v-if="aDups.length"
            class="diff-class-block"
          >
            <div class="diff-class-header">
              <span class="cmp-label cmp-label-a">A</span>
              <span style="text-transform: none">{{ slotA.selected?.DisplayName || t('cmp_a') }}</span>
              <span style="margin-left: auto; color: var(--text-muted)">{{ t('cmp_dups_count', { n: aDups.length }) }}</span>
            </div>
            <div
              v-for="dup in aDups"
              :key="`${dup.cls}-${dup.country}`"
              style="padding: 10px 14px; border-bottom: 1px solid var(--border)"
            >
              <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 8px">
                <strong>{{ dup.country }}</strong>
                <span class="badge badge-muted">{{ dup.cls }}</span>
                <span style="font-size: 0.75rem; color: var(--text-muted)">{{ t('cmp_dup_meta', { n: dup.boats.length }) }}</span>
              </div>
              <div class="dup-grid">
                <div
                  v-for="boat in dup.boats"
                  :key="boat.id"
                  class="dup-col"
                >
                  <div class="dup-col-title">
                    {{ boat.DisplayName || '—' }}
                  </div>
                  <div
                    v-for="a in sortAthletes(boat.boatAthletes || [], (x) => x.boatPosition)"
                    :key="a.personId"
                    class="dup-ath"
                    :class="{ common: dupCommonIds(dup.boats).has(String(a.personId)) }"
                  >
                    <span class="dup-pos">{{ a.boatPosition || '·' }}</span>
                    <span>{{ [a.person?.FirstName, a.person?.LastName].filter(Boolean).join(' ') || a.person?.DisplayName || '?' }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div
            v-if="bDups.length"
            class="diff-class-block"
            style="margin-top: 14px"
          >
            <div class="diff-class-header">
              <span class="cmp-label cmp-label-b">B</span>
              <span style="text-transform: none">{{ slotB.selected?.DisplayName || t('cmp_b') }}</span>
              <span style="margin-left: auto; color: var(--text-muted)">{{ t('cmp_dups_count', { n: bDups.length }) }}</span>
            </div>
            <div
              v-for="dup in bDups"
              :key="`${dup.cls}-${dup.country}`"
              style="padding: 10px 14px; border-bottom: 1px solid var(--border)"
            >
              <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 8px">
                <strong>{{ dup.country }}</strong>
                <span class="badge badge-muted">{{ dup.cls }}</span>
                <span style="font-size: 0.75rem; color: var(--text-muted)">{{ t('cmp_dup_meta', { n: dup.boats.length }) }}</span>
              </div>
              <div class="dup-grid">
                <div
                  v-for="boat in dup.boats"
                  :key="boat.id"
                  class="dup-col"
                >
                  <div class="dup-col-title">
                    {{ boat.DisplayName || '—' }}
                  </div>
                  <div
                    v-for="a in sortAthletes(boat.boatAthletes || [], (x) => x.boatPosition)"
                    :key="a.personId"
                    class="dup-ath"
                    :class="{ common: dupCommonIds(dup.boats).has(String(a.personId)) }"
                  >
                    <span class="dup-pos">{{ a.boatPosition || '·' }}</span>
                    <span>{{ [a.person?.FirstName, a.person?.LastName].filter(Boolean).join(' ') || a.person?.DisplayName || '?' }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </template>
      </template>
    </template>
  </div>
</template>
