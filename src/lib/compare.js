import { sortClasses, boatClassSortKey } from './boatClass'
import { sortAthletes, positionRank } from './athletes'

export function flattenEntries(events) {
  const result = new Map()
  for (const evt of events || []) {
    const cls = evt.boatClass?.DisplayName || 'Autre'
    if (!result.has(cls)) result.set(cls, new Map())
    const byCountry = result.get(cls)
    for (const boat of evt.boats || []) {
      const country = boat.country?.DisplayName || boat.DisplayName || '—'
      if (!byCountry.has(country)) byCountry.set(country, new Map())
      const athletes = byCountry.get(country)
      for (const ba of boat.boatAthletes || []) {
        const p = ba.person || {}
        const name = [p.FirstName, p.LastName].filter(Boolean).join(' ') || p.DisplayName || '?'
        const position = ba.boatPosition != null ? String(ba.boatPosition) : ''
        athletes.set(String(ba.personId), { name, position })
      }
    }
  }
  return result
}

export function buildDiff(entriesA, entriesB) {
  const mapA = flattenEntries(entriesA)
  const mapB = flattenEntries(entriesB)
  const classSet = new Set([...mapA.keys(), ...mapB.keys()])
  const classes = sortClasses([...classSet])
  const byClass = {}

  const sortByPos = (a, b) => {
    const ra = positionRank(a.position)
    const rb = positionRank(b.position)
    return ra - rb || (a.name || '').localeCompare(b.name || '')
  }

  for (const cls of classes) {
    const cA = mapA.get(cls) || new Map()
    const cB = mapB.get(cls) || new Map()
    const countries = [...new Set([...cA.keys(), ...cB.keys()])].sort()
    const byCountry = {}

    for (const country of countries) {
      const athA = cA.get(country) || new Map()
      const athB = cB.get(country) || new Map()
      const added = []
      const removed = []
      const same = []

      for (const [id, info] of athB) {
        const prev = athA.get(id)
        if (!prev) added.push({ id, ...info })
        else same.push({ id, ...info, prevPosition: prev.position })
      }

      for (const [id, info] of athA) {
        if (!athB.has(id)) removed.push({ id, ...info })
      }

      added.sort(sortByPos)
      removed.sort(sortByPos)
      same.sort(sortByPos)

      byCountry[country] = { added, removed, same }
    }
    byClass[cls] = { countries, byCountry }
  }
  return { classes, byClass }
}

export function buildNationDiff(entriesA, entriesB, classFilter = null) {
  function flatByNation(events) {
    const map = new Map()
    for (const evt of events || []) {
      const cls = evt.boatClass?.DisplayName || 'Autre'
      if (classFilter && cls !== classFilter) continue
      for (const boat of evt.boats || []) {
        const country = boat.country?.DisplayName || boat.DisplayName || '—'
        if (!map.has(country)) map.set(country, new Map())
        const athletes = map.get(country)
        for (const ba of boat.boatAthletes || []) {
          const p = ba.person || {}
          const name = [p.FirstName, p.LastName].filter(Boolean).join(' ') || p.DisplayName || '?'
          athletes.set(String(ba.personId), name)
        }
      }
    }
    return map
  }

  const mapA = flatByNation(entriesA)
  const mapB = flatByNation(entriesB)
  const countries = [...new Set([...mapA.keys(), ...mapB.keys()])].sort()

  let totalAdded = 0
  let totalRemoved = 0
  let totalSame = 0
  const nations = {}

  for (const country of countries) {
    const athA = mapA.get(country) || new Map()
    const athB = mapB.get(country) || new Map()
    const added = []
    const removed = []
    const same = []

    for (const [id, name] of athB) {
      if (athA.has(id)) same.push({ id, name })
      else added.push({ id, name })
    }

    for (const [id, name] of athA) {
      if (!athB.has(id)) removed.push({ id, name })
    }

    nations[country] = { added, removed, same }
    totalAdded += added.length
    totalRemoved += removed.length
    totalSame += same.length
  }

  return { nations, countries, totalAdded, totalRemoved, totalSame }
}

export function findDuplicateBoats(events) {
  const byClass = new Map()
  for (const evt of events || []) {
    const cls = evt.boatClass?.DisplayName || 'Autre'
    if (!byClass.has(cls)) byClass.set(cls, new Map())
    const byCountry = byClass.get(cls)
    for (const boat of evt.boats || []) {
      const country = boat.country?.DisplayName || boat.DisplayName || '—'
      if (!byCountry.has(country)) byCountry.set(country, [])
      byCountry.get(country).push(boat)
    }
  }
  const result = []
  for (const [cls, byCountry] of byClass) {
    for (const [country, boats] of byCountry) {
      if (boats.length >= 2) result.push({ cls, country, boats })
    }
  }
  result.sort((a, b) => {
    const ka = boatClassSortKey(a.cls)
    const kb = boatClassSortKey(b.cls)
    return (
      ka[0] - kb[0] ||
      ka[1] - kb[1] ||
      ka[2].localeCompare(kb[2]) ||
      a.country.localeCompare(b.country)
    )
  })
  return result
}

export function athleteLabelParts(a, kind) {
  const pos = a.position || ''
  if (kind === 'same' && a.prevPosition && a.prevPosition !== a.position) {
    return { name: a.name, suffix: `(${a.prevPosition}→${pos || '?'})`, changed: true }
  }
  return { name: a.name, suffix: pos ? `(${pos})` : '', changed: false }
}
