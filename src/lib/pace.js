import { fmtDist } from './rank'
import { fmtResultTime } from './format'

export function parseSec(t) {
  if (!t) return null
  const parts = String(t).trim().split(':')
  if (parts.length === 3) return +parts[0] * 3600 + +parts[1] * 60 + parseFloat(parts[2])
  if (parts.length === 2) return +parts[0] * 60 + parseFloat(parts[1])
  return parseFloat(t) || null
}

export function secToSplit(sec) {
  if (sec == null || isNaN(sec) || sec < 0) return '—'
  const m = Math.floor(sec / 60)
  const s = sec - m * 60
  return `${m}:${s.toFixed(2).padStart(5, '0')}`
}

export function buildPaceTable(boats) {
  if (!boats.length) return null

  const sorted = [...boats].sort((a, b) => (a.Rank || 99) - (b.Rank || 99))
  const distMap = new Map()

  for (const b of sorted) {
    for (const i of b.raceBoatIntermediates || []) {
      if (i.distance?.DisplayName && !distMap.has(i.distance.DisplayName)) {
        distMap.set(i.distance.DisplayName, fmtDist(i.distance.DisplayName))
      }
    }
  }

  if (!distMap.size) return null

  const dists = [...distMap.keys()].sort(
    (a, b) => parseInt(a.replace(/\D/g, ''), 10) - parseInt(b.replace(/\D/g, ''), 10),
  )

  const boatIdx = new Map()
  for (const b of sorted) {
    const key = b.id || b.boatId || b.DisplayName
    const dm = new Map()
    for (const i of b.raceBoatIntermediates || []) {
      if (i.distance?.DisplayName) dm.set(i.distance.DisplayName, i)
    }
    boatIdx.set(key, dm)
  }

  const stats = {}
  for (let di = 0; di < dists.length; di++) {
    const d = dists[di]
    const prev = di > 0 ? dists[di - 1] : null
    const cumBySeat = new Map()
    const splitBySeat = new Map()

    for (const b of sorted) {
      const key = b.id || b.boatId || b.DisplayName
      const inter = boatIdx.get(key)?.get(d)
      const cum = parseSec(inter?.ResultTime)
      cumBySeat.set(key, cum)

      if (prev == null) {
        splitBySeat.set(key, cum)
      } else {
        const prevInter = boatIdx.get(key)?.get(prev)
        const prevCum = parseSec(prevInter?.ResultTime)
        splitBySeat.set(key, cum != null && prevCum != null ? cum - prevCum : null)
      }
    }

    const validCums = [...cumBySeat.values()].filter((v) => v != null)
    const leaderCum = validCums.length ? Math.min(...validCums) : null
    const splitEntries = [...splitBySeat.entries()]
      .filter(([, v]) => v != null)
      .sort(([, a], [, b]) => a - b)
    const splitRank = new Map(splitEntries.map(([k], idx) => [k, idx + 1]))

    stats[d] = { cumBySeat, splitBySeat, splitRank, leaderCum }
  }

  return { sorted, distMap, dists, boatIdx, stats, fmtResultTime }
}
