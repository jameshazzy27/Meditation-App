import { useState } from 'react'
import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

import { ChartCard } from '@/components/charts/ChartCard'
import { ChartTooltip } from '@/components/charts/ChartTooltip'
import { activeDotProps, axisProps, CHART_HEIGHT, dotProps, gridProps, lineProps } from '@/components/charts/chartStyle'
import { StatTile } from '@/components/charts/StatTile'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { kettlebellPoints, sessionsBeatingTarget, shortDate, since, SIZE_UP_AFTER } from '@/lib/trends'
import { cn } from '@/lib/utils'

import { SizeUpNotice } from './SizeUpNotice'
import type { TrendsData } from './useTrendsData'

const COLOR = 'var(--kettlebell)'

export function KettlebellTrends({ data, start }: { data: TrendsData; start: string }) {
  // Complexes with sessions in this range, plus any active ones (so a new complex is still pickable).
  const inRange = since(data.sessions, start)
  const shown = data.complexes
    .filter((c) => !c.archived || inRange.some((s) => s.complexId === c.id))
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }))
  const mostUsed = shown
    .map((c) => ({ c, n: inRange.filter((s) => s.complexId === c.id).length }))
    .sort((a, b) => b.n - a.n)[0]?.c
  const [chosenId, setChosenId] = useState<string>()
  const complex = shown.find((c) => c.id === chosenId) ?? mostUsed

  if (!complex) {
    return (
      <Card className="border-dashed bg-transparent shadow-none">
        <CardHeader className="text-center">
          <CardTitle>No kettlebell sessions yet</CardTitle>
          <CardDescription>Log a few sessions and your rounds will show up here.</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const points = kettlebellPoints(data.sessions, complex.id, start)
  const withRounds = points.filter((p) => p.rounds !== undefined)
  const chartData = points.map((p, i) => ({ ...p, key: `${i}`, label: shortDate(p.date) }))
  const target = complex.targetRounds
  const beating = sessionsBeatingTarget(data.sessions, complex.id, target)
  const best = withRounds.length ? Math.max(...withRounds.map((p) => p.rounds!)) : undefined
  const latestWeight = [...points].reverse().find((p) => p.weightKg !== undefined)?.weightKg
  const maxY = Math.max(best ?? 0, target ?? 0) + 1

  return (
    <div className="space-y-4">
      <div role="radiogroup" aria-label="Complex" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        {shown.map((c) => (
          <button
            key={c.id}
            type="button"
            role="radio"
            aria-checked={c.id === complex.id}
            onClick={() => setChosenId(c.id)}
            className={cn(
              'h-9 shrink-0 rounded-md px-4 text-sm font-medium transition-colors',
              c.id === complex.id ? 'bg-kettlebell text-white dark:text-background' : 'bg-muted text-muted-foreground',
            )}
          >
            {c.name}
          </button>
        ))}
      </div>

      {target !== undefined && beating >= SIZE_UP_AFTER && (
        <SizeUpNotice complexName={complex.name} target={target} sessions={beating} />
      )}

      <div className="grid grid-cols-3 gap-2">
        <StatTile label="Sessions" value={points.length} className="p-3" />
        <StatTile label="Best" value={best ?? '–'} unit={best !== undefined ? 'rds' : undefined} className="p-3" />
        <StatTile label="Bell" value={latestWeight ?? '–'} unit={latestWeight !== undefined ? 'kg' : undefined} className="p-3" />
      </div>

      <ChartCard
        title={`Rounds per session · ${complex.name}`}
        description={target !== undefined ? `Dashed line is your target of ${target}` : 'Set a target on the complex to see a target line'}
        table={{
          columns: ['Date', 'Rounds', 'Weight'],
          rows: [...points].reverse().map((p) => [shortDate(p.date), p.rounds ?? '–', p.weightKg !== undefined ? `${p.weightKg} kg` : '–']),
        }}
      >
        {withRounds.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">No rounds logged for {complex.name} in this range.</p>
        ) : (
          <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
            <LineChart data={chartData} margin={{ top: 8, right: 12, bottom: 0, left: -20 }}>
              <CartesianGrid {...gridProps} />
              <XAxis dataKey="key" {...axisProps} tickFormatter={(k) => chartData[Number(k)]?.label ?? ''} minTickGap={16} />
              <YAxis {...axisProps} allowDecimals={false} domain={[0, maxY]} width={44} />
              {target !== undefined && (
                <ReferenceLine
                  y={target}
                  stroke="var(--muted-foreground)"
                  strokeDasharray="4 4"
                  label={{ value: `Target ${target}`, position: 'insideTopLeft', fill: 'var(--muted-foreground)', fontSize: 12 }}
                />
              )}
              <Tooltip
                cursor={{ stroke: 'var(--border)' }}
                content={({ active, payload }) => {
                  const p = active && payload?.[0]?.payload
                  if (!p) return null
                  return (
                    <ChartTooltip
                      heading={shortDate(p.date)}
                      rows={[{ color: COLOR, value: `${p.rounds ?? '–'} rounds`, label: p.weightKg !== undefined ? `${p.weightKg} kg` : undefined }]}
                    />
                  )
                }}
              />
              <Line
                type="monotone"
                dataKey="rounds"
                stroke={COLOR}
                {...lineProps}
                dot={dotProps(COLOR)}
                activeDot={activeDotProps(COLOR)}
                connectNulls
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </ChartCard>
    </div>
  )
}
