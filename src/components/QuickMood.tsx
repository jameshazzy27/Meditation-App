import { useNavigate } from 'react-router'

import { moodLevels, type MoodRating } from '@/lib/mood'
import { cn } from '@/lib/utils'

const ratings: MoodRating[] = [1, 2, 3, 4, 5]

/** One tap on a face opens the mood form with that rating already chosen. */
export function QuickMood({ date, question }: { date: string; question: string }) {
  const navigate = useNavigate()
  return (
    <div className="rounded-2xl border bg-card p-4 shadow-soft">
      <p className="mb-3 text-sm font-medium">{question}</p>
      <div className="flex justify-between">
        {ratings.map((rating) => {
          const { label, icon: Icon, text } = moodLevels[rating]
          return (
            <button
              key={rating}
              type="button"
              aria-label={`Log mood: ${label}`}
              onClick={() => navigate(`/log/mood?rating=${rating}&date=${date}`)}
              className={cn('grid size-12 place-items-center rounded-full bg-muted transition-transform active:scale-90', text)}
            >
              <Icon className="size-7" strokeWidth={1.75} />
            </button>
          )
        })}
      </div>
    </div>
  )
}
