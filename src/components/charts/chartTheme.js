const DARK = {
  paper: '#1a1d27',
  plot: '#1a1d27',
  grid: '#2e3347',
  zero: '#2e3347',
  line: '#2e3347',
  text: '#e2e8f0',
  muted: '#64748b',
  spike: '#94a3b8',
  hoverBg: 'rgba(26,29,39,0.96)',
  hoverBorder: '#2e3347',
}

const LIGHT = {
  paper: '#ffffff',
  plot: '#ffffff',
  grid: '#e2e8f0',
  zero: '#cbd5e1',
  line: '#cbd5e1',
  text: '#1e293b',
  muted: '#64748b',
  spike: '#94a3b8',
  hoverBg: 'rgba(255,255,255,0.96)',
  hoverBorder: '#cbd5e1',
}

export function themeColors(theme) {
  return theme === 'light' ? LIGHT : DARK
}

export function baseLayout(theme, overrides = {}) {
  const c = themeColors(theme)
  return {
    paper_bgcolor: c.paper,
    plot_bgcolor: c.plot,
    font: { color: c.text, family: 'Segoe UI, system-ui, sans-serif', size: 11 },
    margin: { l: 48, r: overrides.yaxis2 ? 48 : 16, t: 28, b: 36 },
    xaxis: {
      title: 'm',
      gridcolor: c.grid,
      zerolinecolor: c.zero,
      linecolor: c.line,
      color: c.muted,
      showspikes: true,
      spikemode: 'across',
      spikesnap: 'cursor',
      spikecolor: c.spike,
      spikethickness: 1,
      spikedash: 'dot',
      hoverformat: '.0f',
      ticksuffix: ' m',
      ...overrides.xaxis,
    },
    yaxis: {
      gridcolor: c.grid,
      zerolinecolor: c.zero,
      linecolor: c.line,
      color: c.muted,
      ...overrides.yaxis,
    },
    ...(overrides.yaxis2
      ? {
          yaxis2: {
            overlaying: 'y',
            side: 'right',
            gridcolor: c.grid,
            zerolinecolor: c.zero,
            linecolor: c.line,
            color: c.muted,
            ...overrides.yaxis2,
          },
        }
      : {}),
    showlegend: false,
    hovermode: 'x unified',
    hoverlabel: {
      bgcolor: c.hoverBg,
      bordercolor: c.hoverBorder,
      font: { color: c.text, size: 11, family: 'Segoe UI, system-ui, sans-serif' },
      align: 'left',
    },
    hoverdistance: -1,
    ...overrides.layout,
  }
}

export const plotConfig = {
  displaylogo: false,
  responsive: true,
  modeBarButtonsToRemove: ['lasso2d', 'select2d'],
}

export function yRange(spec, userScale, values) {
  const ys = values.filter((v) => v != null && isFinite(v))
  let yMin =
    userScale?.yMin != null
      ? userScale.yMin
      : spec.yMin != null
        ? spec.yMin
        : ys.length
          ? Math.min(...ys)
          : 0
  let yMax =
    userScale?.yMax != null
      ? userScale.yMax
      : spec.yMax != null
        ? spec.yMax
        : ys.length
          ? Math.max(...ys)
          : 1
  if (spec.invertY) [yMin, yMax] = [yMax, yMin]
  if (yMin === yMax) yMax = yMin + 1
  return [yMin, yMax]
}

export function buildTraces(lanes, spec, { hiddenLanes, xMin, xMax, yaxis = 'y' }) {
  const traces = []
  lanes.forEach((lane, idx) => {
    if (hiddenLanes.has(lane.id)) return
    const pts = spec
      .seriesFn
      ? spec.seriesFn(lane)
      : spec.getY
        ? (lane.live || [])
            .map((p) => {
              const tr = p.raceBoatTracker || {}
              const x = tr.distanceTravelled
              const y = spec.getY(tr, p)
              return x != null && y != null && isFinite(y) ? { x, y } : null
            })
            .filter(Boolean)
            .sort((a, b) => a.x - b.x)
        : []
    const filtered = pts.filter((p) => p.x >= xMin && p.x <= xMax)
    if (filtered.length < 2) return
    traces.push({
      type: 'scatter',
      mode: 'lines',
      name: lane.DisplayName,
      x: filtered.map((p) => p.x),
      y: filtered.map((p) => p.y),
      line: {
        color: spec.colorFn ? spec.colorFn(lane, idx) : '#5da7f7',
        width: spec.dashed ? 1.4 : 1.8,
        dash: spec.dashed ? 'dash' : 'solid',
      },
      yaxis,
      hovertemplate: `%{y:.2f}<extra>${lane.DisplayName}</extra>`,
    })
  })
  return traces
}
