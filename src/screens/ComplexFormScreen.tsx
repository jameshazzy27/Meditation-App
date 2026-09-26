import { Archive, ArrowDown, ArrowUp, Plus, RotateCcw, Trash2, X } from 'lucide-react'
import { useRef, useState, type FormEvent, type ReactNode } from 'react'
import { useNavigate, useParams } from 'react-router'

import { BackLink } from '@/components/BackLink'
import { Field } from '@/components/Field'
import { ScreenHeader } from '@/components/ScreenHeader'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { complexes, kettlebellSessions, useLiveData, type Complex } from '@/data'
import {
  complexToForm,
  emptyComplexForm,
  validateComplexForm,
  type ComplexFormErrors,
  type ComplexFormValues,
} from '@/lib/complexForm'
import { cn } from '@/lib/utils'

const LIST = '/settings/complexes'

/** Add a new complex (/settings/complexes/new) or edit one (/settings/complexes/:id). */
export function ComplexFormScreen() {
  const { id = 'new' } = useParams()
  const isNew = id === 'new'
  // Wrapped in an object so "still loading" (undefined) differs from "not found" ({ complex: undefined }).
  const loaded = useLiveData(async () => ({ complex: isNew ? undefined : await complexes.get(id) }), [id])

  if (!loaded) return null
  if (!isNew && !loaded.complex) {
    return (
      <>
        <BackLink to={LIST} label="Complexes" />
        <ScreenHeader title="Not found" />
        <p className="text-muted-foreground">This complex no longer exists.</p>
      </>
    )
  }
  return <ComplexForm key={id} existing={loaded.complex} />
}

function ComplexForm({ existing }: { existing?: Complex }) {
  const navigate = useNavigate()
  const [values, setValues] = useState<ComplexFormValues>(() =>
    existing ? complexToForm(existing) : emptyComplexForm(),
  )
  const [errors, setErrors] = useState<ComplexFormErrors>({})
  const [saving, setSaving] = useState(false)
  const movementInputs = useRef<(HTMLTextAreaElement | null)[]>([])
  const focusMovement = useRef<number | null>(null)

  const set = <K extends keyof ComplexFormValues>(key: K, value: ComplexFormValues[K]) => {
    setValues((v) => ({ ...v, [key]: value }))
    // Once you change a field, its old error no longer applies.
    setErrors(({ [key]: _fixed, ...rest }) => rest)
  }

  function setMovement(index: number, text: string) {
    set('movements', values.movements.map((m, i) => (i === index ? text : m)))
  }

  function addMovement(after = values.movements.length - 1) {
    const next = [...values.movements]
    next.splice(after + 1, 0, '')
    focusMovement.current = after + 1
    set('movements', next)
  }

  function removeMovement(index: number) {
    const next = values.movements.filter((_, i) => i !== index)
    set('movements', next.length ? next : [''])
  }

  function moveMovement(index: number, by: -1 | 1) {
    const next = [...values.movements]
    ;[next[index], next[index + by]] = [next[index + by], next[index]]
    set('movements', next)
  }

  async function save(event: FormEvent) {
    event.preventDefault()
    const others = (await complexes.listActive()).filter((c) => c.id !== existing?.id).map((c) => c.name)
    const result = validateComplexForm(values, others)
    setErrors(result.errors)
    if (!result.complex) return
    setSaving(true)
    if (existing) await complexes.update(existing.id, result.complex)
    else await complexes.create({ ...result.complex, archived: false })
    navigate(LIST)
  }

  return (
    <>
      <BackLink to={LIST} label="Complexes" />
      <ScreenHeader
        title={existing ? `Edit ${existing.name}` : 'New complex'}
        subtitle={existing?.archived ? 'Archived' : 'Kettlebell AMRAP'}
      />

      <form onSubmit={save} noValidate className="space-y-4">
        <Card>
          <CardContent className="space-y-5">
            <Field label="Name" htmlFor="name" error={errors.name}>
              <Input
                id="name"
                value={values.name}
                onChange={(e) => set('name', e.target.value)}
                placeholder="A"
                autoComplete="off"
                aria-invalid={!!errors.name}
              />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Minutes" htmlFor="duration" error={errors.durationMin}>
                <Input
                  id="duration"
                  inputMode="numeric"
                  value={values.durationMin}
                  onChange={(e) => set('durationMin', e.target.value)}
                  aria-invalid={!!errors.durationMin}
                />
              </Field>
              <Field label="Target rounds" htmlFor="target" error={errors.targetRounds}>
                <Input
                  id="target"
                  inputMode="numeric"
                  value={values.targetRounds}
                  onChange={(e) => set('targetRounds', e.target.value)}
                  placeholder="Optional"
                  aria-invalid={!!errors.targetRounds}
                />
              </Field>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Movements</CardTitle>
            <CardDescription>In order — one full pass is one round. Include reps if you like.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {values.movements.map((movement, index) => (
              <div key={index} className="flex items-start gap-1">
                <span className="w-5 shrink-0 pt-3 text-center text-sm font-medium text-muted-foreground tabular-nums">
                  {index + 1}
                </span>
                {/* Grows to fit long names; Enter adds the next movement instead of a new line. */}
                <Textarea
                  ref={(el) => {
                    movementInputs.current[index] = el
                    if (el && focusMovement.current === index) {
                      el.focus()
                      focusMovement.current = null
                    }
                  }}
                  rows={1}
                  aria-label={`Movement ${index + 1}`}
                  value={movement}
                  onChange={(e) => setMovement(index, e.target.value.replace(/\n/g, ' '))}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addMovement(index)
                    }
                  }}
                  placeholder={index === 0 ? 'Kettlebell swings × 20' : 'Next movement'}
                  enterKeyHint="next"
                  className="min-h-11 resize-none px-3"
                  aria-invalid={!!errors.movements && !movement.trim()}
                />
                <div className="flex shrink-0 flex-col">
                  <IconButton label="Move up" disabled={index === 0} onClick={() => moveMovement(index, -1)}>
                    <ArrowUp />
                  </IconButton>
                  <IconButton
                    label="Move down"
                    disabled={index === values.movements.length - 1}
                    onClick={() => moveMovement(index, 1)}
                  >
                    <ArrowDown />
                  </IconButton>
                </div>
                <IconButton label={`Remove movement ${index + 1}`} onClick={() => removeMovement(index)} tall>
                  <X />
                </IconButton>
              </div>
            ))}
            {errors.movements && <p className="text-sm text-destructive">{errors.movements}</p>}
            <Button type="button" variant="secondary" size="sm" onClick={() => addMovement()}>
              <Plus /> Add movement
            </Button>
          </CardContent>
        </Card>

        {existing && (
          <p className="px-1 text-sm text-muted-foreground">
            Sessions you've already logged keep the movements they were done with.
          </p>
        )}

        <div className="flex gap-2">
          <Button type="button" variant="secondary" size="lg" className="flex-1" onClick={() => navigate(LIST)}>
            Cancel
          </Button>
          <Button type="submit" size="lg" className="flex-1" disabled={saving}>
            {existing ? 'Save changes' : 'Add complex'}
          </Button>
        </div>
      </form>

      {existing && <ArchiveOrDelete complex={existing} onDeleted={() => navigate(LIST)} />}
    </>
  )
}

function ArchiveOrDelete({ complex, onDeleted }: { complex: Complex; onDeleted: () => void }) {
  const sessionCount = useLiveData(() => kettlebellSessions.countForComplex(complex.id), [complex.id])
  if (sessionCount === undefined) return null

  async function remove() {
    if (!confirm(`Delete complex ${complex.name}? This can't be undone.`)) return
    await complexes.remove(complex.id)
    onDeleted()
  }

  return (
    <Card className="mt-8 bg-transparent shadow-none">
      <CardContent className="space-y-3">
        {complex.archived ? (
          <>
            <p className="text-sm text-muted-foreground">
              This complex is archived, so it's hidden when you log a session.
            </p>
            <Button variant="outline" onClick={() => void complexes.restore(complex.id)}>
              <RotateCcw /> Restore
            </Button>
          </>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">
              Archive hides it when logging, but keeps it with your past sessions.
            </p>
            <Button variant="outline" onClick={() => void complexes.archive(complex.id)}>
              <Archive /> Archive
            </Button>
          </>
        )}
        {sessionCount === 0 ? (
          <Button variant="ghost" className="text-destructive hover:text-destructive" onClick={() => void remove()}>
            <Trash2 /> Delete
          </Button>
        ) : (
          <p className="text-sm text-muted-foreground">
            Used in {sessionCount} logged {sessionCount === 1 ? 'session' : 'sessions'}, so it can be
            archived but not deleted.
          </p>
        )}
      </CardContent>
    </Card>
  )
}

function IconButton({
  label,
  disabled,
  tall,
  onClick,
  children,
}: {
  label: string
  disabled?: boolean
  tall?: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={cn('w-8 text-muted-foreground disabled:opacity-25', tall ? 'h-11' : 'h-5.5 rounded-md')}
    >
      {children}
    </Button>
  )
}
