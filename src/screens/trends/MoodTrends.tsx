import { Bar, BarChart, CartesianGrid, LabelList, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

import { ChartCard, LegendKey } from '@/components/charts/ChartCard'
import { ChartTooltip } from '@/components/charts/ChartTooltip'
import { activeDotProps, axisProps, CHART_HEIGHT, gridProps, lineProps } from '@/components/charts/chartStyle'
import { StatTile } from '@/components/charts/StatTile'
import { addDays } from '@/data'
import { moodLevels, type MoodRating } from '@/lib/mood'
import { dailyMood, moodOnWorkoutDays, shortDate, since, topTags, withWeeklyAverage } from '@/lib/trends'

import type { TrendsData } from './useTrendsData'

const MOOD = 'var(--mood)'
const moodName = (value: number) => moodLevels[Math.min(5, Math.max(1, Math.round(value))) as MoodRating].label
const one = (n: number) => (Math.round(n * 10) / 10).toString()

export function MoodTrends({ data, start }: { data: TrendsData; start: string }) {
  // Average over the week before the range starts too, so the line doesn't wobble at the left edge.
  const days = withWeeklyAverage(dailyMood(data.moods, addDays(start, -6)))
    .filter((d) => d.date >= start)
    .map((d) => ({ ...d, label: shortDate(d.date) }))
  const tags = topTags(data.moods, start)
  const split = moodOnWorkoutDays(data.moods, data.runs, data.sessions, start)
  const entries = since(data.moods, start)
  const avg = entries.length ? entries.reduce((s, m) => s + m.rating, 0) / entries.length : undefined

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        <StatTile
          label="Average mood"
          value={avg !== undefined ? one(avg) : '–'}
          detail={avg !== undefined ? moodName(avg) : 'No moods yet'}
          className="p-3"
        />
        <StatTile label="Check-ins" value={entries.length} detail={`on ${days.length} ${days.length === 1 ? 'day' : 'days'}`} className="p-3" />
        <StatTile
          label="Workout days"
          value={split.workout.average !== undefined ? one(split.workout.average) : '–'}
          detail={`${split.workout.days} ${split.workout.days === 1 ? 'day' : 'days'} with a run or kettlebell`}
          className="p-3"
        />
        <StatTile
          label="Rest days"
          value={split.rest.average !== undefined ? one(split.rest.average) : '–'}
          detail={`${split.rest.days} ${split.rest.days === 1 ? 'day' : 'days'} without`}
          className="p-3"
        />
      </div>

      <ChartCard
        title="Mood over time"
        description="1 (rough) to 5 (great)"
        legend={
          days.length > 0 && (
            <>
              <span className="flex items-center gap-1.5">
                <span aria-hidden className="size-2 rounded-full opacity-40" style={{ background: MOOD }} />
                Each day
              </span>
              <LegendKey color={MOOD}>7-day average</LegendKey>
            </>
          )
        }
        table={{
          columns: ['Date', 'Mood', '7-day avg'],
          rows: [...days].reverse().map((d) => [d.label, `${one(d.mood)} · ${moodName(d.mood)}`, one(d.average)]),
        }}
      >
        {days.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">Log a few moods to see how they change.</p>
        ) : (
          <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
            <LineChart data={days} margin={{ top: 8, right: 12, bottom: 0, left: -8 }}>
              <CartesianGrid {...gridProps} />
              <XAxis dataKey="label" {...axisProps} minTickGap={16} />
              <YAxis {...axisProps} domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} tickFormatter={(v) => moodName(v)} width={52} />
              <Tooltip
                cursor={{ stroke: 'var(--border)' }}
                content={({ active, payload }) => {
                  const d = active && payload?.[0]?.payload
                  if (!d) return null
                  return (
                    <ChartTooltip
                      heading={d.label}
                      rows={[
                        { color: MOOD, value: one(d.mood), label: moodName(d.mood) },
                        { color: MOOD, value: one(d.average), label: '7-day average' },
                      ]}
                    />
                  )
                }}
              />
              {/* Each day as a faint dot (no line), the 7-day average as the line. */}
              <Line dataKey="mood" stroke="none" dot={{ r: 3, fill: MOOD, fillOpacity: 0.35, stroke: 'none' }} activeDot={activeDotProps(MOOD)} isAnimationActive={false} />
              <Line type="monotone" dataKey="average" stroke={MOOD} {...lineProps} dot={false} activeDot={false} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      <ChartCard
        title="Most common tags"
        table={{ columns: ['Tag', 'Times'], rows: tags.map((t) => [t.tag, t.count]) }}
      >
        {tags.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">Tags you add to moods will be counted here.</p>
        ) : (
          <ResponsiveContainer width="100%" height={tags.length * 36 + 8}>
            <BarChart data={tags} layout="vertical" margin={{ top: 0, right: 32, bottom: 0, left: 0 }}>
              <XAxis type="number" hide allowDecimals={false} />
              <YAxis type="category" dataKey="tag" {...axisProps} width={84} tick={{ fill: 'var(--foreground)', fontSize: 13 }} />
              <Tooltip
                cursor={{ fill: 'var(--muted)' }}
                content={({ active, payload }) => {
                  const t = active && payload?.[0]?.payload
                  if (!t) return null
                  return <ChartTooltip heading={t.tag} rows={[{ color: MOOD, value: t.count, label: t.count === 1 ? 'time' : 'times' }]} />
                }}
              />
              <Bar dataKey="count" fill={MOOD} maxBarSize={20} radius={[0, 4, 4, 0]} isAnimationActive={false}>
                <LabelList dataKey="count" position="right" fill="var(--muted-foreground)" fontSize={12} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </ChartCard>
    </div>
  )
}
