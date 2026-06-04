<script setup>
import { computed } from 'vue'
import { sortAthletes } from '@/lib/athletes'
import { buildPaceTable, secToSplit } from '@/lib/pace'
import { rankClass, rankEmoji } from '@/lib/rank'
import { fmtDate, fmtResultTime } from '@/lib/format'
import { useI18n } from 'vue-i18n'
import LoadingSpinner from '@/components/shared/LoadingSpinner.vue'

const props = defineProps({
  raceState: { type: Object, required: true },
})

const emit = defineEmits(['set-tab'])

const { t, locale } = useI18n()

const race = computed(() => props.raceState.detail?.data || {})
const boats = computed(() => race.value.raceBoats || [])
const tab = computed(() => props.raceState.tab)

const sortedBoats = computed(() =>
  [...boats.value].sort((a, b) => (a.Rank || 99) - (b.Rank || 99)),
)

const paceData = computed(() => buildPaceTable(boats.value))

function boatKey(b) {
  return b.id || b.boatId || b.DisplayName
}

function paceSplit(b, d) {
  const st = paceData.value?.stats[d]
  if (!st) return '—'
  return secToSplit(st.splitBySeat.get(boatKey(b)))
}

function paceGap(b, d) {
  const st = paceData.value?.stats[d]
  if (!st) return null
  const key = boatKey(b)
  const cum = st.cumBySeat.get(key)
  const cumGap = cum != null && st.leaderCum != null ? cum - st.leaderCum : null
  if (cumGap == null) return null
  if (cumGap < 0.005) return 'leader'
  return cumGap
}
</script>

<template>
  <LoadingSpinner
    v-if="raceState.loading"
    :message="t('loading_results')"
  />

  <template v-else>
    <div style="font-size: 0.78rem; color: var(--text-muted); margin-bottom: 10px">
      {{ fmtDate(race.Date, locale) }} · {{ t('boats_count', { n: boats.length }) }}
    </div>

    <div
      class="tabs"
      style="margin-bottom: 12px"
    >
      <button
        type="button"
        class="tab"
        :class="{ active: tab === 'results' }"
        @click="emit('set-tab', 'results')"
      >
        {{ t('tab_results') }}
      </button>
      <button
        type="button"
        class="tab"
        :class="{ active: tab === 'athletes' }"
        @click="emit('set-tab', 'athletes')"
      >
        {{ t('tab_crews') }}
      </button>
      <button
        type="button"
        class="tab"
        :class="{ active: tab === 'pace' }"
        @click="emit('set-tab', 'pace')"
      >
        {{ t('tab_splits') }}
      </button>
    </div>

    <!-- Results tab -->
    <div
      v-if="tab === 'results'"
      class="table-wrap"
    >
      <div
        v-if="!boats.length"
        class="empty"
      >
        {{ t('no_result') }}
      </div>
      <table v-else>
        <thead>
          <tr>
            <th>{{ t('hdr_rank') }}</th>
            <th>{{ t('hdr_lane') }}</th>
            <th>{{ t('hdr_team') }}</th>
            <th>{{ t('hdr_time') }}</th>
            <th>{{ t('hdr_disq') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="b in sortedBoats"
            :key="b.id || b.Lane"
          >
            <td :class="rankClass(b.Rank)">
              {{ rankEmoji(b.Rank) }}
            </td>
            <td style="color: var(--text-muted)">
              {{ b.Lane ?? '—' }}
            </td>
            <td><strong>{{ b.DisplayName || b.boatId || '—' }}</strong></td>
            <td style="font-variant-numeric: tabular-nums; font-family: monospace">
              {{ fmtResultTime(b.ResultTime) }}
            </td>
            <td>
              <span
                v-if="b.invalidMarkResultCode"
                class="badge badge-muted"
              >
                {{ typeof b.invalidMarkResultCode === 'object' ? b.invalidMarkResultCode.DisplayName : b.invalidMarkResultCode }}
              </span>
              <span
                v-else
                style="color: var(--green)"
              >✓</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Athletes tab -->
    <div
      v-else-if="tab === 'athletes'"
      class="table-wrap"
    >
      <div
        v-if="!boats.length"
        class="empty"
      >
        {{ t('no_crew') }}
      </div>
      <table v-else>
        <thead>
          <tr>
            <th>{{ t('hdr_rank') }}</th>
            <th>{{ t('hdr_team') }}</th>
            <th>{{ t('hdr_athletes') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="b in sortedBoats"
            :key="b.id || b.Lane"
          >
            <td :class="rankClass(b.Rank)">
              {{ rankEmoji(b.Rank) }}
            </td>
            <td><strong>{{ b.DisplayName || b.boatId || '—' }}</strong></td>
            <td>
              <div class="athlete-list">
                <template v-if="(b.raceBoatAthletes || []).length">
                  <div
                    v-for="a in sortAthletes(b.raceBoatAthletes, (x) => x.boatPosition)"
                    :key="a.personId"
                    class="athlete-chip"
                  >
                    <strong>{{ [a.person?.FirstName, a.person?.LastName].filter(Boolean).join(' ') || a.person?.DisplayName || '—' }}</strong>
                    <span v-if="a.boatPosition"> · {{ a.boatPosition }}</span>
                  </div>
                </template>
                <span
                  v-else
                  style="color: var(--text-muted)"
                >—</span>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pace tab -->
    <template v-else>
      <div
        v-if="!boats.length"
        class="empty"
      >
        {{ t('no_split') }}
      </div>
      <div
        v-else-if="!paceData"
        class="empty"
      >
        {{ t('no_split_data') }}
      </div>
      <template v-else>
        <div class="scroll-hint">
          {{ t('scroll_hint') }}
        </div>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th rowspan="2">
                  {{ t('hdr_rank') }}
                </th>
                <th rowspan="2">
                  {{ t('hdr_team') }}
                </th>
                <th
                  v-for="d in paceData.dists"
                  :key="d"
                  colspan="1"
                  style="text-align: center"
                >
                  {{ paceData.distMap.get(d) }}
                </th>
              </tr>
              <tr>
                <th
                  v-for="d in paceData.dists"
                  :key="`sub-${d}`"
                  style="font-size: 0.66rem; color: var(--text-muted); font-weight: 500; border-top: 1px solid var(--border)"
                >
                  {{ t('pace_legend') }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="b in paceData.sorted"
                :key="b.id || b.boatId || b.DisplayName"
              >
                <td
                  :class="rankClass(b.Rank)"
                  style="vertical-align: top"
                >
                  {{ rankEmoji(b.Rank) }}
                </td>
                <td style="vertical-align: top">
                  <strong>{{ b.DisplayName || b.boatId || '—' }}</strong>
                </td>
                <td
                  v-for="d in paceData.dists"
                  :key="d"
                  style="font-variant-numeric: tabular-nums; font-family: monospace; vertical-align: top; padding: 8px 13px"
                >
                  <template v-if="paceData.boatIdx.get(boatKey(b))?.get(d)">
                    <div>
                      {{ fmtResultTime(paceData.boatIdx.get(boatKey(b)).get(d).ResultTime) }}
                      <small
                        v-if="paceData.boatIdx.get(boatKey(b)).get(d).Rank"
                        style="color: var(--text-muted); margin-left: 2px"
                      >({{ paceData.boatIdx.get(boatKey(b)).get(d).Rank }})</small>
                    </div>
                    <div style="margin-top: 3px; padding-top: 3px; border-top: 1px solid var(--border)">
                      <span style="color: var(--text-muted)">{{ paceSplit(b, d) }}</span>
                      <small
                        v-if="paceData.stats[d].splitRank.get(boatKey(b))"
                        style="color: var(--text-muted); margin-left: 2px"
                      >({{ paceData.stats[d].splitRank.get(boatKey(b)) }})</small>
                      <small
                        v-if="paceGap(b, d) === 'leader'"
                        style="color: var(--green); margin-left: 4px"
                      >—</small>
                      <small
                        v-else-if="paceGap(b, d) != null"
                        style="color: var(--red); margin-left: 4px"
                      >+{{ paceGap(b, d).toFixed(2) }}</small>
                    </div>
                  </template>
                  <span
                    v-else
                    style="color: var(--text-muted)"
                  >—</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </template>
    </template>
  </template>
</template>
