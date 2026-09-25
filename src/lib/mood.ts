import { Angry, Frown, Laugh, Meh, Smile, type LucideIcon } from 'lucide-react'

export type MoodRating = 1 | 2 | 3 | 4 | 5

export const moodLevels: Record<MoodRating, { label: string; icon: LucideIcon; bg: string; text: string }> = {
  1: { label: 'Rough', icon: Angry, bg: 'bg-mood-1', text: 'text-mood-1' },
  2: { label: 'Low', icon: Frown, bg: 'bg-mood-2', text: 'text-mood-2' },
  3: { label: 'Okay', icon: Meh, bg: 'bg-mood-3', text: 'text-mood-3' },
  4: { label: 'Good', icon: Smile, bg: 'bg-mood-4', text: 'text-mood-4' },
  5: { label: 'Great', icon: Laugh, bg: 'bg-mood-5', text: 'text-mood-5' },
}
