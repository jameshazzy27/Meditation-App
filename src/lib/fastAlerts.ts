import { useEffect } from 'react'

import { fasts, useLiveData } from '@/data'
import { hoursBetween, milestones } from '@/lib/fasting'
import { notify } from '@/lib/notify'
import { showToast } from '@/lib/toast'

// While Aura is open, announce each fasting milestone (new stage, goal) once.
// If several passed while it was closed, only the latest is announced.

const key = (fastId: string) => `aura-fast-alerted-${fastId}`

function alreadyAlerted(fastId: string): number {
  try {
    return Number(localStorage.getItem(key(fastId)) ?? -1)
  } catch {
    return -1
  }
}

function markAlerted(fastId: string, hours: number) {
  try {
    localStorage.setItem(key(fastId), String(hours))
  } catch {
    // Worst case: an alert may repeat.
  }
}

/** Mount once, near the top of the app. */
export function useFastAlerts() {
  const active = useLiveData(() => fasts.active())

  useEffect(() => {
    if (!active) return
    const check = () => {
      const hours = hoursBetween(active.startedAt, new Date())
      const due = milestones(active.goalHours).filter((m) => m.hours <= hours && m.hours > alreadyAlerted(active.id))
      const latest = due.at(-1)
      if (!latest) return
      markAlerted(active.id, latest.hours)
      showToast(latest.title, latest.body)
      void notify(latest.title, latest.body)
    }
    // Starting a fast "earlier" shouldn't announce stages already behind you.
    if (alreadyAlerted(active.id) < 0) {
      const passed = milestones(active.goalHours).filter((m) => m.hours <= hoursBetween(active.startedAt, new Date()))
      markAlerted(active.id, passed.at(-1)?.hours ?? 0)
    }
    check()
    const interval = setInterval(check, 20_000)
    const onVisible = () => document.visibilityState === 'visible' && check()
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [active])
}
