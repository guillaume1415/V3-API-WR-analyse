export function getLocale(lang) {
  return lang === 'fr' ? 'fr-FR' : 'en-GB'
}

export function fmtRelative(ts, t) {
  if (!ts) return '—'
  const sec = Math.max(0, Math.floor((Date.now() - ts) / 1000))
  if (sec < 60) return t('ago_sec', { n: sec })
  if (sec < 3600) return t('ago_min', { n: Math.floor(sec / 60) })
  return t('ago_hour', { n: Math.floor(sec / 3600) })
}

export function fmtDate(d, lang) {
  if (!d) return '—'
  try {
    return new Date(String(d).replace(' ', 'T')).toLocaleDateString(getLocale(lang), {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return d
  }
}

export function fmtTime(dateString, lang) {
  if (!dateString) return '—'
  try {
    return new Date(dateString).toLocaleTimeString(getLocale(lang), {
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return '—'
  }
}

export function fmtDay(dateString, lang) {
  if (!dateString) return '?'
  try {
    return new Date(dateString).toLocaleDateString(getLocale(lang), {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
    })
  } catch {
    return dateString.slice(0, 10)
  }
}

export function fmtResultTime(t) {
  if (!t) return '—'
  return String(t).trim().replace(/^00:/, '')
}
