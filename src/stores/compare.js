import { defineStore } from 'pinia'
import { ref } from 'vue'
import { apiCompetitions, apiEntries } from '@/services/api'
import { COMPETITION_CATEGORIES } from '@/lib/competitions'

function emptySlot(overrides = {}) {
  return {
    year: new Date().getFullYear(),
    category: 'World Rowing Championships',
    competitions: [],
    loading: false,
    searched: false,
    selected: null,
    entries: [],
    loadingEntries: false,
    ...overrides,
  }
}

export const useCompareStore = defineStore('compare', () => {
  const diffTab = ref('events')
  const classFilter = ref(null)
  const nationFilter = ref(null)

  const slotA = ref(
    emptySlot({ category: 'World Rowing Championships' }),
  )
  const slotB = ref(
    emptySlot({ category: 'World Rowing Cup' }),
  )

  async function searchSlot(slotKey) {
    const st = slotKey === 'a' ? slotA : slotB
    st.value.loading = true
    st.value.searched = false
    st.value.competitions = []
    st.value.selected = null
    st.value.entries = []

    try {
      st.value.competitions = await apiCompetitions(st.value.year, st.value.category)
    } catch (e) {
      console.error(e)
      st.value.competitions = []
    } finally {
      st.value.loading = false
      st.value.searched = true
    }
  }

  async function selectComp(slotKey, id) {
    const st = slotKey === 'a' ? slotA : slotB
    st.value.selected = st.value.competitions.find((c) => c.id === id) || null
    st.value.entries = []
    st.value.loadingEntries = true
    classFilter.value = null
    nationFilter.value = null

    try {
      st.value.entries = await apiEntries(id)
    } catch (e) {
      console.error(e)
      st.value.entries = []
    } finally {
      st.value.loadingEntries = false
    }
  }

  return {
    categories: COMPETITION_CATEGORIES,
    diffTab,
    classFilter,
    nationFilter,
    slotA,
    slotB,
    searchSlot,
    selectComp,
  }
})
