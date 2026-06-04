export function rankClass(r) {
  if (r === 1) return 'rank-1'
  if (r === 2) return 'rank-2'
  if (r === 3) return 'rank-3'
  return ''
}

export function rankEmoji(r) {
  if (r === 1) return '🥇'
  if (r === 2) return '🥈'
  if (r === 3) return '🥉'
  return r || '—'
}

export function fmtDist(raw) {
  const n = parseInt(String(raw || '').replace(/\D/g, ''), 10)
  if (!n) return raw || '—'
  return n >= 1000 ? `${n / 1000}k` : `${n}m`
}
