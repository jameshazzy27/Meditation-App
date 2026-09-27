import type { FastingPlan } from '@/data'

// On iPhone, web apps can't alert you when they're closed, and calendar files
// from browsers like Bluefy don't reach Calendar. So Aura uses the iPhone's
// own tools instead:
//  - a one-time Shortcut ("Aura Fast Timer") that starts a Clock timer, which
//    Aura runs with the minutes left until your goal;
//  - repeating Clock alarms for your plan, which you set once.

export const SHORTCUT_NAME = 'Aura Fast Timer'

export const isIPhone = () => typeof navigator !== 'undefined' && /iPhone|iPad|iPod/.test(navigator.userAgent)

/** Link that runs the Shortcut with the number of minutes as its input. */
export function shortcutTimerUrl(minutes: number): string {
  const name = encodeURIComponent(SHORTCUT_NAME)
  return `shortcuts://run-shortcut?name=${name}&input=text&text=${Math.max(1, Math.round(minutes))}`
}

/** Opens a link to another app (e.g. shortcuts://) — the phone may ask first. */
export function openAppLink(url: string) {
  const link = document.createElement('a')
  link.href = url
  link.rel = 'noopener'
  document.body.appendChild(link)
  link.click()
  link.remove()
}

const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0] // Monday first, as the Clock app lists them

function dayList(days: number[]): string {
  if (days.length === 7) return 'Every day'
  const sorted = WEEK_ORDER.filter((d) => days.includes(d))
  if (sorted.length === 5 && [1, 2, 3, 4, 5].every((d) => days.includes(d))) return 'Weekdays'
  if (sorted.length === 2 && days.includes(0) && days.includes(6)) return 'Weekends'
  return sorted.map((d) => DAY_SHORT[d]).join(' ')
}

/** The two repeating Clock alarms that match a fasting plan. */
export function planAlarms(plan: Pick<FastingPlan, 'startTime' | 'goalHours' | 'days'>): { time: string; label: string; days: string }[] {
  const [h, m] = plan.startTime.split(':').map(Number)
  const endMin = h * 60 + m + Math.round(plan.goalHours * 60)
  const shift = Math.floor(endMin / 1440) // goal lands this many days after the start
  const t = endMin % 1440
  const goalTime = `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`
  return [
    { time: plan.startTime, label: 'Start your fast', days: dayList(plan.days) },
    { time: goalTime, label: 'Fasting goal reached', days: dayList(plan.days.map((d) => (d + shift) % 7)) },
  ]
}
