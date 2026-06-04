<script setup>
import { storeToRefs } from 'pinia'
import { useResultsStore } from '@/stores/results'
import { sortAthletes } from '@/lib/athletes'
import { rankClass, rankEmoji } from '@/lib/rank'
import { useI18n } from 'vue-i18n'
import LoadingSpinner from '@/components/shared/LoadingSpinner.vue'

const store = useResultsStore()
const { loadingEntries, entries, entryClassFilter, filteredEntries, entryClasses } =
  storeToRefs(store)
const { t } = useI18n()

const totalBoats = (list) => list.reduce((sum, e) => sum + (e.boats?.length || 0), 0)

function sortedBoats(event) {
  return [...(event.boats || [])].sort(
    (a, b) =>
      (a.finalRankIndex ?? 999) - (b.finalRankIndex ?? 999) ||
      (a.DisplayName || '').localeCompare(b.DisplayName || ''),
  )
}

function boatCode(boat) {
  return boat.DisplayName || '—'
}

/** Nom complet si différent du code (ex. ARG → Argentina) */
function boatCountryFullName(boat) {
  const code = boat.DisplayName
  const full = boat.country?.DisplayName
  if (!full || full === code) return null
  return full
}

function athleteNames(boat) {
  return (
    sortAthletes(boat.boatAthletes || [], (a) => a.boatPosition)
      .map((a) => {
        const p = a.person || {}
        const nm = [p.FirstName, p.LastName].filter(Boolean).join(' ') || p.DisplayName || '—'
        return a.boatPosition ? `${a.boatPosition}· ${nm}` : nm
      })
      .join(', ') || '—'
  )
}
</script>

<template>
  <LoadingSpinner
    v-if="loadingEntries"
    :message="t('loading_entries')"
  />

  <div
    v-else-if="!entries.length"
    class="empty"
  >
    {{ t('no_entries') }}
  </div>

  <div v-else>
    <div
      class="section-title"
      style="margin-bottom: 0"
    >
      {{ t('entries_count', { ev: filteredEntries.length, bo: totalBoats(filteredEntries) }) }}
    </div>

    <div
      v-if="entryClasses.length > 1"
      class="class-filters"
    >
      <div
        class="pill"
        :class="{ active: !entryClassFilter }"
        @click="entryClassFilter = null"
      >
        {{ t('all') }}
      </div>
      <div
        v-for="c in entryClasses"
        :key="c"
        class="pill"
        :class="{ active: entryClassFilter === c }"
        @click="entryClassFilter = c"
      >
        {{ c }}
      </div>
    </div>

    <div
      class="table-wrap"
      style="margin-top: 10px"
    >
      <table>
        <thead>
          <tr>
            <th>{{ t('hdr_event') }}</th>
            <th>{{ t('hdr_country') }}</th>
            <th>{{ t('hdr_athletes') }}</th>
            <th>{{ t('hdr_final_rank') }}</th>
          </tr>
        </thead>
        <tbody>
          <template
            v-for="event in filteredEntries"
            :key="event.id"
          >
            <tr v-if="!(event.boats || []).length">
              <td>
                <strong>{{ event.DisplayName || '—' }}</strong>
                <br>
                <span
                  class="badge badge-muted"
                  style="margin-top: 4px"
                >{{ event.boatClass?.DisplayName || '—' }}</span>
              </td>
              <td
                colspan="3"
                style="color: var(--text-muted)"
              >
                {{ t('no_boat') }}
              </td>
            </tr>
            <tr
              v-for="(b, i) in sortedBoats(event)"
              v-else
              :key="b.id || `${event.id}-${i}`"
            >
              <td
                v-if="i === 0"
                :rowspan="event.boats.length"
                style="vertical-align: top; font-weight: 600; border-right: 1px solid var(--border)"
              >
                {{ event.DisplayName || '—' }}
                <br>
                <span
                  class="badge badge-muted"
                  style="margin-top: 4px"
                >{{ event.boatClass?.DisplayName || '—' }}</span>
              </td>
              <td class="entry-country-cell">
                <strong>{{ boatCode(b) }}</strong>
                <div
                  v-if="boatCountryFullName(b)"
                  class="entry-country-full"
                >
                  {{ boatCountryFullName(b) }}
                </div>
              </td>
              <td class="entry-athletes-cell">
                {{ athleteNames(b) }}
              </td>
              <td
                :class="rankClass(b.finalRank)"
                class="entry-rank-cell"
              >
                {{ rankEmoji(b.finalRank) }}
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>
  </div>
</template>
