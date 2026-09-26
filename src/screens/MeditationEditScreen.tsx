import { useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router'

import { BackLink } from '@/components/BackLink'
import { DeleteEntryButton } from '@/components/DeleteEntryButton'
import { Field } from '@/components/Field'
import { ScreenHeader } from '@/components/ScreenHeader'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { meditations, useLiveData, type MeditationSession } from '@/data'
import { formatDuration } from '@/lib/format'
import { dayPath } from '@/lib/routes'

/** Meditation sessions come from the timer (Phase 3); here you can add notes or delete one. */
export function MeditationEditScreen() {
  const { id = '' } = useParams()
  const loaded = useLiveData(async () => ({ session: await meditations.get(id) }), [id])
  if (!loaded) return null
  if (!loaded.session) {
    return (
      <>
        <BackLink to="/" label="Today" />
        <ScreenHeader title="Not found" />
        <p className="text-muted-foreground">This entry no longer exists.</p>
      </>
    )
  }
  return <MeditationForm key={id} session={loaded.session} />
}

function MeditationForm({ session }: { session: MeditationSession }) {
  const navigate = useNavigate()
  const [notes, setNotes] = useState(session.notes ?? '')
  const back = dayPath(session.date)

  async function save(event: FormEvent) {
    event.preventDefault()
    const { id: _id, createdAt: _c, updatedAt: _u, notes: _n, ...rest } = session
    await meditations.replace(session.id, { ...rest, ...(notes.trim() && { notes: notes.trim() }) })
    navigate(back)
  }

  const stats = [
    { label: 'Duration', value: formatDuration(session.durationSec) },
    { label: 'Average', value: session.avgBpm === undefined ? '–' : `${session.avgBpm}`, unit: 'bpm' },
    { label: 'Lowest', value: session.minBpm === undefined ? '–' : `${session.minBpm}`, unit: 'bpm' },
    { label: 'Highest', value: session.maxBpm === undefined ? '–' : `${session.maxBpm}`, unit: 'bpm' },
  ]

  return (
    <>
      <BackLink to={back} label="Back" />
      <ScreenHeader title="Meditation" subtitle="Session" />
      <form onSubmit={save} className="space-y-4">
        <Card>
          <CardContent className="grid grid-cols-2 gap-4">
            {stats.map(({ label, value, unit }) => (
              <div key={label}>
                <p className="text-xs font-medium tracking-wider text-muted-foreground uppercase">{label}</p>
                <p className="font-display text-3xl font-medium tabular-nums">
                  {value}
                  {unit && value !== '–' && <span className="ml-1 font-sans text-sm text-muted-foreground">{unit}</span>}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Field label="Notes" hint="Optional" htmlFor="notes">
              <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
            </Field>
          </CardContent>
        </Card>
        <Button type="submit" size="lg" className="w-full">
          Save changes
        </Button>
        <DeleteEntryButton
          what="session"
          onDelete={() => meditations.remove(session.id)}
          onDeleted={() => navigate(back)}
        />
      </form>
    </>
  )
}
