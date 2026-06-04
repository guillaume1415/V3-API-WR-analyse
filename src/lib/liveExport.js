function csvEscape(v) {
  const s = v == null ? '' : String(v)
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 2000)
}

export function exportBaseFilename(selectedComp, selectedRace) {
  const comp = selectedComp?.CompetitionCode || selectedComp?.id || 'comp'
  const raceId = selectedRace?.id || 'race'
  const d = new Date()
  const stamp =
    d.getFullYear() +
    String(d.getMonth() + 1).padStart(2, '0') +
    String(d.getDate()).padStart(2, '0') +
    '-' +
    String(d.getHours()).padStart(2, '0') +
    String(d.getMinutes()).padStart(2, '0')
  return `WR_live_${comp}_${raceId}_${stamp}`
}

function collectLiveCsvRows(lanes) {
  const rows = []
  for (const lane of lanes) {
    const nation = lane.DisplayName || '?'
    const points =
      lane.live && lane.live.length ? lane.live : lane.currentPoint ? [lane.currentPoint] : []
    for (const p of points) {
      const tr = p.raceBoatTracker || {}
      const dist = tr.distanceTravelled
      if (dist == null || !isFinite(dist)) continue
      rows.push({
        nation,
        distance_m: dist,
        speed_m_s: tr.metrePerSecond ?? '',
        cadence: tr.strokeRate ?? '',
        gap_to_leader_m: tr.distanceFromLeader ?? '',
      })
    }
  }
  rows.sort((a, b) => {
    const nc = a.nation.localeCompare(b.nation)
    if (nc !== 0) return nc
    return a.distance_m - b.distance_m
  })
  return rows
}

export function exportLiveCsv(trackerData, selectedComp, selectedRace, t) {
  const cfg = trackerData?.config
  if (!cfg?.lanes?.length) return false

  const race = cfg.race || {}
  const cls = race.event?.boatClass?.DisplayName || ''
  const exported = new Date().toISOString()
  const rows = collectLiveCsvRows(cfg.lanes)
  if (!rows.length) return false

  const lines = [
    `# ${t('csv_meta_race')},${csvEscape(race.DisplayName || '')}`,
    `# ${t('csv_meta_class')},${csvEscape(cls)}`,
    `# ${t('csv_meta_exported')},${csvEscape(exported)}`,
    [
      t('csv_nation'),
      t('csv_distance_m'),
      t('csv_speed_ms'),
      t('csv_cadence'),
      t('csv_gap_leader_m'),
    ].join(','),
  ]
  for (const r of rows) {
    lines.push(
      [csvEscape(r.nation), r.distance_m, r.speed_m_s, r.cadence, r.gap_to_leader_m].join(','),
    )
  }

  const blob = new Blob([`${lines.join('\n')}\n`], { type: 'text/csv;charset=utf-8' })
  downloadBlob(blob, `${exportBaseFilename(selectedComp, selectedRace)}.csv`)
  return true
}
