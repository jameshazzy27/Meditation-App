import { Bar, BarChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

import { ChartCard } from '@/components/charts/ChartCard'
import { ChartTooltip } from '@/components/charts/ChartTooltip'
import { axisProps, barProps, CHART_HEIGHT, gridProps } from '@/components/charts/chartStyle'
import { StatTile } from '@/components/charts/StatTile'
import { heartRateDrops, shortDate, since, weeklyMeditation, weeksBetween } from '@/lib/trends'

import type { TrendsData } from './useTrendsData'

const COLOR = 'var(--meditation)'

export function MeditationTrends({ data, start, today }: { data: TrendsData; start: string; today: string }) {
  const sessions = since(data.meditations, start)
  const weeks = weeklyMeditation(sessions, weeksBetween(start, today)).map((w) => ({ ...w, label: shortDate(w.week) }))
  const drops = heartRateDrops(data.meditations, start).map((d, i) => ({ ...d, key: `${i}`, label: shortDate(d.date) }))
  const totalMin = Math.round(sessions.reduce((s, m) => s + m.durationSec, 0) / 60)
  const avgDrop = drops.length ? Math.round((drops.reduce((s, d) => s + d.drop, 0) / drops.length) * 10) / 10 : undefined

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2">
        <StatTile label="Sessions" value={sessions.length} className="p-3" />
        <StatTile label="Minutes" value={totalMin} className="p-3" />
        <StatTile label="Avg HR drop" value={avgDrop ?? '–'} unit={avgDrop !== undefined ? 'bpm' : undefined} className="p-3" />
      </div>

      <ChartCard
        title="Minutes per week"
        table={{ columns: ['Week of', 'Minutes', 'Sessions'], rows: [...weeks].reverse().map((w) => [w.label, w.minutes, w.sessions]) }}
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
                return (
                  <ChartTooltip
                    heading={`Week of ${w.label}`}
                    rows={[{ color: COLOR, value: `${w.minutes} min`, label: `${w.sessions} ${w.sessions === 1 ? 'session' : 'sessions'}` }]}
                  />
                )
              }}
            />
            <Bar dataKey="minutes" fill={COLOR} {...barProps} isAnimationActive={false} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard
        title="Heart-rate drop per session"
        description="First minute vs last minute — higher means you settled more"
        table={{ columns: ['Date', 'Drop', 'Average'], rows: [...drops].reverse().map((d) => [d.label, `${d.drop} bpm`, `${d.avgBpm} bpm`]) }}
      >
        {drops.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            Sessions with a heart-rate monitor connected will show here.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
            <BarChart data={drops} margin={{ top: 8, right: 4, bottom: 0, left: -20 }}>
              <CartesianGrid {...gridProps} />
              <XAxis dataKey="key" {...axisProps} tickFormatter={(k) => drops[Number(k)]?.label ?? ''} minTickGap={12} />
              <YAxis {...axisProps} allowDecimals={false} width={44} />
              <ReferenceLine y={0} stroke="var(--muted-foreground)" />
              <Tooltip
                cursor={{ fill: 'var(--muted)' }}
                content={({ active, payload }) => {
                  const d = active && payload?.[0]?.payload
                  if (!d) return null
                  return (
                    <ChartTooltip
                      heading={d.label}
                      rows={[{ color: COLOR, value: `${d.drop > 0 ? '−' : d.drop < 0 ? '+' : ''}${Math.abs(d.drop)} bpm`, label: `avg ${d.avgBpm}` }]}
                    />
                  )
                }}
              />
              <Bar dataKey="drop" fill={COLOR} {...barProps} isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </ChartCard>
    </div>
  )
}
