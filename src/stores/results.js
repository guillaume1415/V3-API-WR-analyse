import { defineStore } from 'pinia'
import { computed, reactive, ref } from 'vue'
import { apiCompetitions, apiOfficialRaces, apiEntries, apiRaceDetail } from '@/services/api'
import {
  getSelectedComp,
  setSelectedComp,
  getNationRacesFilter,
  setNationRacesFilter,
  getFavNation,
} from '@/services/storage'
import { useAppStore } from '@/stores/app'
import { sortClasses, boatClassSortKey } from '@/lib/boatClass'
import { collectNationsFromEntries, isOngoingComp, nationCodesFromEntries, raceMatchesNationCodes } from '@/lib/schedule'

export const useResultsStore = defineStore('results', () => {
  const app = useAppStore()

  const year = ref(new Date().getFullYear())
  const category = ref('World Rowing Championships')
  const competitions = ref([])
  const loadingComps = ref(false)
  const searched = ref(false)
  const error = ref(null)

  const selectedComp = ref(null)
  const compTab = ref('races')

  const races = ref([])
  const loadingRaces = ref(false)
  const classFilter = ref(null)

  const entries = ref([])
  const loadingEntries = ref(false)
  const entryClassFilter = ref(null)

  const raceNationPanelOpen = ref(false)
  const raceNationFilter = ref(null)
  const raceNationSearch = ref('')

  const openRaces = reactive(new Map())

  const raceClasses = computed(() =>
    sortClasses([...new Set(races.value.map((r) => r.event?.boatClass?.DisplayName || 'Autre'))]),
  )

  const filteredRaces = computed(() => {
    let list = races.value
    if (raceNationFilter.value) {
      const hasEntries = entries.value.length > 0
      const codes = hasEntries
        ? nationCodesFromEntries(entries.value, raceNationFilter.value)
        : [raceNationFilter.value]
      list = list.filter((r) => raceMatchesNationCodes(r, codes))
    }
    if (classFilter.value) {
      list = list.filter((r) => (r.event?.boatClass?.DisplayName || 'Autre') === classFilter.value)
    }
    return list
  })

  const raceGroups = computed(() => {
    const groups = {}
    for (const r of filteredRaces.value) {
      const cls = r.event?.boatClass?.DisplayName || 'Autre'
      ;(groups[cls] = groups[cls] || []).push(r)
    }
    return groups
  })

  const sortedRaceGroupKeys = computed(() => sortClasses(Object.keys(raceGroups.value)))

  const nations = computed(() => {
    const q = raceNationSearch.value.toLowerCase()
    const all = collectNationsFromEntries(entries.value)
    return q ? all.filter((n) => n.toLowerCase().includes(q)) : all
  })

  const filteredEntries = computed(() => {
    const list = entryClassFilter.value
      ? entries.value.filter((e) => (e.boatClass?.DisplayName || 'Autre') === entryClassFilter.value)
      : [...entries.value]
    return list.sort((a, b) => {
      const ka = boatClassSortKey(a.boatClass?.DisplayName || 'Autre')
      const kb = boatClassSortKey(b.boatClass?.DisplayName || 'Autre')
      return ka[0] - kb[0] || ka[1] - kb[1] || ka[2].localeCompare(kb[2])
    })
  })

  const entryClasses = computed(() =>
    sortClasses([...new Set(entries.value.map((e) => e.boatClass?.DisplayName || 'Autre'))]),
  )

  function resetCompState() {
    selectedComp.value = null
    compTab.value = 'races'
    races.value = []
    classFilter.value = null
    entries.value = []
    entryClassFilter.value = null
    raceNationPanelOpen.value = false
    raceNationFilter.value = null
    raceNationSearch.value = ''
    openRaces.clear()
  }

  function tryRestoreNation() {
    if (!entries.value.length) return
    const saved = getNationRacesFilter()
    if (!saved) return
    const codes = nationCodesFromEntries(entries.value, saved)
    const exists = races.value.some((r) => raceMatchesNationCodes(r, codes))
    if (exists) {
      raceNationFilter.value = saved
      raceNationPanelOpen.value = true
    }
  }

  async function search() {
    loadingComps.value = true
    searched.value = true
    error.value = null
    resetCompState()

    try {
      competitions.value = await apiCompetitions(year.value, category.value)
    } catch (e) {
      error.value = e?.message || String(e)
      competitions.value = []
    } finally {
      loadingComps.value = false
    }

    if (!error.value && competitions.value.length) {
      const saved = getSelectedComp()
      let target = null
      if (saved && saved.year === String(year.value) && saved.category === category.value) {
        target = competitions.value.find((c) => c.id === saved.id) || null
      }
      if (!target) target = competitions.value.find(isOngoingComp) || competitions.value[0]
      if (target) await selectComp(target.id)
    }
  }

  async function selectComp(id) {
    const comp = competitions.value.find((c) => c.id === id)
    if (!comp) return

    selectedComp.value = comp
    compTab.value = 'races'
    races.value = []
    loadingRaces.value = true
    classFilter.value = null
    entries.value = []
    entryClassFilter.value = null
    raceNationPanelOpen.value = false
    raceNationFilter.value = null
    raceNationSearch.value = ''
    openRaces.clear()

    setSelectedComp({ id: comp.id, year: String(year.value), category: category.value })

    try {
      races.value = await apiOfficialRaces(id)
    } catch (e) {
      console.error(e)
      races.value = []
    } finally {
      loadingRaces.value = false
    }
  }

  async function loadEntries() {
    if (!selectedComp.value || entries.value.length || loadingEntries.value) return
    loadingEntries.value = true
    try {
      entries.value = await apiEntries(selectedComp.value.id)
      tryRestoreNation()
    } catch (e) {
      console.error(e)
      entries.value = []
    } finally {
      loadingEntries.value = false
    }
  }

  async function setCompTab(tab) {
    compTab.value = tab
    if (tab === 'entries') await loadEntries()
  }

  async function toggleRaceDetail(id) {
    if (openRaces.has(id)) {
      openRaces.delete(id)
      return
    }
    await openRaceDetail(id)
  }

  async function openRaceDetail(id) {
    const race = races.value.find((r) => r.id === id)
    if (!race) return

    openRaces.set(id, { race, detail: null, loading: true, tab: 'results' })

    try {
      const detail = await apiRaceDetail(id)
      if (openRaces.has(id)) openRaces.get(id).detail = detail
    } catch (e) {
      console.error(e)
    } finally {
      if (openRaces.has(id)) openRaces.get(id).loading = false
    }
  }

  function setRaceTab(id, tab) {
    if (openRaces.has(id)) openRaces.get(id).tab = tab
  }

  function clearSelection() {
    resetCompState()
  }

  async function toggleNationPanel() {
    raceNationPanelOpen.value = !raceNationPanelOpen.value
    if (raceNationPanelOpen.value && !entries.value.length && !loadingEntries.value) {
      await loadEntries()
    }
  }

  function setRaceNation(n) {
    raceNationFilter.value = n
    if (n) {
      setNationRacesFilter(n)
      app.pushRecent(n)
    } else {
      setNationRacesFilter(null)
    }
  }

  function toggleFavNation(n) {
    const cur = getFavNation()
    app.setFavorite(cur === n ? null : n)
  }

  async function refreshAll() {
    if (!selectedComp.value) {
      app.lastRefreshAt = Date.now()
      return
    }
    const cId = selectedComp.value.id
    try {
      const freshRaces = await apiOfficialRaces(cId)
      if (selectedComp.value?.id === cId) races.value = freshRaces

      if (compTab.value === 'entries' || entries.value.length) {
        const freshEntries = await apiEntries(cId)
        if (selectedComp.value?.id === cId) entries.value = freshEntries
      }

      for (const rid of [...openRaces.keys()]) {
        try {
          const detail = await apiRaceDetail(rid)
          if (openRaces.has(rid)) openRaces.get(rid).detail = detail
        } catch {
          /* ignore single race errors */
        }
      }

      app.lastRefreshAt = Date.now()
    } catch (e) {
      console.warn('[results refresh]', e)
    }
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
    error,
    selectedComp,
    compTab,
    races,
    loadingRaces,
    classFilter,
    entries,
    loadingEntries,
    entryClassFilter,
    raceNationPanelOpen,
    raceNationFilter,
    raceNationSearch,
    openRaces,
    raceClasses,
    filteredRaces,
    raceGroups,
    sortedRaceGroupKeys,
    nations,
    filteredEntries,
    entryClasses,
    search,
    selectComp,
    loadEntries,
    setCompTab,
    toggleRaceDetail,
    setRaceTab,
    clearSelection,
    toggleNationPanel,
    setRaceNation,
    toggleFavNation,
    refreshAll,
    initFromSavedComp,
  }
})
