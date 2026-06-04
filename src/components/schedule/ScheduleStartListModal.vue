<script setup>
import { computed, onMounted, onUnmounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useScheduleStore } from '@/stores/schedule'
import { formatAthleteNames } from '@/lib/athletes'
import { fmtResultTime, fmtTime } from '@/lib/format'
import { useI18n } from 'vue-i18n'
import LoadingSpinner from '@/components/shared/LoadingSpinner.vue'

const store = useScheduleStore()
const { modalRace, modalDetail, loadingModal } = storeToRefs(store)
const { t, locale } = useI18n()

const open = computed(() => !!modalRace.value)

const detail = computed(() => modalDetail.value?.data)

const status = computed(() => {
  if (!modalRace.value) return '—'
  return detail.value?.raceStatus?.DisplayName || modalRace.value.raceStatus?.DisplayName || '—'
})

const isFinal = computed(() => String(status.value).toLowerCase() === 'official')

const modalSub = computed(() => {
  if (!modalRace.value) return ''
  const cls = modalRace.value.event?.boatClass?.DisplayName || '—'
  const phase = modalRace.value.racePhase?.DisplayName || '—'
  const time = fmtTime(modalRace.value.DateString, locale.value)
  return `${cls} · ${phase} · ${time} · ${status.value}`
})

const boats = computed(() => {
  const list = detail.value?.raceBoats || []
  return isFinal.value
    ? [...list].sort((a, b) => (a.Rank ?? 99) - (b.Rank ?? 99))
    : [...list].sort((a, b) => (a.Lane ?? 99) - (b.Lane ?? 99))
})

function rankEmoji(r) {
  if (r === 1) return '🥇'
  if (r === 2) return '🥈'
  if (r === 3) return '🥉'
  return r || '—'
}

function rankClass(r) {
  if (r === 1) return 'rank-1'
  if (r === 2) return 'rank-2'
  if (r === 3) return 'rank-3'
  return ''
}

function formatTimeCell(boat) {
  const mark = boat.invalidMarkResultCode
  const markName = mark ? (typeof mark === 'object' ? mark.DisplayName : mark) : null
  if (markName) return { type: 'mark', value: markName }
  return { type: 'time', value: fmtResultTime(boat.ResultTime) }
}

function onOverlayClick(e) {
  if (e.target === e.currentTarget) store.closeModal()
}

function onKeydown(e) {
  if (e.key === 'Escape') store.closeModal()
}

onMounted(() => document.addEventListener('keydown', onKeydown))
onUnmounted(() => document.removeEventListener('keydown', onKeydown))
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="modal-overlay"
      @click="onOverlayClick"
    >
      <div
        class="modal-panel"
        @click.stop
      >
        <div class="modal-header">
          <div>
            <div class="modal-title">
              {{ modalRace?.DisplayName || modalRace?.id }}
            </div>
            <div class="modal-sub">
              {{ modalSub }}
            </div>
          </div>
          <button
            type="button"
            class="modal-close"
            :aria-label="t('modal_close')"
            @click="store.closeModal()"
          >
            ✕
          </button>
        </div>

        <div class="modal-body">
          <LoadingSpinner
            v-if="loadingModal"
            :message="t('modal_loading')"
          />

          <div
            v-else-if="!boats.length"
            class="empty"
          >
            {{ t('modal_no_crew') }}
          </div>

          <template v-else-if="isFinal">
            <div class="modal-meta">
              {{ t('modal_results') }} · {{ t('n_crews', { n: boats.length }) }}
            </div>
            <div class="table-wrap">
              <table class="results-table">
                <thead>
                  <tr>
                    <th>{{ t('hdr_rank') }}</th>
                    <th>{{ t('hdr_lane') }}</th>
                    <th>{{ t('hdr_country') }}</th>
                    <th>{{ t('hdr_athletes') }}</th>
                    <th>{{ t('hdr_time') }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="boat in boats"
                    :key="boat.id || boat.Lane"
                  >
                    <td :class="rankClass(boat.Rank)">
                      {{ rankEmoji(boat.Rank) }}
                    </td>
                    <td style="color: var(--text-muted)">
                      {{ boat.Lane ?? '—' }}
                    </td>
                    <td style="font-weight: 600">
                      {{ boat.DisplayName || '—' }}
                    </td>
                    <td style="color: var(--text-muted); font-size: 0.78rem">
                      {{ formatAthleteNames(boat.raceBoatAthletes || []) }}
                    </td>
                    <td>
                      <span
                        v-if="formatTimeCell(boat).type === 'mark'"
                        class="badge badge-cancelled"
                      >
                        {{ formatTimeCell(boat).value }}
                      </span>
                      <span
                        v-else
                        style="font-family: monospace"
                      >
                        {{ formatTimeCell(boat).value || '—' }}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </template>

          <template v-else>
            <div class="modal-meta">
              {{ t('modal_startlist') }} · {{ t('n_crews', { n: boats.length }) }}
            </div>
            <div class="boat-list">
              <div
                v-for="boat in boats"
                :key="boat.id || boat.Lane"
                class="boat-row"
              >
                <div
                  class="boat-lane"
                  :title="t('hdr_lane')"
                >
                  {{ boat.Lane ?? '—' }}
                </div>
                <div style="flex: 1; min-width: 0">
                  <div class="boat-country">
                    {{ boat.DisplayName || '—' }}
                  </div>
                  <div class="boat-athletes">
                    {{ formatAthleteNames(boat.raceBoatAthletes || []) }}
                  </div>
                </div>
              </div>
            </div>
          </template>
        </div>
      </div>
    </div>
  </Teleport>
</template>
