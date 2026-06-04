import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { apiCompetitions, apiSchedule, apiEntries, apiStartList } from '@/services/api'
import {
  getSelectedComp,
  setSelectedComp,
  getNationScheduleFilter,
  setNationScheduleFilter,
  getFavNation,
} from '@/services/storage'
import { useAppStore } from '@/stores/app'
import { sortClasses } from '@/lib/boatClass'
import {
  dayKey,
  isOngoingComp,
  nationCodesFromEntries,
  raceMatchesNationCodes,
  collectNationsFromEntries,
} from '@/lib/schedule'

export const useScheduleStore = defineStore('schedule', () => {
  const app = useAppStore()

  const year = ref(new Date().getFullYear())
  const category = ref('World Rowing Cup')
  const competitions = ref([])
  const loadingComps = ref(false)
  const searched = ref(false)

  const selectedComp = ref(null)
  const races = ref([])
  const loadingRaces = ref(false)

  const dayFilter = ref(null)
  const phaseFilter = ref(null)
  const classFilter = ref(null)

  const nationPanelOpen = ref(false)
  const nationSearch = ref('')
  const nationFilter = ref(null)
  const entries = ref([])
  const loadingEntries = ref(false)
  const entriesLoaded = ref(false)

  const modalRace = ref(null)
  const modalDetail = ref(null)
  const loadingModal = ref(false)

  const error = ref(null)

  const filteredRaces = computed(() => {
    let list = races.value
    if (dayFilter.value) list = list.filter((r) => dayKey(r.DateString) === dayFilter.value)
    if (phaseFilter.value) {
      list = list.filter((r) => (r.racePhase?.DisplayName || '') === phaseFilter.value)
    }
    if (classFilter.value) {
      list = list.filter((r) => (r.event?.boatClass?.DisplayName || '') === classFilter.value)
    }
    if (nationFilter.value) {
      const codes = entriesLoaded.value
        ? nationCodesFromEntries(entries.value, nationFilter.value)
        : [nationFilter.value]
      list = list.filter((r) => raceMatchesNationCodes(r, codes))
    }
    return list
  })

  const days = computed(() =>
    [...new Set(races.value.map((r) => dayKey(r.DateString)))].sort(),
  )

  const phases = computed(() =>
    [...new Set(races.value.map((r) => r.racePhase?.DisplayName || '?'))].sort(),
  )

  const classes = computed(() =>
    sortClasses([
      ...new Set(races.value.map((r) => r.event?.boatClass?.DisplayName || '?')),
    ]),
  )

  const racesByDay = computed(() => {
    const byDay = {}
    for (const r of filteredRaces.value) {
      const k = dayKey(r.DateString)
      ;(byDay[k] = byDay[k] || []).push(r)
    }
    return byDay
  })

  const statusCounts = computed(() => {
    const list = filteredRaces.value
    return {
      total: list.length,
      official: list.filter((r) =>
        (r.raceStatus?.DisplayName || '').toLowerCase().includes('official'),
      ).length,
      startList: list.filter((r) =>
        (r.raceStatus?.DisplayName || '').toLowerCase().includes('start'),
      ).length,
      scheduled: list.filter((r) =>
        (r.raceStatus?.DisplayName || '').toLowerCase() === 'scheduled',
      ).length,
      cancelled: list.filter((r) =>
        (r.raceStatus?.DisplayName || '').toLowerCase().includes('cancel'),
      ).length,
    }
  })

  const nations = computed(() => {
    const q = nationSearch.value.toLowerCase()
    const all = collectNationsFromEntries(entries.value)
    return q ? all.filter((n) => n.toLowerCase().includes(q)) : all
  })

  function resetFilters() {
    dayFilter.value = null
    phaseFilter.value = null
    classFilter.value = null
    nationFilter.value = null
    nationSearch.value = ''
    entries.value = []
    entriesLoaded.value = false
    nationPanelOpen.value = false
  }

  function tryRestoreNation() {
    if (!entriesLoaded.value) return
    const saved = getNationScheduleFilter()
    if (!saved) return
    const codes = nationCodesFromEntries(entries.value, saved)
    const exists = races.value.some((r) => raceMatchesNationCodes(r, codes))
    if (exists) {
      nationFilter.value = saved
      nationPanelOpen.value = true
    }
  }

  async function search() {
    loadingComps.value = true
    searched.value = false
    error.value = null
    selectedComp.value = null
    races.value = []
    resetFilters()
    modalRace.value = null
    modalDetail.value = null

    try {
      competitions.value = await apiCompetitions(year.value, category.value)
    } catch (e) {
      console.error(e)
      error.value = e
      competitions.value = []
    } finally {
      loadingComps.value = false
      searched.value = true
    }

    if (competitions.value.length) {
      const saved = getSelectedComp()
      let target = null
      if (saved && saved.year === String(year.value) && saved.category === category.value) {
        target = competitions.value.find((c) => c.id === saved.id) || null
      }
      if (!target) {
        target = competitions.value.find(isOngoingComp) || competitions.value[0]
      }
      if (target) await selectComp(target.id)
    }
  }

  async function selectComp(id) {
    const comp = competitions.value.find((c) => c.id === id)
    if (!comp) return

    selectedComp.value = comp
    races.value = []
    loadingRaces.value = true
    resetFilters()
    modalRace.value = null
    modalDetail.value = null
    setSelectedComp({ id: comp.id, year: String(year.value), category: category.value })

    try {
      races.value = await apiSchedule(id)
      const today = new Date().toISOString().slice(0, 10)
      const dayList = [...new Set(races.value.map((r) => dayKey(r.DateString)))].sort()
      if (dayList.includes(today)) dayFilter.value = today
    } catch (e) {
      console.error(e)
      error.value = e
      races.value = []
    } finally {
      loadingRaces.value = false
    }
  }

  async function refreshRaces() {
    if (!selectedComp.value) {
      app.lastRefreshAt = Date.now()
      return
    }
    const cId = selectedComp.value.id
    try {
      const fresh = await apiSchedule(cId)
      if (selectedComp.value?.id === cId) races.value = fresh
      app.lastRefreshAt = Date.now()
    } catch (e) {
      console.warn('[schedule refresh]', e)
    }
  }

  async function loadNationEntries() {
    if (!selectedComp.value || loadingEntries.value) return
    loadingEntries.value = true
    try {
      entries.value = await apiEntries(selectedComp.value.id)
      entriesLoaded.value = true
      tryRestoreNation()
    } catch (e) {
      console.error(e)
      entries.value = []
    } finally {
      loadingEntries.value = false
    }
  }

  function setNation(n) {
    nationFilter.value = n
    if (n) {
      setNationScheduleFilter(n)
      app.pushRecent(n)
    } else {
      setNationScheduleFilter(null)
    }
  }

  async function toggleNationPanel() {
    nationPanelOpen.value = !nationPanelOpen.value
    if (nationPanelOpen.value && !entriesLoaded.value && !loadingEntries.value) {
      await loadNationEntries()
    }
  }

  function toggleFavNation(n) {
    const cur = getFavNation()
    app.setFavorite(cur === n ? null : n)
  }

  async function openStartList(raceId) {
    const race = races.value.find((r) => r.id === raceId)
    if (!race) return
    modalRace.value = race
    modalDetail.value = null
    loadingModal.value = true
    try {
      modalDetail.value = await apiStartList(raceId)
    } catch (e) {
      console.error(e)
    } finally {
      loadingModal.value = false
    }
  }

  function closeModal() {
    modalRace.value = null
    modalDetail.value = null
    loadingModal.value = false
  }

  function initFromSavedComp() {
    const saved = getSelectedComp()
    if (saved?.year) year.value = Number(saved.year) || year.value
    if (saved?.category) category.value = saved.category
  }

  return {
    year,
    category,
    competitions,
    loadingComps,
    searched,
    selectedComp,
    races,
    loadingRaces,
    dayFilter,
    phaseFilter,
    classFilter,
    nationPanelOpen,
    nationSearch,
    nationFilter,
    entries,
    loadingEntries,
    entriesLoaded,
    modalRace,
    modalDetail,
    loadingModal,
    error,
    filteredRaces,
    days,
    phases,
    classes,
    racesByDay,
    statusCounts,
    nations,
    search,
    selectComp,
    refreshRaces,
    loadNationEntries,
    toggleNationPanel,
    setNation,
    toggleFavNation,
    openStartList,
    closeModal,
    initFromSavedComp,
  }
})
