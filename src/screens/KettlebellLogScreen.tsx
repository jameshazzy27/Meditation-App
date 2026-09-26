import { Target, Trophy } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'

import { BackLink } from '@/components/BackLink'
import { ComplexBadge } from '@/components/ComplexBadge'
import { DateField } from '@/components/DateField'
import { Field } from '@/components/Field'
import { NumberStepper } from '@/components/NumberStepper'
import { ScreenHeader } from '@/components/ScreenHeader'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { complexes, fromDateKey, isDateKey, kettlebellSessions, todayKey, useLiveData, type Complex } from '@/data'
import { complexSummary, joinMeta } from '@/lib/format'
import {
  pickDefaultComplex,
  validateKettlebellForm,
  type KettlebellFormErrors,
  type KettlebellFormValues,
} from '@/lib/kettlebellForm'
import { parseWholeNumber } from '@/lib/numbers'
import { cn } from '@/lib/utils'

/** Log a kettlebell session (/log/kettlebell, optionally ?date=YYYY-MM-DD). */
export function KettlebellLogScreen() {
  const [params] = useSearchParams()
  const dateParam = params.get('date') ?? ''
  const initialDate = isDateKey(dateParam) ? dateParam : todayKey()

  // Everything the form needs to start, loaded once.
  const start = useLiveData(async () => {
    const active = await complexes.listActive()
    const chosen = pickDefaultComplex(active, (await kettlebellSessions.latest())?.complexId)
    const lastForChosen = chosen && (await kettlebellSessions.latest(chosen.id))
    return { active, chosen, lastWeight: lastForChosen?.weightKg }
  })

  return (
    <>
      <BackLink to="/log" label="Log" />
      <ScreenHeader title="Kettlebell" subtitle="Log a session" />
      {start && start.active.length === 0 && <NoComplexes />}
      {start && start.chosen && (
        <KettlebellForm
          active={start.active}
          initial={{
            date: initialDate,
            complexId: start.chosen.id,
            weightKg: start.lastWeight === undefined ? '' : String(start.lastWeight),
            rounds: '',
            durationMin: String(start.chosen.durationMin),
            notes: '',
          }}
        />
      )}
    </>
  )
}

function KettlebellForm({ active, initial }: { active: Complex[]; initial: KettlebellFormValues }) {
  const navigate = useNavigate()
  const [values, setValues] = useState(initial)
  const [errors, setErrors] = useState<KettlebellFormErrors>({})
  const [saving, setSaving] = useState(false)

  const complex = active.find((c) => c.id === values.complexId)
  const last = useLiveData(() => kettlebellSessions.latest(values.complexId), [values.complexId])

  const set = <K extends keyof KettlebellFormValues>(key: K, value: KettlebellFormValues[K]) => {
    setValues((v) => ({ ...v, [key]: value }))
    // Once you change a field, its old error no longer applies.
    setErrors(({ [key]: _fixed, ...rest }) => rest)
  }

  async function chooseComplex(next: Complex) {
    // Switch complex, and bring over its usual duration and the weight you used for it last time.
    const lastForNext = await kettlebellSessions.latest(next.id)
    setValues((v) => ({
      ...v,
      complexId: next.id,
      durationMin: String(next.durationMin),
      weightKg: lastForNext?.weightKg === undefined ? v.weightKg : String(lastForNext.weightKg),
    }))
  }

  async function save(event: FormEvent) {
    event.preventDefault()
    const result = validateKettlebellForm(values, complex)
    setErrors(result.errors)
    if (!result.session) return
    setSaving(true)
    await kettlebellSessions.create(result.session)
    navigate('/')
  }

  const rounds = parseWholeNumber(values.rounds)
  const target = complex?.targetRounds

  return (
    <form onSubmit={save} noValidate className="space-y-4">
      <Card>
        <CardContent className="space-y-5">
          <Field label="Date" htmlFor="date" error={errors.date}>
            <DateField id="date" value={values.date} onChange={(d) => set('date', d)} invalid={!!errors.date} />
          </Field>

          <Field label="Complex" error={errors.complexId}>
            <div role="radiogroup" aria-label="Complex" className="grid grid-cols-4 gap-2">
              {active.map((c) => {
                const selected = c.id === values.complexId
                return (
                  <button
                    key={c.id}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    aria-label={c.name}
                    onClick={() => void chooseComplex(c)}
                    className={cn(
                      'flex flex-col items-center gap-1.5 rounded-2xl border-2 p-2 transition-all active:scale-95',
                      selected ? 'border-kettlebell bg-kettlebell/8' : 'border-transparent bg-muted',
                    )}
                  >
                    <ComplexBadge name={c.name} muted={!selected} />
                    <span className="w-full truncate text-xs font-medium">{c.name}</span>
                  </button>
                )
              })}
            </div>
          </Field>
        </CardContent>
      </Card>

      {complex && (
        <Card className="bg-kettlebell/5">
          <CardHeader>
            <CardTitle>Complex {complex.name}</CardTitle>
            <CardDescription>{complexSummary(complex)}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <ol className="space-y-1.5">
              {complex.movements.map((movement, i) => (
                <li key={i} className="flex gap-3 text-sm">
                  <span className="w-4 shrink-0 text-right font-medium text-kettlebell tabular-nums">{i + 1}</span>
                  <span>{movement}</span>
                </li>
              ))}
            </ol>
            {last && (
              <p className="border-t pt-3 text-sm text-muted-foreground">
                <span className="font-medium text-foreground">Last time</span>{' '}
                {joinMeta(
                  fromDateKey(last.date).toLocaleDateString(undefined, {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                  }),
                  last.weightKg !== undefined && `${last.weightKg} kg`,
                  last.rounds !== undefined && `${last.rounds} rounds`,
                )}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="space-y-5">
          <Field label="Rounds completed" htmlFor="rounds" error={errors.rounds}>
            <NumberStepper
              id="rounds"
              value={values.rounds}
              onChange={(r) => set('rounds', r)}
              invalid={!!errors.rounds}
            />
            {target !== undefined && (
              <p
                className={cn(
                  'flex items-center justify-center gap-1.5 text-sm',
                  rounds !== undefined && rounds >= target ? 'font-medium text-kettlebell' : 'text-muted-foreground',
                )}
              >
                {rounds !== undefined && rounds > target ? (
                  <>
                    <Trophy className="size-4" /> {rounds - target} over your target of {target}
                  </>
                ) : rounds === target ? (
                  <>
                    <Target className="size-4" /> Right on target
                  </>
                ) : (
                  <>
                    <Target className="size-4" /> Target {target} rounds
                  </>
                )}
              </p>
            )}
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Weight" htmlFor="weight" error={errors.weightKg}>
              <div className="relative">
                <Input
                  id="weight"
                  inputMode="decimal"
                  value={values.weightKg}
                  onChange={(e) => set('weightKg', e.target.value)}
                  placeholder="e.g. 12"
                  aria-invalid={!!errors.weightKg}
                  className="pr-10"
                />
                <span className="pointer-events-none absolute top-1/2 right-3.5 -translate-y-1/2 text-sm text-muted-foreground">
                  kg
                </span>
              </div>
            </Field>
            <Field label="Minutes" htmlFor="duration" error={errors.durationMin}>
              <Input
                id="duration"
                inputMode="numeric"
                value={values.durationMin}
                onChange={(e) => set('durationMin', e.target.value)}
                aria-invalid={!!errors.durationMin}
              />
            </Field>
          </div>

          <Field label="Notes" hint="Optional" htmlFor="notes">
            <Textarea
              id="notes"
              value={values.notes}
              onChange={(e) => set('notes', e.target.value)}
              placeholder="Part-rounds, how it felt… e.g. “+ swings and squats, grip went on the rows”"
            />
          </Field>
        </CardContent>
      </Card>

      <Button type="submit" size="lg" className="w-full" disabled={saving}>
        Save session
      </Button>
    </form>
  )
}

function NoComplexes() {
  return (
    <Card className="border-dashed bg-transparent shadow-none">
      <CardHeader className="text-center">
        <CardTitle>Add a complex first</CardTitle>
        <CardDescription>
          Sessions are logged against one of your complexes — set up A, B, C in Settings.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex justify-center">
        <Button asChild>
          <Link to="/settings/complexes/new">Add a complex</Link>
        </Button>
      </CardContent>
    </Card>
  )
}
