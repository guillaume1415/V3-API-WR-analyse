import { createI18n } from 'vue-i18n'
import en from './en.json'
import fr from './fr.json'

const STORAGE_KEY = 'wr-lang'

export function getStoredLang() {
  return localStorage.getItem(STORAGE_KEY) || 'en'
}

export function setStoredLang(lang) {
  localStorage.setItem(STORAGE_KEY, lang)
}

const i18n = createI18n({
  legacy: false,
  locale: getStoredLang(),
  fallbackLocale: 'en',
  messages: { en, fr },
})

export default i18n
