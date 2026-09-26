import { useSearchParams } from 'react-router'

import { ChoiceChips } from '@/components/ChoiceChips'
import { ScreenHeader } from '@/components/ScreenHeader'
import { todayKey } from '@/data'
import { rangeStart, type TimeRange } from '@/lib/trends'

import { KettlebellTrends } from './KettlebellTrends'
import { MoodTrends } from './MoodTrends'
import { OverviewTrends } from './OverviewTrends'
import { RunningTrends } from './RunningTrends'
import { useTrendsData } from './useTrendsData'

type Section = 'overview' | 'kettlebell' | 'running' | 'mood'
const sections: { value: Section; label: string }[] = [
  { value: 'overview', label: 'Overview' },
  { value: 'kettlebell', label: 'Bell' },
  { value: 'running', label: 'Runs' },
  { value: 'mood', label: 'Mood' },
]
const ranges: { value: TimeRange; label: string }[] = [
  { value: '4w', label: '4 weeks' },
  { value: '3m', label: '3 months' },
  { value: 'all', label: 'All time' },
]

/** Charts and trends. Section and range live in the URL, so Back and reopening keep them. */
export function TrendsScreen() {
  const [params, setParams] = useSearchParams()
  const section = (sections.find((s) => s.value === params.get('section'))?.value ?? 'overview') as Section
  const range = (ranges.find((r) => r.value === params.get('range'))?.value ?? '4w') as TimeRange
  const data = useTrendsData()
  const today = todayKey()

  const update = (next: { section?: Section; range?: TimeRange }) =>
    setParams({ section: next.section ?? section, range: next.range ?? range }, { replace: true })

  const earliest = data
    ? [...data.runs, ...data.sessions, ...data.moods, ...data.meditations].map((e) => e.date).sort()[0]
    : undefined
  const start = rangeStart(range, today, earliest)

  return (
    <>
      <ScreenHeader title="Trends" subtitle="How things are going" />
      <div className="mb-5 space-y-2">
        <ChoiceChips<Section> label="Section" options={sections} value={section} onChange={(s) => update({ section: s })} />
        {/* One time range for everything below it. The overview is always "this week". */}
        {section !== 'overview' && (
          <ChoiceChips<TimeRange>
            label="Time range"
            options={ranges}
            value={range}
            onChange={(r) => update({ range: r })}
            selectedClass="bg-foreground text-background"
          />
        )}
      </div>

      {data && section === 'overview' && <OverviewTrends data={data} today={today} />}
      {data && section === 'kettlebell' && <KettlebellTrends data={data} start={start} />}
      {data && section === 'running' && <RunningTrends data={data} start={start} today={today} />}
      {data && section === 'mood' && <MoodTrends data={data} start={start} />}
    </>
  )
}
