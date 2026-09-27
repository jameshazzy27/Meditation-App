import { useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router'

import { BackLink } from '@/components/BackLink'
import { DeleteEntryButton } from '@/components/DeleteEntryButton'
import { Field } from '@/components/Field'
import { ScreenHeader } from '@/components/ScreenHeader'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { fasts, toDateKey, useLiveData, type FastSession } from '@/data'
import { fromLocalInput, toLocalInput } from '@/lib/calendarFile'
import { formatFastDuration, hoursBetween, stageAt } from '@/lib/fasting'
import { parseWholeNumber } from '@/lib/numbers'
import { dayPath } from '@/lib/routes'

/** Fix the times, goal or notes of a finished fast, or delete it. */
export function FastEditScreen() {
  const { id = '' } = useParams()
  const loaded = useLiveData(async () => ({ fast: await fasts.get(id) }), [id])
  if (!loaded) return null
  if (!loaded.fast || !loaded.fast.endedAt) {
    return (
      <>
        <BackLink to="/fast" label="Fast" />
        <ScreenHeader title="Not found" />
        <p className="text-muted-foreground">This fast no longer exists.</p>
      </>
    )
  }
  return <FastForm key={id} fast={loaded.fast} />
}

function FastForm({ fast }: { fast: FastSession }) {
  const navigate = useNavigate()
  const [start, setStart] = useState(() => toLocalInput(new Date(fast.startedAt)))
  const [end, setEnd] = useState(() => toLocalInput(new Date(fast.endedAt!)))
  const [goal, setGoal] = useState(String(fast.goalHours))
  const [notes, setNotes] = useState(fast.notes ?? '')
  const [error, setError] = useState<string>()
  const s = fromLocalInput(start)
  const e = fromLocalInput(end)
  const hours = s && e ? hoursBetween(s, e) : 0

  async function save(event: FormEvent) {
    event.preventDefault()
    const goalHours = parseWholeNumber(goal)
    if (!s || !e || e <= s) return setError('The end must be after the start.')
    if (!goalHours || goalHours < 1) return setError('Enter a goal in whole hours.')
    await fasts.replace(fast.id, {
      date: toDateKey(e),
      startedAt: s.toISOString(),
      endedAt: e.toISOString(),
      goalHours,
      ...(notes.trim() && { notes: notes.trim() }),
    })
    navigate(dayPath(toDateKey(e)))
  }

  return (
    <>
      <BackLink to={dayPath(fast.date)} label="Back" />
      <ScreenHeader title="Fast" subtitle={`${formatFastDuration(hours)} · ${stageAt(hours).name}`} rune="ᛁ" />
      <form onSubmit={save} className="space-y-4">
        <Card>
          <CardContent className="space-y-4">
            <Field label="Started" htmlFor="start">
              <Input id="start" type="datetime-local" value={start} onChange={(ev) => setStart(ev.target.value)} />
            </Field>
            <Field label="Ended" htmlFor="end">
              <Input id="end" type="datetime-local" value={end} onChange={(ev) => setEnd(ev.target.value)} />
            </Field>
            <Field label="Goal (hours)" htmlFor="goal">
              <Input id="goal" inputMode="numeric" value={goal} onChange={(ev) => setGoal(ev.target.value)} />
            </Field>
            <Field label="Notes" hint="Optional" htmlFor="notes">
              <Textarea id="notes" value={notes} onChange={(ev) => setNotes(ev.target.value)} />
            </Field>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </CardContent>
        </Card>
        <Button type="submit" size="lg" className="w-full">
          Save changes
        </Button>
        <DeleteEntryButton what="fast" onDelete={() => fasts.remove(fast.id)} onDeleted={() => navigate(dayPath(fast.date))} />
      </form>
    </>
  )
}
