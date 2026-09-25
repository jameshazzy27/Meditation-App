import { Dumbbell, Flower2, Footprints, Smile, type LucideIcon } from 'lucide-react'

export type EntryKind = 'mood' | 'run' | 'kettlebell' | 'meditation'

// Colour + icon for each kind of entry. Class names are written out in full so
// Tailwind can find them; the colours themselves live in src/index.css.
export const entryKinds: Record<
  EntryKind,
  { label: string; icon: LucideIcon; text: string; tile: string; bar: string }
> = {
  mood: { label: 'Mood', icon: Smile, text: 'text-mood', tile: 'bg-mood/12 text-mood', bar: 'bg-mood' },
  run: { label: 'Run', icon: Footprints, text: 'text-run', tile: 'bg-run/12 text-run', bar: 'bg-run' },
  kettlebell: {
    label: 'Kettlebell',
    icon: Dumbbell,
    text: 'text-kettlebell',
    tile: 'bg-kettlebell/15 text-kettlebell',
    bar: 'bg-kettlebell',
  },
  meditation: {
    label: 'Meditation',
    icon: Flower2,
    text: 'text-meditation',
    tile: 'bg-meditation/12 text-meditation',
    bar: 'bg-meditation',
  },
}
