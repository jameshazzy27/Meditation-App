import { EntryCard, Note } from '@/components/EntryCard'
import { Badge } from '@/components/ui/badge'
import type { DayEntries } from '@/data'
import { formatDuration, formatPace, formatTime, joinMeta, runTypeLabels } from '@/lib/format'
import { moodLevels } from '@/lib/mood'

/** Read-only cards for everything logged on one day, grouped by type. */
export function DayEntryList({ day }: { day: DayEntries }) {
  return (
    <div className="space-y-3">
      {day.moods.map((mood) => (
        <EntryCard key={mood.id} kind="mood" title={moodLevels[mood.rating].label} meta={formatTime(mood.createdAt)}>
          {mood.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {mood.tags.map((tag) => (
                <Badge key={tag} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
          {mood.notes && <Note>{mood.notes}</Note>}
        </EntryCard>
      ))}

      {day.runs.map((run) => (
        <EntryCard
          key={run.id}
          kind="run"
          title={runTypeLabels[run.runType]}
          meta={joinMeta(
            run.distanceKm !== undefined && `${run.distanceKm} km`,
            run.durationSec !== undefined && formatDuration(run.durationSec),
            formatPace(run.distanceKm, run.durationSec),
          )}
        >
          {run.notes && <Note>{run.notes}</Note>}
        </EntryCard>
      ))}

      {day.kettlebellSessions.map((session) => (
        <EntryCard
          key={session.id}
          kind="kettlebell"
          title={`Complex ${session.complexSnapshot.name}`}
          meta={joinMeta(
            session.weightKg !== undefined && `${session.weightKg} kg`,
            session.rounds !== undefined && `${session.rounds} rounds`,
            session.durationMin !== undefined && `${session.durationMin} min`,
          )}
        >
          <p className="text-sm text-muted-foreground">{session.complexSnapshot.movements.join(' · ')}</p>
          {session.notes && <Note>{session.notes}</Note>}
        </EntryCard>
      ))}

      {day.meditations.map((meditation) => (
        <EntryCard
          key={meditation.id}
          kind="meditation"
          title="Meditation"
          meta={joinMeta(
            formatDuration(meditation.durationSec),
            meditation.avgBpm !== undefined && `avg ${meditation.avgBpm} bpm`,
          )}
        >
          {meditation.notes && <Note>{meditation.notes}</Note>}
        </EntryCard>
      ))}
    </div>
  )
}
