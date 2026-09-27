import { Gauge } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router'

import { BackLink } from '@/components/BackLink'
import { ChoiceChips } from '@/components/ChoiceChips'
import { DateField } from '@/components/DateField'
import { DeleteEntryButton } from '@/components/DeleteEntryButton'
import { Field } from '@/components/Field'
import { ScreenHeader } from '@/components/ScreenHeader'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { isDateKey, runs, todayKey, useLiveData, type Run, type RunType } from '@/data'
import { runTypeLabels } from '@/lib/format'
import { dayPath } from '@/lib/routes'
import { livePace, runToForm, validateRunForm, type RunFormErrors, type RunFormValues } from '@/lib/runForm'
import { cn } from '@/lib/utils'

const runTypes = (Object.keys(runTypeLabels) as RunType[]).map((value) => ({
  value,
  label: value === 'intervals' ? 'Intervals' : value === 'short' ? 'Short' : 'Long',
}))

/** Log a run (/log/run?date=…) or edit one (/log/run/:id). */
export function RunLogScreen() {
  const { id } = useParams()
  const [params] = useSearchParams()
  const dateParam = params.get('date') ?? ''

  const start = useLiveData(async () => {
    if (id) return { existing: await runs.get(id), lastType: undefined }
    return { existing: undefined, lastType: (await runs.latest())?.runType }
  }, [id])

  if (!start) return null
  if (id && !start.existing) return <NotFound />

  const initial: RunFormValues = start.existing
    ? runToForm(start.existing)
    : {
        date: isDateKey(dateParam) ? dateParam : todayKey(),
        runType: start.lastType ?? 'short',
        distanceKm: '',
        hours: '',
        minutes: '',
        seconds: '',
        notes: '',
      }
  return <RunForm key={id ?? 'new'} existing={start.existing} initial={initial} />
}

function RunForm({ existing, initial }: { existing?: Run; initial: RunFormValues }) {
  const navigate = useNavigate()
  const [values, setValues] = useState(initial)
  const [errors, setErrors] = useState<RunFormErrors>({})
  const [saving, setSaving] = useState(false)
  const pace = livePace(values)

  const set = <K extends keyof RunFormValues>(key: K, value: RunFormValues[K]) => {
    setValues((v) => ({ ...v, [key]: value }))
    // Once you change a field, its old error no longer applies (the three time boxes share one).
    const errorKey = key === 'hours' || key === 'minutes' || key === 'seconds' ? 'time' : key
    setErrors(({ [errorKey]: _fixed, ...rest }) => rest)
  }

  async function save(event: FormEvent) {
    event.preventDefault()
    const result = validateRunForm(values)
    setErrors(result.errors)
    if (!result.run) return
    setSaving(true)
    if (existing) await runs.replace(existing.id, result.run)
    else await runs.create(result.run)
    navigate(dayPath(result.run.date), { state: { saved: 'Run' } })
  }

  const timeBox = (key: 'hours' | 'minutes' | 'seconds', label: string, placeholder: string) => (
    <div className="relative flex-1">
      <Input
        id={key}
        aria-label={label}
        inputMode="numeric"
        value={values[key]}
        onChange={(e) => set(key, e.target.value)}
        placeholder={placeholder}
        aria-invalid={!!errors.time}
        className="pr-9 text-center tabular-nums"
      />
      <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs text-muted-foreground">
        {label === 'Hours' ? 'h' : label === 'Minutes' ? 'm' : 's'}
      </span>
    </div>
  )

  return (
    <>
      <BackLink to={existing ? dayPath(existing.date) : '/log'} label={existing ? 'Back' : 'Log'} />
      <ScreenHeader title="Run" subtitle={existing ? 'Edit run' : 'Log a run'} rune="ᛖ" />

      <form onSubmit={save} noValidate className="space-y-4">
        <Card>
          <CardContent className="space-y-5">
            <Field label="Date" htmlFor="date" error={errors.date}>
              <DateField id="date" value={values.date} onChange={(d) => set('date', d)} invalid={!!errors.date} />
            </Field>
            <Field label="Type">
              <ChoiceChips
                label="Run type"
                options={runTypes}
                value={values.runType}
                onChange={(t) => set('runType', t)}
                selectedClass="bg-run text-white dark:text-background"
              />
            </Field>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-5">
            <Field label="Distance" htmlFor="distance" error={errors.distanceKm}>
              <div className="relative">
                <Input
                  id="distance"
                  inputMode="decimal"
                  value={values.distanceKm}
                  onChange={(e) => set('distanceKm', e.target.value)}
                  placeholder="e.g. 5"
                  aria-invalid={!!errors.distanceKm}
                  className="pr-10"
                />
                <span className="pointer-events-none absolute top-1/2 right-3.5 -translate-y-1/2 text-sm text-muted-foreground">
                  km
                </span>
              </div>
            </Field>
            <Field label="Time" error={errors.time}>
              <div className="flex gap-2">
                {timeBox('hours', 'Hours', '0')}
                {timeBox('minutes', 'Minutes', '00')}
                {timeBox('seconds', 'Seconds', '00')}
              </div>
            </Field>

            <div
              aria-live="polite"
              className={cn(
                'flex items-center justify-between rounded-2xl px-4 py-3 transition-colors',
                pace ? 'bg-run/10' : 'bg-muted',
              )}
            >
              <span className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Gauge className={cn('size-4', pace && 'text-run')} /> Pace
              </span>
              <span
                data-testid="pace"
                className={cn('font-display text-3xl font-medium tabular-nums', !pace && 'text-muted-foreground/50')}
              >
                {pace ? pace.replace('/km', '') : '–:––'}
                <span className="ml-1 font-sans text-sm text-muted-foreground">/km</span>
              </span>
            </div>

            <Field label="Notes" hint="Optional" htmlFor="notes">
              <Textarea
                id="notes"
                value={values.notes}
                onChange={(e) => set('notes', e.target.value)}
                placeholder="Route, weather, how your legs felt…"
              />
            </Field>
          </CardContent>
        </Card>

        <Button type="submit" size="lg" className="w-full" disabled={saving}>
          {existing ? 'Save changes' : 'Save run'}
        </Button>
        {existing && (
          <DeleteEntryButton
            what="run"
            onDelete={() => runs.remove(existing.id)}
            onDeleted={() => navigate(dayPath(existing.date))}
          />
        )}
      </form>
    </>
  )
}

function NotFound() {
  return (
    <>
      <BackLink to="/" label="Today" />
      <ScreenHeader title="Not found" />
      <p className="text-muted-foreground">This entry no longer exists.</p>
    </>
  )
}
