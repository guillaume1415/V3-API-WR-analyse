import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { getStoredLang, setStoredLang } from '@/i18n'
import i18n from '@/i18n'

const THEME_KEY = 'wr-theme'
const NOTIF_KEY = 'wr-notif-enabled'
const FAV_KEY = 'wr-fav-nation'

export const useAppStore = defineStore('app', () => {
  const theme = ref(localStorage.getItem(THEME_KEY) === 'light' ? 'light' : 'dark')
  const notificationsOn = ref(localStorage.getItem(NOTIF_KEY) === 'on')
  const favoriteNation = ref(localStorage.getItem(FAV_KEY) || '')
  const lastRefreshAt = ref(null)

  function applyThemeClass() {
    document.body.classList.toggle('light', theme.value === 'light')
  }

  function toggleTheme() {
    theme.value = theme.value === 'light' ? 'dark' : 'light'
    localStorage.setItem(THEME_KEY, theme.value)
    applyThemeClass()
  }

  function toggleLang() {
    const next = i18n.global.locale.value === 'en' ? 'fr' : 'en'
    i18n.global.locale.value = next
    setStoredLang(next)
    document.documentElement.lang = next
  }

  function toggleNotifications() {
    notificationsOn.value = !notificationsOn.value
    localStorage.setItem(NOTIF_KEY, notificationsOn.value ? 'on' : 'off')
  }

  function init() {
    applyThemeClass()
    document.documentElement.lang = getStoredLang()
  }

  watch(theme, applyThemeClass, { immediate: true })

  return {
    theme,
    notificationsOn,
    favoriteNation,
    lastRefreshAt,
    toggleTheme,
    toggleLang,
    toggleNotifications,
    init,
  }
})
