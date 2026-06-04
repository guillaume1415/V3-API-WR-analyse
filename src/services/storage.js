const KEYS = {
  lang: 'wr-lang',
  theme: 'wr-theme',
  notifEnabled: 'wr-notif-enabled',
  favNation: 'wr-fav-nation',
  favRecents: 'wr-fav-recents',
  selectedComp: 'wr-selected-comp',
  nationRaces: 'wr-nation-races',
  nationSchedule: 'wr-nation-schedule',
  useProxy: 'wr-use-proxy',
  analysePrefs: 'wr_analyse_prefs',
}

function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function writeJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
}

export function getLang() {
  return localStorage.getItem(KEYS.lang) || 'en'
}

export function setLang(lang) {
  localStorage.setItem(KEYS.lang, lang)
}

export function getTheme() {
  return localStorage.getItem(KEYS.theme) === 'light' ? 'light' : 'dark'
}

export function setTheme(theme) {
  localStorage.setItem(KEYS.theme, theme)
}

export function getNotifEnabled() {
  return localStorage.getItem(KEYS.notifEnabled) === 'on'
}

export function setNotifEnabled(on) {
  localStorage.setItem(KEYS.notifEnabled, on ? 'on' : 'off')
}

export function getFavNation() {
  return localStorage.getItem(KEYS.favNation) || null
}

export function setFavNation(nation) {
  if (nation) localStorage.setItem(KEYS.favNation, nation)
  else localStorage.removeItem(KEYS.favNation)
}

export function getFavRecents() {
  return readJson(KEYS.favRecents, [])
}

export function setFavRecents(list) {
  writeJson(KEYS.favRecents, list.slice(0, 5))
}

export function addFavRecent(nation) {
  const list = getFavRecents().filter((n) => n !== nation)
  list.unshift(nation)
  setFavRecents(list)
}

export function getSelectedComp() {
  return readJson(KEYS.selectedComp, null)
}

export function setSelectedComp(comp) {
  if (comp) writeJson(KEYS.selectedComp, comp)
  else localStorage.removeItem(KEYS.selectedComp)
}

export function getNationRacesFilter() {
  return localStorage.getItem(KEYS.nationRaces) || getFavNation() || null
}

export function setNationRacesFilter(nation) {
  if (nation) localStorage.setItem(KEYS.nationRaces, nation)
  else localStorage.removeItem(KEYS.nationRaces)
}

export function getNationScheduleFilter() {
  return localStorage.getItem(KEYS.nationSchedule) || getFavNation() || null
}

export function setNationScheduleFilter(nation) {
  if (nation) localStorage.setItem(KEYS.nationSchedule, nation)
  else localStorage.removeItem(KEYS.nationSchedule)
}

export function getAnalysePrefs() {
  return readJson(KEYS.analysePrefs, {})
}

export function setAnalysePrefs(prefs) {
  writeJson(KEYS.analysePrefs, prefs)
}

/** Proxy toggle — compatible wr_analyse_prefs.proxy et clé dédiée wr-use-proxy */
export function getUseProxy() {
  const dedicated = localStorage.getItem(KEYS.useProxy)
  if (dedicated != null) return dedicated === 'true'
  return !!getAnalysePrefs().proxy
}

export function setUseProxy(useProxy) {
  localStorage.setItem(KEYS.useProxy, useProxy ? 'true' : 'false')
  const prefs = getAnalysePrefs()
  prefs.proxy = useProxy
  setAnalysePrefs(prefs)
}

export function getNotifShownKey(date = new Date()) {
  return `wr-notif-shown-${date.toISOString().slice(0, 10)}`
}

export function loadNotifShownToday(date = new Date()) {
  return new Set(readJson(getNotifShownKey(date), []))
}

export function saveNotifShownToday(set, date = new Date()) {
  writeJson(getNotifShownKey(date), [...set])
}

export { KEYS as STORAGE_KEYS }
