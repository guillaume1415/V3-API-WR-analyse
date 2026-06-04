import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { getStoredLang, setStoredLang } from '@/i18n'
import i18n from '@/i18n'
import {
  getTheme,
  setTheme,
  getNotifEnabled,
  setNotifEnabled,
  getFavNation,
  setFavNation,
  getFavRecents,
  addFavRecent,
  getUseProxy,
  setUseProxy,
} from '@/services/storage'

export const useAppStore = defineStore('app', () => {
  const theme = ref(getTheme())
  const notificationsOn = ref(getNotifEnabled())
  const favoriteNation = ref(getFavNation() || '')
  /** Plus récent en premier — max 5 (wr-fav-recents) */
  const favRecents = ref(getFavRecents())
  const useProxy = ref(getUseProxy())
  const lastRefreshAt = ref(null)
  const compareMode = ref(false)

  function applyThemeClass() {
    document.body.classList.toggle('light', theme.value === 'light')
  }

  function toggleTheme() {
    theme.value = theme.value === 'light' ? 'dark' : 'light'
    setTheme(theme.value)
    applyThemeClass()
  }

  function toggleLang() {
    const next = i18n.global.locale.value === 'en' ? 'fr' : 'en'
    i18n.global.locale.value = next
    setStoredLang(next)
    document.documentElement.lang = next
  }

  function toggleNotifications() {
    if (!notificationsOn.value && !('Notification' in window)) {
      alert(i18n.global.t('notif_no_browser'))
      return
    }
    notificationsOn.value = !notificationsOn.value
    setNotifEnabled(notificationsOn.value)
  }

  function toggleCompare() {
    compareMode.value = !compareMode.value
  }

  function toggleProxySetting() {
    useProxy.value = !useProxy.value
    setUseProxy(useProxy.value)
  }

  function refreshFavoriteNation() {
    favoriteNation.value = getFavNation() || ''
  }

  function refreshRecents() {
    favRecents.value = getFavRecents()
  }

  /** Ajoute aux récents (5 derniers clics) sans définir favori */
  function pushRecent(nation) {
    if (!nation) return
    addFavRecent(nation)
    refreshRecents()
  }

  function setFavorite(nation) {
    if (nation) {
      setFavNation(nation)
      addFavRecent(nation)
    } else {
      setFavNation(null)
    }
    refreshFavoriteNation()
    refreshRecents()
  }

  function init() {
    applyThemeClass()
    document.documentElement.lang = getStoredLang()
    refreshFavoriteNation()
    refreshRecents()
  }

  watch(theme, applyThemeClass, { immediate: true })

  return {
    theme,
    notificationsOn,
    favoriteNation,
    favRecents,
    useProxy,
    lastRefreshAt,
    compareMode,
    pushRecent,
    refreshRecents,
    toggleTheme,
    toggleLang,
    toggleNotifications,
    toggleCompare,
    toggleProxySetting,
    refreshFavoriteNation,
    setFavorite,
    init,
  }
})
