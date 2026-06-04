<script setup>
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useLiveStore } from '@/stores/live'
import { laneColor, laneSeriesRecalcSpeed, RECALC_WINDOW } from '@/lib/lanes'
import { baseLayout, buildTraces, plotlyYAxisConfig, yRangeBounds } from '@/components/charts/chartTheme'
import { useAppStore } from '@/stores/app'
import { useI18n } from 'vue-i18n'
import PlotlyChart from '@/components/charts/PlotlyChart.vue'

const store = useLiveStore()
const app = useAppStore()
const { t } = useI18n()

const { lanes, totalLength, hiddenLanes, expandedChart, xZoom, yScales } =
  storeToRefs(store)

const xMin = computed(() => (xZoom.value ? xZoom.value.min : 0))
const xMax = computed(() => (xZoom.value ? xZoom.value.max : totalLength.value))
const nLanes = computed(() => lanes.value.length)

function collectYValues(spec) {
  const ys = []
  for (const lane of lanes.value) {
    if (hiddenLanes.value.has(lane.id)) continue
    const pts = spec.seriesFn
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
        : []
    for (const p of pts) {
      if (p.x >= xMin.value && p.x <= xMax.value) ys.push(p.y)
    }
  }
  return ys
}

function makeSpec(id, titleKey, spec, options = {}) {
  const userScale = yScales.value[id]
  const ys = collectYValues(spec)
  const [dataLo, dataHi] = yRangeBounds(spec, userScale, ys)
  const yAxisCfg = plotlyYAxisConfig(spec, userScale, ys)

  const traces = buildTraces(lanes.value, {
    ...spec,
    colorFn: laneColor,
  }, {
    hiddenLanes: hiddenLanes.value,
    xMin: xMin.value,
    xMax: xMax.value,
    yaxis: options.yaxis || 'y',
  })

  const layout = baseLayout(app.theme, {
    xaxis: { range: [xMin.value, xMax.value] },
    yaxis: {
      title: spec.label,
      tickformat: spec.yDec === 0 ? '.0f' : '.1f',
      ...yAxisCfg,
    },
    layout: { title: { text: t(titleKey, spec.titleParams || {}), font: { size: 11 } } },
    yaxis2: options.yaxis2,
  })

  return {
    id,
    titleKey,
    spec,
    traces,
    layout,
    scaleEditable: options.scaleEditable,
    yMin: dataLo,
    yMax: dataHi,
    userScale,
  }
}

const speedSpec = computed(() => ({
  seriesFn: (l) => laneSeriesRecalcSpeed(l),
  label: t('spec_speed'),
  yMin: 3.5,
  yDec: 1,
  titleParams: { w: RECALC_WINDOW },
  fmt: (v) => `${v.toFixed(2)} m/s`,
}))

const cadenceSpec = computed(() => ({
  getY: (tr) => tr.strokeRate,
  label: t('spec_cadence'),
  yMin: 30,
  yDec: 0,
  dashed: true,
  fmt: (v) => `${v.toFixed(0)} s/m`,
}))

const rankSpec = computed(() => ({
  getY: (tr) => tr.currentPosition,
  label: t('spec_rank'),
  yMin: 1,
  yMax: nLanes.value,
  yDec: 0,
  invertY: true,
  fmt: (v) => `P${Math.round(v)}`,
}))

const gapSpec = computed(() => ({
  getY: (tr) => tr.distanceFromLeader,
  label: t('spec_gap'),
  yMin: 0,
  yDec: 0,
  invertY: true,
  fmt: (v) => (v === 0 ? t('leader_label') : `${v.toFixed(0)} m`),
}))

const charts = computed(() => {
  if (!lanes.value.length) return []
  return [
    makeSpec('speed', 'chart_speed', speedSpec.value, { scaleEditable: true }),
    makeSpec('cadence', 'chart_cadence', cadenceSpec.value, { scaleEditable: true }),
    makeSpec('rank', 'chart_rank', rankSpec.value),
    makeSpec('gap', 'chart_gap', gapSpec.value, { scaleEditable: true }),
  ]
})

const dualChart = computed(() => {
  if (!lanes.value.length) return null
  const speedYs = collectYValues(speedSpec.value)
  const cadYs = collectYValues(cadenceSpec.value)
  const speedY = plotlyYAxisConfig(speedSpec.value, null, speedYs)
  const cadenceY = plotlyYAxisConfig(cadenceSpec.value, null, cadYs)

  const speedTraces = buildTraces(lanes.value, { ...speedSpec.value, colorFn: laneColor }, {
    hiddenLanes: hiddenLanes.value,
    xMin: xMin.value,
    xMax: xMax.value,
    yaxis: 'y',
  })
  const cadTraces = buildTraces(lanes.value, { ...cadenceSpec.value, colorFn: laneColor }, {
    hiddenLanes: hiddenLanes.value,
    xMin: xMin.value,
    xMax: xMax.value,
    yaxis: 'y2',
  })

  return {
    id: 'dual',
    traces: [...speedTraces, ...cadTraces],
    layout: baseLayout(app.theme, {
      xaxis: { range: [xMin.value, xMax.value] },
      yaxis: { title: t('spec_speed'), ...speedY },
      yaxis2: { title: t('spec_cadence'), ...cadenceY },
      layout: { title: { text: t('chart_dual'), font: { size: 11 } } },
    }),
  }
})

const legendItems = computed(() =>
  lanes.value
    .map((lane, idx) => ({
      id: lane.id,
      name: lane.DisplayName || '?',
      color: laneColor(lane, idx),
      hidden: hiddenLanes.value.has(lane.id),
      order: lane.Lane || idx + 1,
    }))
    .sort((a, b) => a.order - b.order),
)

function onYInput(chartId, field, ev) {
  const val = parseFloat(ev.target.value)
  store.setYScale(chartId, field, isNaN(val) ? null : val)
}

function hasYOverride(chartId) {
  const s = yScales.value[chartId]
  return s && (s.yMin != null || s.yMax != null)
}
</script>

<template>
  <div
    v-if="lanes.length"
    class="live-charts"
  >
    <div
      v-for="chart in charts"
      :key="chart.id"
      class="chart"
      :class="{ expanded: expandedChart === chart.id }"
    >
      <div class="chart-head">
        <h3>
          <template v-if="chart.id === 'speed'">
            {{ t('chart_speed') }}
            <span class="zoom-hint">{{ t('chart_speed_hint', { w: RECALC_WINDOW }) }}</span>
          </template>
          <template v-else>
            {{ t(chart.titleKey) }}
          </template>
          <span
            v-if="xZoom"
            class="zoom-hint"
          >[{{ xZoom.min }}–{{ xZoom.max }}m]</span>
        </h3>
        <div class="chart-tools">
          <span
            v-if="chart.scaleEditable"
            class="scale-edit"
          >
            y:
            <input
              type="number"
              step="0.1"
              :value="chart.yMin"
              :title="t('tt_ymin')"
              @change="onYInput(chart.id, 'yMin', $event)"
            >
            <input
              type="number"
              step="0.1"
              :value="chart.yMax"
              :title="t('tt_ymax')"
              @change="onYInput(chart.id, 'yMax', $event)"
            >
            <button
              v-if="hasYOverride(chart.id)"
              type="button"
              :title="t('tt_reset_y')"
              @click="store.resetYScale(chart.id)"
            >
              ↺y
            </button>
          </span>
          <button
            v-if="xZoom"
            type="button"
            :title="t('tt_reset_zoom')"
            @click="store.resetXZoom()"
          >
            ↺
          </button>
          <button
            type="button"
            :title="expandedChart === chart.id ? t('tt_collapse') : t('tt_expand')"
            @click="store.toggleExpanded(chart.id)"
          >
            ⛶
          </button>
        </div>
      </div>
      <PlotlyChart
        :data="chart.traces"
        :layout="chart.layout"
      />
      <div class="chart-legend">
        <span
          v-for="ln in legendItems"
          :key="ln.id"
          :class="{ hidden: ln.hidden }"
          @click="store.toggleLane(ln.id)"
        >
          <i :style="{ background: ln.color }" />
          {{ ln.name }}
        </span>
      </div>
    </div>

    <div
      v-if="dualChart"
      class="chart"
      :class="{ expanded: expandedChart === 'dual' }"
    >
      <div class="chart-head">
        <h3>
          {{ t('chart_dual') }}
          <span
            v-if="xZoom"
            class="zoom-hint"
          >[{{ xZoom.min }}–{{ xZoom.max }}m]</span>
        </h3>
        <div class="chart-tools">
          <button
            v-if="xZoom"
            type="button"
            :title="t('tt_reset_zoom')"
            @click="store.resetXZoom()"
          >
            ↺
          </button>
          <button
            type="button"
            :title="expandedChart === 'dual' ? t('tt_collapse') : t('tt_expand')"
            @click="store.toggleExpanded('dual')"
          >
            ⛶
          </button>
        </div>
      </div>
      <PlotlyChart
        :data="dualChart.traces"
        :layout="dualChart.layout"
      />
      <div class="chart-legend">
        <span
          v-for="ln in legendItems"
          :key="ln.id"
          :class="{ hidden: ln.hidden }"
          @click="store.toggleLane(ln.id)"
        >
          <i :style="{ background: ln.color }" />
          {{ ln.name }}
        </span>
      </div>
    </div>
  </div>
</template>
