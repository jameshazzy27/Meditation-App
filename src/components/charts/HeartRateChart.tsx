import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

import { ChartTooltip } from '@/components/charts/ChartTooltip'
import { axisProps, gridProps, lineProps } from '@/components/charts/chartStyle'
import { formatClock, type HrSample } from '@/lib/meditation'

const COLOR = 'var(--meditation)'

/** Heart rate across a session: time along the bottom, beats per minute up the side. */
export function HeartRateChart({ samples, height = 180 }: { samples: HrSample[]; height?: number }) {
  const bpms = samples.map((s) => s.bpm)
  const low = Math.floor((Math.min(...bpms) - 3) / 5) * 5
  const high = Math.ceil((Math.max(...bpms) + 3) / 5) * 5
  const lastT = samples.at(-1)?.t ?? 0
  const step = lastT > 1200 ? 300 : lastT > 480 ? 120 : 60
  const ticks: number[] = []
  for (let t = 0; t <= lastT; t += step) ticks.push(t)

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={samples} margin={{ top: 8, right: 12, bottom: 0, left: -20 }}>
        <CartesianGrid {...gridProps} />
        <XAxis
          dataKey="t"
          type="number"
          domain={[0, Math.max(lastT, 60)]}
          ticks={ticks}
          tickFormatter={(t) => `${Math.round(t / 60)}m`}
          {...axisProps}
        />
        <YAxis domain={[low, high]} allowDecimals={false} width={44} {...axisProps} />
        <Tooltip
          cursor={{ stroke: 'var(--border)' }}
          content={({ active, payload }) => {
            const s = active && (payload?.[0]?.payload as HrSample | undefined)
            if (!s) return null
            return <ChartTooltip heading={formatClock(s.t)} rows={[{ color: COLOR, value: `${s.bpm} bpm` }]} />
          }}
        />
        <Line type="monotone" dataKey="bpm" stroke={COLOR} {...lineProps} dot={false} isAnimationActive={false} />
      </LineChart>
    </ResponsiveContainer>
  )
}
