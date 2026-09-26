import { Plus } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router'

import { BackLink } from '@/components/BackLink'
import { DateField } from '@/components/DateField'
import { DeleteEntryButton } from '@/components/DeleteEntryButton'
import { Field } from '@/components/Field'
import { MoodScale } from '@/components/MoodScale'
import { ScreenHeader } from '@/components/ScreenHeader'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { isDateKey, moods, todayKey, useLiveData, type MoodEntry, type MoodRating } from '@/data'
import { suggestedTags, toggleTag, validateMoodForm, type MoodFormErrors, type MoodFormValues } from '@/lib/moodForm'
import { dayPath } from '@/lib/routes'
import { cn } from '@/lib/utils'

/** Log a mood (/log/mood?rating=4&date=…) or edit one (/log/mood/:id). */
export function MoodLogScreen() {
  const { id } = useParams()
  const [params] = useSearchParams()
  const loaded = useLiveData(async () => ({ existing: id ? await moods.get(id) : undefined }), [id])

  if (!loaded) return null
  if (id && !loaded.existing) {
    return (
      <>
        <BackLink to="/" label="Today" />
        <ScreenHeader title="Not found" />
        <p className="text-muted-foreground">This entry no longer exists.</p>
      </>
    )
  }

  const dateParam = params.get('date') ?? ''
  const ratingParam = Number(params.get('rating'))
  const initial: MoodFormValues = loaded.existing
    ? { ...loaded.existing, tags: [...loaded.existing.tags], notes: loaded.existing.notes ?? '' }
    : {
        date: isDateKey(dateParam) ? dateParam : todayKey(),
        rating: ratingParam >= 1 && ratingParam <= 5 ? (ratingParam as MoodRating) : undefined,
        tags: [],
        notes: '',
      }
  return <MoodForm key={id ?? 'new'} existing={loaded.existing} initial={initial} />
}

function MoodForm({ existing, initial }: { existing?: MoodEntry; initial: MoodFormValues }) {
  const navigate = useNavigate()
  const [values, setValues] = useState(initial)
  const [errors, setErrors] = useState<MoodFormErrors>({})
  const [saving, setSaving] = useState(false)
  const [newTag, setNewTag] = useState<string | null>(null)
  const usedTags = useLiveData(() => moods.tagsByUse()) ?? []
  const tags = suggestedTags(usedTags, values.tags)

  const set = <K extends keyof MoodFormValues>(key: K, value: MoodFormValues[K]) => {
    setValues((v) => ({ ...v, [key]: value }))
    setErrors(({ [key as 'date']: _fixed, ...rest }) => rest)
  }

  function addNewTag() {
    if (newTag?.trim()) set('tags', toggleTag(values.tags, newTag))
    setNewTag(null)
  }

  async function save(event: FormEvent) {
    event.preventDefault()
    const result = validateMoodForm(values)
    setErrors(result.errors)
    if (!result.mood) return
    setSaving(true)
    if (existing) await moods.replace(existing.id, result.mood)
    else await moods.create(result.mood)
    navigate(dayPath(result.mood.date))
  }

  return (
    <>
      <BackLink to={existing ? dayPath(existing.date) : '/log'} label={existing ? 'Back' : 'Log'} />
      <ScreenHeader title="Mood" subtitle={existing ? 'Edit mood' : 'How are you feeling?'} />

      <form onSubmit={save} noValidate className="space-y-4">
        <Card>
          <CardContent className="space-y-2">
            <MoodScale value={values.rating} onChange={(r) => set('rating', r)} />
            {errors.rating && <p className="text-sm text-destructive">{errors.rating}</p>}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-5">
            <Field label="What's behind it?" hint="Optional">
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => {
                  const selected = values.tags.includes(tag)
                  return (
                    <button
                      key={tag}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => set('tags', toggleTag(values.tags, tag))}
                      className={cn(
                        'h-9 rounded-full border px-3.5 text-sm font-medium transition-colors',
                        selected
                          ? 'border-transparent bg-mood text-white dark:text-background'
                          : 'bg-card text-foreground hover:bg-accent',
                      )}
                    >
                      {tag}
                    </button>
                  )
                })}
                {newTag === null ? (
                  <button
                    type="button"
                    onClick={() => setNewTag('')}
                    className="flex h-9 items-center gap-1 rounded-full border border-dashed px-3.5 text-sm font-medium text-muted-foreground hover:text-foreground"
                  >
                    <Plus className="size-4" /> New tag
                  </button>
                ) : (
                  <Input
                    autoFocus
                    aria-label="New tag"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        addNewTag()
                      }
                      if (e.key === 'Escape') setNewTag(null)
                    }}
                    onBlur={addNewTag}
                    placeholder="e.g. coffee"
                    enterKeyHint="done"
                    className="h-9 w-36 rounded-full text-sm"
                  />
                )}
              </div>
            </Field>

            <Field label="Notes" hint="Optional" htmlFor="notes">
              <Textarea
                id="notes"
                value={values.notes}
                onChange={(e) => set('notes', e.target.value)}
                placeholder="Anything on your mind…"
                className="min-h-12"
              />
            </Field>

            <Field label="Date" htmlFor="date" error={errors.date}>
              <DateField id="date" value={values.date} onChange={(d) => set('date', d)} invalid={!!errors.date} />
            </Field>
          </CardContent>
        </Card>

        <div className="sticky bottom-24 z-10">
          <Button type="submit" size="lg" className="w-full shadow-soft" disabled={saving}>
            {existing ? 'Save changes' : 'Save mood'}
          </Button>
        </div>
        {existing && (
          <DeleteEntryButton
            what="mood"
            onDelete={() => moods.remove(existing.id)}
            onDeleted={() => navigate(dayPath(existing.date))}
          />
        )}
      </form>
    </>
  )
}
