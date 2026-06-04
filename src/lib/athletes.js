export function positionRank(pos) {
  const p = String(pos ?? '')
    .trim()
    .toUpperCase()
  if (p === 'C' || p.startsWith('COX')) return -1
  if (p === 'S' || p.startsWith('STR')) return 0
  if (p === 'B' || p.startsWith('BOW')) return 999
  const n = parseInt(p, 10)
  if (!isNaN(n)) return 100 - n
  return 500
}

export function sortAthletes(arr, getPos) {
  const fn = getPos || ((a) => a.position ?? a.boatPosition)
  return [...arr].sort((a, b) => positionRank(fn(a)) - positionRank(fn(b)))
}

export function formatAthleteNames(athletes) {
  const sorted = sortAthletes(athletes, (a) => a.boatPosition)
  if (!sorted.length) return '—'
  return sorted
    .map((a) => {
      const p = a.person || {}
      const nm = [p.FirstName, p.LastName].filter(Boolean).join(' ') || p.DisplayName || '?'
      return a.boatPosition ? `${a.boatPosition}· ${nm}` : nm
    })
    .join(' · ')
}
