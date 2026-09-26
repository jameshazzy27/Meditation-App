import { isDateKey, normaliseTag, type MoodEntry, type MoodRating, type NewRecord } from '@/data'

/** Tags offered before you've built up your own. Your own tags are added as you use them. */
export const STARTER_TAGS = ['sleep', 'work', 'exercise', 'family', 'social', 'stress', 'rest']

export interface MoodFormValues {
  date: string
  rating?: MoodRating
  tags: string[]
  notes: string
}

export type MoodFormErrors = Partial<Record<'date' | 'rating', string>>

/** Tags to offer: yours by how often you use them, then any starter tags you haven't used. */
export function suggestedTags(usedByFrequency: string[], selected: string[]): string[] {
  const all = [...usedByFrequency, ...STARTER_TAGS.filter((t) => !usedByFrequency.includes(t))]
  // Keep anything already selected visible, even if it's new.
  return [...all, ...selected.filter((t) => !all.includes(t))]
}

export function toggleTag(tags: string[], tag: string): string[] {
  const clean = normaliseTag(tag)
  if (!clean) return tags
  return tags.includes(clean) ? tags.filter((t) => t !== clean) : [...tags, clean]
}

export function validateMoodForm(values: MoodFormValues): { errors: MoodFormErrors; mood?: NewRecord<MoodEntry> } {
  const errors: MoodFormErrors = {}
  if (!isDateKey(values.date)) errors.date = 'Pick a date.'
  if (!values.rating) errors.rating = 'Tap how you feel.'
  if (Object.keys(errors).length || !values.rating) return { errors }
  const notes = values.notes.trim()
  return {
    errors,
    mood: {
      date: values.date,
      rating: values.rating,
      tags: [...new Set(values.tags.map(normaliseTag).filter(Boolean))],
      ...(notes && { notes }),
    },
  }
}
