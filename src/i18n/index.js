import { createI18n } from 'vue-i18n'
import { getLang, setLang as persistLang } from '@/services/storage'
import en from './en.json'
import fr from './fr.json'

export function getStoredLang() {
  return getLang()
}

export function setStoredLang(lang) {
  persistLang(lang)
}

const i18n = createI18n({
  legacy: false,
  locale: getStoredLang(),
  fallbackLocale: 'en',
  messages: { en, fr },
})

export default i18n
