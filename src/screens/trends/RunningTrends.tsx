import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

import { ChartCard, LegendKey } from '@/components/charts/ChartCard'
import { ChartTooltip } from '@/components/charts/ChartTooltip'
import { activeDotProps, axisProps, barProps, CHART_HEIGHT, dotProps, gridProps, lineProps } from '@/components/charts/chartStyle'
import { StatTile } from '@/components/charts/StatTile'
import type { RunType } from '@/data'
import { formatDuration, runTypeLabels } from '@/lib/format'
import { paceByType, shortDate, since, weeklyRuns, weeksBetween } from '@/lib/trends'

import type { TrendsData } from './useTrendsData'

const RUN = 'var(--run)'
// Run types always keep the same colour (validated order: blue, orange, aqua).
const typeColor: Record<RunType, string> = { intervals: 'var(--series-1)', short: 'var(--series-2)', long: 'var(--series-3)' }
const types: RunType[] = ['intervals', 'short', 'long']

const pace = (sec: number) => formatDuration(sec)

export function RunningTrends({ data, start, today }: { data: TrendsData; start: string; today: string }) {
  const runs = since(data.runs, start)
  const weeks = weeklyRuns(runs, weeksBetween(start, today)).map((w) => ({ ...w, label: shortDate(w.week) }))
  const paces = paceByType(data.runs, start).map((row) => ({ ...row, label: shortDate(row.date) }))
  const totalKm = Math.round(runs.reduce((s, r) => s + (r.distanceKm ?? 0), 0) * 10) / 10
  const timed = runs.filter((r) => r.distanceKm && r.durationSec)
  const avgPace = timed.length
    ? timed.reduce((s, r) => s + r.durationSec!, 0) / timed.reduce((s, r) => s + r.distanceKm!, 0)
    : undefined
  const typesPresent = types.filter((t) => paces.some((row) => row[t] !== undefined))
  const paceAxis = niceTimeAxis(paces.flatMap((row) => types.map((t) => row[t]).filter((v): v is number => v !== undefined)))

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2">
        <StatTile label="Distance" value={totalKm} unit="km" className="p-3" />
        <StatTile label="Runs" value={runs.length} className="p-3" />
        <StatTile label="Avg pace" value={avgPace ? pace(avgPace) : '–'} unit={avgPace ? '/km' : undefined} className="p-3" />
      </div>

      <ChartCard
        title="Weekly distance"
        table={{ columns: ['Week of', 'Distance', 'Runs'], rows: [...weeks].reverse().map((w) => [w.label, `${w.km} km`, w.runs]) }}
      >
        <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
          <BarChart data={weeks} margin={{ top: 8, right: 4, bottom: 0, left: -20 }}>
            <CartesianGrid {...gridProps} />
            <XAxis dataKey="label" {...axisProps} minTickGap={12} />
            <YAxis {...axisProps} allowDecimals={false} width={44} />
            <Tooltip
              cursor={{ fill: 'var(--muted)' }}
              content={({ active, payload }) => {
                const w = active && payload?.[0]?.payload
                if (!w) return null
                return <ChartTooltip heading={`Week of ${w.label}`} rows={[{ color: RUN, value: `${w.km} km`, label: `${w.runs} ${w.runs === 1 ? 'run' : 'runs'}` }]} />
              }}
            />
            <Bar dataKey="km" fill={RUN} {...barProps} isAnimationActive={false} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard
        title="Pace by run type"
        description="Higher is faster"
        legend={typesPresent.map((t) => (
          <LegendKey key={t} color={typeColor[t]}>
            {runTypeLabels[t]}
          </LegendKey>
        ))}
        table={{
          columns: ['Date', ...types.map((t) => runTypeLabels[t])],
          rows: [...paces].reverse().map((row) => [row.label, ...types.map((t) => (row[t] !== undefined ? pace(row[t]!) : '–'))]),
        }}
      >
        {paces.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">Log runs with distance and time to see your pace.</p>
        ) : (
          <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
            <LineChart data={paces} margin={{ top: 8, right: 12, bottom: 0, left: -12 }}>
              <CartesianGrid {...gridProps} />
              <XAxis dataKey="label" {...axisProps} minTickGap={16} />
              {/* Reversed so faster (fewer seconds per km) sits higher. */}
              <YAxis {...axisProps} reversed domain={paceAxis.domain} ticks={paceAxis.ticks} tickFormatter={pace} width={52} />
              <Tooltip
                cursor={{ stroke: 'var(--border)' }}
                content={({ active, payload }) => {
                  const row = active && payload?.[0]?.payload
                  if (!row) return null
                  return (
                    <ChartTooltip
                      heading={row.label}
                      rows={types
                        .filter((t) => row[t] !== undefined)
                        .map((t) => ({ color: typeColor[t], value: `${pace(row[t])}/km`, label: runTypeLabels[t] }))}
                    />
                  )
                }}
              />
              {typesPresent.map((t) => (
                <Line
                  key={t}
                  type="monotone"
                  dataKey={t}
                  name={runTypeLabels[t]}
                  stroke={typeColor[t]}
                  {...lineProps}
                  dot={dotProps(typeColor[t])}
                  activeDot={activeDotProps(typeColor[t])}
                  connectNulls
                  isAnimationActive={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      <ChartCard
        title="Runs per week"
        table={{ columns: ['Week of', 'Runs'], rows: [...weeks].reverse().map((w) => [w.label, w.runs]) }}
      >
        <ResponsiveContainer width="100%" height={150}>
          <BarChart data={weeks} margin={{ top: 8, right: 4, bottom: 0, left: -20 }}>
            <CartesianGrid {...gridProps} />
            <XAxis dataKey="label" {...axisProps} minTickGap={12} />
            <YAxis {...axisProps} allowDecimals={false} width={44} />
            <Tooltip
              cursor={{ fill: 'var(--muted)' }}
              content={({ active, payload }) => {
                const w = active && payload?.[0]?.payload
                if (!w) return null
                return <ChartTooltip heading={`Week of ${w.label}`} rows={[{ color: RUN, value: w.runs, label: w.runs === 1 ? 'run' : 'runs' }]} />
              }}
            />
            <Bar dataKey="runs" fill={RUN} {...barProps} isAnimationActive={false} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  )
}

/** Axis for times in seconds, on tidy 30-second (or 1-minute) steps, e.g. 5:00 · 5:30 · 6:00. */
function niceTimeAxis(values: number[]): { domain: [number, number]; ticks: number[] } {
  if (!values.length) return { domain: [240, 420], ticks: [240, 300, 360, 420] }
  const spread = Math.max(...values) - Math.min(...values)
  const step = spread > 150 ? 60 : 30
  const low = Math.floor((Math.min(...values) - 5) / step) * step
  const high = Math.ceil((Math.max(...values) + 5) / step) * step
  const ticks: number[] = []
  for (let t = low; t <= high; t += step) ticks.push(t)
  return { domain: [low, high], ticks }
}
