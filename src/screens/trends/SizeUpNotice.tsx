import { TrendingUp } from 'lucide-react'

/** The "time for a heavier bell" nudge. */
export function SizeUpNotice({ complexName, target, sessions }: { complexName: string; target: number; sessions: number }) {
  return (
    <div className="flex gap-3 rounded-2xl border border-kettlebell/40 bg-kettlebell/10 p-4">
      <TrendingUp className="mt-0.5 size-5 shrink-0 text-kettlebell" />
      <div className="text-sm">
        <p className="font-semibold">The bell grows light — size up on {complexName}?</p>
        <p className="text-muted-foreground">
          You've beaten your target of {target} rounds {sessions} sessions in a row.
        </p>
      </div>
    </div>
  )
}
