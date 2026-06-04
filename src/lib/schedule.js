export function dayKey(dateString) {
  if (!dateString) return '?'
  try {
    return new Date(dateString).toISOString().slice(0, 10)
  } catch {
    return dateString.slice(0, 10)
  }
}

export function phaseBadgeClass(phase) {
  if (!phase) return 'badge-prelim'
  const p = phase.toLowerCase()
  if (p.includes('final') && !p.includes('semi') && !p.includes('quarter')) return 'badge-final'
  if (p.includes('semi')) return 'badge-semi'
  if (p.includes('quarter')) return 'badge-quarter'
  if (p.includes('heat')) return 'badge-heat'
  if (p.includes('prelim')) return 'badge-prelim'
  return 'badge-prelim'
}

export function statusBadgeClass(status) {
  if (!status) return 'badge-scheduled'
  const s = status.toLowerCase()
  if (s.includes('official')) return 'badge-official'
  if (s.includes('start')) return 'badge-startlist'
  if (s.includes('cancelled')) return 'badge-cancelled'
  return 'badge-scheduled'
}

export function nationCodesFromEntries(entries, fullName) {
  const codes = new Set()
  if (!fullName) return []
  for (const evt of entries) {
    for (const boat of evt.boats || []) {
      const code = boat.DisplayName
      if (!code) continue
      const label = boat.country?.DisplayName || code
      if (label === fullName || boat.country?.DisplayName === fullName || code === fullName) {
        codes.add(code)
      }
    }
  }
  if (!codes.size) codes.add(fullName)
  return [...codes]
}

export function raceMatchesNationCodes(race, codes) {
  const set = new Set(codes)
  return (race.raceBoats || []).some((b) => b.DisplayName && set.has(b.DisplayName))
}

export function isOngoingComp(comp) {
  const today = new Date().toISOString().slice(0, 10)
  const start = String(comp.StartDate || '').slice(0, 10)
  const end = String(comp.EndDate || '').slice(0, 10)
  return start && end && start <= today && today <= end
}

export function collectNationsFromEntries(entries) {
  return [
    ...new Set(
      entries.flatMap((evt) =>
        (evt.boats || []).map((b) => b.country?.DisplayName || b.DisplayName || '?'),
      ),
    ),
  ].sort()
}
