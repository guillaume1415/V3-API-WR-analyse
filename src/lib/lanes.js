export const LANE_COLORS = [
  '#ff6b6b',
  '#4dd0a8',
  '#ffb454',
  '#5da7f7',
  '#c084fc',
  '#ec4899',
  '#facc15',
  '#22d3ee',
]

export const RECALC_WINDOW = 5

export function laneColor(lane, idx) {
  return LANE_COLORS[((lane.Lane || idx + 1) - 1) % LANE_COLORS.length]
}

function recomputeSpeeds(pts, w) {
  const n = pts.length
  const out = new Array(n)
  for (let i = 0; i < n; i++) {
    const lo = Math.max(0, i - w)
    const hi = Math.min(n - 1, i + w)
    const dt = pts[hi].t - pts[lo].t
    const dd = pts[hi].d - pts[lo].d
    out[i] = dt > 0 ? dd / dt : null
  }
  return out
}

export function laneSeriesPts(lane) {
  const raw = []
  for (const p of lane.live || []) {
    const tr = p.raceBoatTracker || {}
    if (tr.distanceTravelled == null) continue
    raw.push({
      x: tr.distanceTravelled,
      t: p.trackCount,
      d: tr.distanceTravelled,
      _raceBoatId: tr.raceBoatId || null,
    })
  }
  if (!raw.length) return []

  const segments = []
  let current = [raw[0]]
  for (let i = 1; i < raw.length; i++) {
    const dx = raw[i].x - raw[i - 1].x
    if (
      dx < -100 ||
      (raw[i]._raceBoatId &&
        raw[i - 1]._raceBoatId &&
        raw[i]._raceBoatId !== raw[i - 1]._raceBoatId)
    ) {
      segments.push(current)
      current = [raw[i]]
    } else {
      current.push(raw[i])
    }
  }
  segments.push(current)

  let best = segments[0]
  let bestMax = Math.max(...best.map((p) => p.x))
  for (const seg of segments.slice(1)) {
    const mx = Math.max(...seg.map((p) => p.x))
    if (mx > bestMax || (mx === bestMax && seg.length > best.length)) {
      best = seg
      bestMax = mx
    }
  }
  best.sort((a, b) => a.x - b.x)
  return best
}

export function laneSeriesRecalcSpeed(lane, w = RECALC_WINDOW) {
  const pts = laneSeriesPts(lane)
  if (!pts.length) return []
  const vCalc = recomputeSpeeds(pts, w)
  return pts
    .map((p, i) =>
      vCalc[i] != null && isFinite(vCalc[i]) ? { x: p.x, y: vCalc[i] } : null,
    )
    .filter(Boolean)
}

export function laneSeries(lane, getY) {
  return (lane.live || [])
    .map((p) => {
      const t = p.raceBoatTracker || {}
      const x = t.distanceTravelled
      const y = getY(t, p)
      return x != null && y != null && isFinite(y) ? { x, y } : null
    })
    .filter(Boolean)
    .sort((a, b) => a.x - b.x)
}

export function laneSeriesForSpec(lane, sp) {
  if (sp.seriesFn) return sp.seriesFn(lane)
  return laneSeries(lane, sp.getY)
}

export function sortedLanes(lanes) {
  return [...lanes].sort((a, b) => (a.Lane || 99) - (b.Lane || 99))
}

export function rankedLanes(lanes) {
  return [...lanes].sort((a, b) => {
    const ap = a.currentPoint?.raceBoatTracker?.currentPosition || 99
    const bp = b.currentPoint?.raceBoatTracker?.currentPosition || 99
    return ap - bp
  })
}
