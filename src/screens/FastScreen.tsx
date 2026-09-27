import { AlarmClock, Bell, BellOff, CalendarPlus, Check, ChevronDown, ChevronRight, Hourglass, Play, Square, Timer, X } from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router'

import { BackLink } from '@/components/BackLink'
import { StatTile } from '@/components/charts/StatTile'
import { Field } from '@/components/Field'
import { NumberStepper } from '@/components/NumberStepper'
import { ScreenHeader } from '@/components/ScreenHeader'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { fastingPlan, fasts, useLiveData, type FastingPlan, type FastSession } from '@/data'
import { fromLocalInput, saveCalendarFile, toLocalInput } from '@/lib/calendarFile'
import {
  DEFAULT_GOAL,
  formatFastClock,
  formatFastDuration,
  GOAL_PRESETS,
  goalReminderIcs,
  hoursBetween,
  nextStage,
  planRemindersIcs,
  SOURCES,
  stageAt,
  STAGES,
  timeAt,
  type FastingStage,
} from '@/lib/fasting'
import { isIPhone, openAppLink, planAlarms, SHORTCUT_NAME, shortcutTimerUrl } from '@/lib/iphoneReminders'
import { askToNotify, notifyAvailability, type NotifyAvailability } from '@/lib/notify'
import { parseWholeNumber } from '@/lib/numbers'
import { dayPath } from '@/lib/routes'
import { cn } from '@/lib/utils'

const when = (d: Date) =>
  d.toLocaleString(undefined, { weekday: 'short', hour: '2-digit', minute: '2-digit' })

/** Start, follow and record a fast; set your fasting plan and reminders. */
export function FastScreen() {
  const data = useLiveData(async () => ({
    active: await fasts.active(),
    plan: await fastingPlan.get(),
    recent: (await fasts.listFinished()).slice(0, 5),
  }))
  if (!data) return null

  return (
    <>
      <BackLink to="/log" label="Log" />
      <ScreenHeader title="Fast" subtitle={data.active ? 'Fasting now' : 'Start a fast'} rune="ᛁ" />
      <div className="space-y-4">
        {data.active ? (
          <ActiveFast key={data.active.id} fast={data.active} />
        ) : (
          <StartFast plan={data.plan} recent={data.recent} />
        )}
        <PlanCard plan={data.plan} />
        <AboutStages />
      </div>
    </>
  )
}

// ---- Not fasting: start one ------------------------------------------------

function StartFast({ plan, recent }: { plan?: FastingPlan; recent: FastSession[] }) {
  const [goalText, setGoalText] = useState(String(plan?.goalHours ?? DEFAULT_GOAL))
  const [earlier, setEarlier] = useState(false)
  const [startText, setStartText] = useState(() => toLocalInput(new Date()))
  const [error, setError] = useState<string>()
  const goal = parseWholeNumber(goalText)

  async function start() {
    if (!goal || goal < 1 || goal > 240) return setError('Choose a goal between 1 and 240 hours.')
    const startedAt = earlier ? fromLocalInput(startText) : new Date()
    if (!startedAt || startedAt > new Date()) return setError('The start time can’t be in the future.')
    await fasts.start(startedAt, goal)
  }

  return (
    <>
      <Card>
        <CardContent className="space-y-5">
          <Field label="Goal" htmlFor="goal">
            <div className="grid grid-cols-4 gap-2">
              {GOAL_PRESETS.map((h) => (
                <button
                  key={h}
                  type="button"
                  aria-pressed={goal === h}
                  onClick={() => setGoalText(String(h))}
                  className={cn(
                    'h-11 rounded-md text-sm font-semibold transition-colors',
                    goal === h ? 'bg-fast text-white dark:text-background' : 'bg-muted text-muted-foreground',
                  )}
                >
                  {h} h
                </button>
              ))}
            </div>
            <NumberStepper id="goal" value={goalText} onChange={setGoalText} min={1} />
            <p className="text-center text-sm text-muted-foreground">hours</p>
          </Field>

          <Field label="Started">
            <div className="grid grid-cols-2 gap-2">
              {[false, true].map((e) => (
                <button
                  key={String(e)}
                  type="button"
                  aria-pressed={earlier === e}
                  onClick={() => setEarlier(e)}
                  className={cn(
                    'h-11 rounded-md text-sm font-semibold transition-colors',
                    earlier === e ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground',
                  )}
                >
                  {e ? 'Earlier' : 'Now'}
                </button>
              ))}
            </div>
            {earlier && (
              <Input
                type="datetime-local"
                aria-label="Start time"
                value={startText}
                max={toLocalInput(new Date())}
                onChange={(e) => setStartText(e.target.value)}
              />
            )}
          </Field>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </CardContent>
      </Card>

      <Button size="lg" className="h-14 w-full text-base" onClick={() => void start()}>
        <Play /> Start {goal ? formatFastDuration(goal).replace(' 00 m', '') : ''} fast
      </Button>

      {recent.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent fasts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {recent.map((f) => {
              const hours = hoursBetween(f.startedAt, f.endedAt!)
              return (
                <Link
                  key={f.id}
                  to={`/fast/${f.id}`}
                  className="flex items-center gap-3 rounded-md px-2 py-2 text-sm hover:bg-accent/50"
                >
                  <span className="w-24 shrink-0 text-muted-foreground">
                    {new Date(f.endedAt!).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })}
                  </span>
                  <span className="flex-1 font-semibold tabular-nums">{formatFastDuration(hours)}</span>
                  {hours >= f.goalHours ? (
                    <span className="flex items-center gap-1 text-fast">
                      <Check className="size-4" /> {f.goalHours} h
                    </span>
                  ) : (
                    <span className="text-muted-foreground">goal {f.goalHours} h</span>
                  )}
                  <ChevronRight className="size-4 text-muted-foreground/60" />
                </Link>
              )
            })}
          </CardContent>
        </Card>
      )}
    </>
  )
}

// ---- Fasting now -----------------------------------------------------------

function ActiveFast({ fast }: { fast: FastSession }) {
  const navigate = useNavigate()
  const [now, setNow] = useState(() => new Date())
  const [ending, setEnding] = useState(false)
  const [editingStart, setEditingStart] = useState(false)

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const hours = Math.max(0, hoursBetween(fast.startedAt, now))
  const stage = stageAt(hours)
  const next = nextStage(hours)
  const goalAt = timeAt(fast.startedAt, fast.goalHours)
  const reached = hours >= fast.goalHours
  const progress = Math.min(1, hours / fast.goalHours)
  const iPhone = isIPhone()

  if (ending) return <EndFast fast={fast} onBack={() => setEnding(false)} onSaved={(date) => navigate(dayPath(date), { state: { saved: 'Fast' } })} />

  return (
    <>
      <Card className="items-center">
        <CardContent className="flex flex-col items-center gap-4">
          <Ring progress={progress} done={reached}>
            <p className="text-5xl font-semibold tabular-nums">{formatFastClock(hours)}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {reached ? `Goal of ${fast.goalHours} h reached` : `of ${fast.goalHours} h goal`}
            </p>
          </Ring>
          <p className="text-center text-sm text-muted-foreground">
            Started {when(new Date(fast.startedAt))} ·{' '}
            {reached ? 'goal reached' : `goal at ${when(goalAt)}`}{' '}
            <button type="button" className="font-semibold text-primary underline-offset-2 hover:underline" onClick={() => setEditingStart((v) => !v)}>
              Change start
            </button>
          </p>
          {editingStart && <EditStart fast={fast} onDone={() => setEditingStart(false)} />}
        </CardContent>
      </Card>

      <StageCard stage={stage} hours={hours} next={next} startedAt={fast.startedAt} />
      <Timeline startedAt={fast.startedAt} hours={hours} goalHours={fast.goalHours} />

      <div className="grid grid-cols-2 gap-2">
        <Button size="lg" onClick={() => setEnding(true)}>
          <Square /> End fast
        </Button>
        <Button
          size="lg"
          variant="outline"
          disabled={reached}
          onClick={() =>
            iPhone
              ? openAppLink(shortcutTimerUrl((fast.goalHours - hours) * 60))
              : void saveCalendarFile(`aura-fast-goal.ics`, goalReminderIcs(fast))
          }
        >
          {iPhone ? <Timer /> : <CalendarPlus />} Remind me
        </Button>
      </div>
      <p className="px-1 text-xs text-muted-foreground">
        {iPhone
          ? `“Remind me” starts an iPhone Clock timer for the ${formatFastDuration(Math.max(0, fast.goalHours - hours))} left, which rings even when Aura is closed. It needs the one-time “${SHORTCUT_NAME}” shortcut — see Plan & reminders below.`
          : '“Remind me” adds your goal time to your calendar, which alerts you even when Aura is closed.'}
      </p>
      <Button
        variant="ghost"
        className="w-full text-muted-foreground"
        onClick={async () => {
          if (confirm('Cancel this fast? It won’t be recorded.')) await fasts.remove(fast.id)
        }}
      >
        <X /> Cancel fast
      </Button>
    </>
  )
}

function Ring({ progress, done, children }: { progress: number; done: boolean; children: ReactNode }) {
  const r = 110
  const c = 2 * Math.PI * r
  return (
    <div className="relative grid size-64 place-items-center">
      <svg viewBox="0 0 250 250" className="absolute inset-0 -rotate-90" aria-hidden>
        <circle cx="125" cy="125" r={r} fill="none" stroke="var(--border)" strokeWidth="8" />
        <circle
          cx="125"
          cy="125"
          r={r}
          fill="none"
          stroke={done ? 'var(--primary)' : 'var(--fast)'}
          strokeWidth="8"
          strokeLinecap="butt"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - progress)}
          className="transition-[stroke-dashoffset] duration-700"
        />
      </svg>
      <div className="relative text-center">{children}</div>
    </div>
  )
}

function EditStart({ fast, onDone }: { fast: FastSession; onDone: () => void }) {
  const [value, setValue] = useState(() => toLocalInput(new Date(fast.startedAt)))
  const [error, setError] = useState<string>()
  async function save() {
    const d = fromLocalInput(value)
    if (!d || d > new Date()) return setError('Pick a time that’s not in the future.')
    await fasts.update(fast.id, { startedAt: d.toISOString(), date: toLocalInput(d).slice(0, 10) })
    onDone()
  }
  return (
    <div className="w-full space-y-2">
      <Input type="datetime-local" aria-label="Start time" value={value} max={toLocalInput(new Date())} onChange={(e) => setValue(e.target.value)} />
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex gap-2">
        <Button size="sm" onClick={() => void save()}>
          Save start time
        </Button>
        <Button size="sm" variant="ghost" onClick={onDone}>
          Cancel
        </Button>
      </div>
    </div>
  )
}

function StageCard({ stage, hours, next, startedAt }: { stage: FastingStage; hours: number; next?: FastingStage; startedAt: string }) {
  return (
    <Card className="border-l-4 border-l-fast">
      <CardHeader>
        <p className="text-xs font-semibold tracking-wider text-fast uppercase">Your body now</p>
        <CardTitle className="text-xl">{stage.name}</CardTitle>
        <CardDescription>{stage.summary}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <p className="leading-relaxed">{stage.detail}</p>
        <p className="text-xs text-muted-foreground">Evidence: {stage.evidence}</p>
        {next && (
          <p className="border-t pt-3 text-muted-foreground">
            <span className="font-semibold text-foreground">Next: {next.name}</span> in{' '}
            {formatFastDuration(next.fromHours - hours)} ({when(timeAt(startedAt, next.fromHours))})
          </p>
        )}
      </CardContent>
    </Card>
  )
}

function Timeline({ startedAt, hours, goalHours }: { startedAt: string; hours: number; goalHours: number }) {
  // Stages up to a little past the goal, so a 16 h fast isn't cluttered with 72 h.
  const shown = STAGES.filter((s) => s.fromHours <= Math.max(goalHours, hours) + 8)
  return (
    <Card>
      <CardHeader>
        <CardTitle>Stages</CardTitle>
      </CardHeader>
      <CardContent>
        <ol className="space-y-3">
          {shown.map((s) => {
            const done = hours >= s.fromHours
            return (
              <li key={s.fromHours} className="flex items-start gap-3 text-sm">
                <span
                  className={cn(
                    'mt-0.5 grid size-5 shrink-0 place-items-center rounded-sm border',
                    done ? 'border-fast bg-fast text-white dark:text-background' : 'border-border',
                  )}
                >
                  {done && <Check className="size-3.5" strokeWidth={3} />}
                </span>
                <span className="flex-1">
                  <span className={cn('font-semibold', !done && 'text-muted-foreground')}>
                    {s.fromHours} h · {s.name}
                  </span>
                  <span className="block text-muted-foreground">{s.summary}</span>
                </span>
                <span className="shrink-0 text-xs text-muted-foreground tabular-nums">{when(timeAt(startedAt, s.fromHours))}</span>
              </li>
            )
          })}
        </ol>
      </CardContent>
    </Card>
  )
}

function EndFast({ fast, onBack, onSaved }: { fast: FastSession; onBack: () => void; onSaved: (date: string) => void }) {
  const [endText, setEndText] = useState(() => toLocalInput(new Date()))
  const [notes, setNotes] = useState('')
  const [error, setError] = useState<string>()
  const end = fromLocalInput(endText)
  const hours = end ? hoursBetween(fast.startedAt, end) : 0

  async function save() {
    if (!end || end <= new Date(fast.startedAt) || isInFuture(end))
      return setError('The end time must be after the start and not in the future.')
    const saved = await fasts.finish(fast.id, end, notes)
    onSaved(saved.date)
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-2">
        <StatTile label="Fasted for" value={formatFastDuration(hours)} className="p-3" />
        <StatTile
          label="Goal"
          value={`${fast.goalHours} h`}
          detail={hours >= fast.goalHours ? 'Reached — skål!' : `${formatFastDuration(fast.goalHours - hours)} short`}
          className="p-3"
        />
      </div>
      <Card>
        <CardContent className="space-y-4">
          <p className="text-sm">
            You reached <span className="font-semibold">{stageAt(hours).name}</span>.
          </p>
          <Field label="Ended" htmlFor="ended">
            <Input id="ended" type="datetime-local" value={endText} max={toLocalInput(new Date())} onChange={(e) => setEndText(e.target.value)} />
          </Field>
          <Field label="Notes" hint="Optional" htmlFor="notes">
            <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="How did it feel? What broke the fast?" />
          </Field>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </CardContent>
      </Card>
      <Button size="lg" className="w-full" onClick={() => void save()}>
        Save fast
      </Button>
      <Button variant="ghost" className="w-full text-muted-foreground" onClick={onBack}>
        Keep fasting
      </Button>
    </>
  )
}

/** Allows a minute's slack, since the end time is only chosen to the minute. */
function isInFuture(date: Date): boolean {
  return date.getTime() > Date.now() + 60_000
}

// ---- Plan & reminders -------------------------------------------------------

const DAY_LETTERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0] // Monday first

function PlanCard({ plan }: { plan?: FastingPlan }) {
  const [open, setOpen] = useState(false)
  const [goalText, setGoalText] = useState(String(plan?.goalHours ?? DEFAULT_GOAL))
  const [startTime, setStartTime] = useState(plan?.startTime ?? '20:00')
  const [days, setDays] = useState<number[]>(plan?.days ?? [0, 1, 2, 3, 4, 5, 6])
  const [saved, setSaved] = useState(false)
  const [alerts, setAlerts] = useState<NotifyAvailability>(notifyAvailability)
  const iPhone = isIPhone()
  const goal = parseWholeNumber(goalText)
  const valid = !!goal && goal >= 1 && goal <= 240 && /^\d{2}:\d{2}$/.test(startTime) && days.length > 0

  async function save() {
    if (!valid) return
    await fastingPlan.save({ goalHours: goal!, startTime, days: [...days].sort() })
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const summary = plan
    ? `${plan.goalHours} h from ${plan.startTime}, ${plan.days.length === 7 ? 'every day' : WEEK_ORDER.filter((d) => plan.days.includes(d)).map((d) => DAY_NAMES[d].slice(0, 3)).join(' ')}`
    : 'Set your usual fasting window for reminders'

  return (
    <Card>
      <button type="button" className="flex w-full items-start gap-3 px-5 text-left" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <span className="flex-1 space-y-1">
          <span className="block font-semibold">Plan &amp; reminders</span>
          <span className="block text-sm text-muted-foreground">{summary}</span>
        </span>
        <ChevronDown className={cn('mt-1 size-5 text-muted-foreground transition-transform', open && 'rotate-180')} />
      </button>
      {open && (
        <CardContent className="space-y-5">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Usual start" htmlFor="plan-start">
              <Input id="plan-start" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
            </Field>
            <Field label="Goal (hours)" htmlFor="plan-goal">
              <Input id="plan-goal" inputMode="numeric" value={goalText} onChange={(e) => setGoalText(e.target.value)} />
            </Field>
          </div>
          <Field label="Days">
            <div className="grid grid-cols-7 gap-1.5" role="group" aria-label="Fasting days">
              {WEEK_ORDER.map((d) => (
                <button
                  key={d}
                  type="button"
                  aria-label={DAY_NAMES[d]}
                  aria-pressed={days.includes(d)}
                  onClick={() => setDays((list) => (list.includes(d) ? list.filter((x) => x !== d) : [...list, d]))}
                  className={cn(
                    'h-10 rounded-md text-sm font-semibold transition-colors',
                    days.includes(d) ? 'bg-fast text-white dark:text-background' : 'bg-muted text-muted-foreground',
                  )}
                >
                  {DAY_LETTERS[d]}
                </button>
              ))}
            </div>
          </Field>
          {valid && goal && (
            <p className="text-sm text-muted-foreground">
              Fast from {startTime} until {goalEnd(startTime, goal)}.
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => void save()} disabled={!valid}>
              {saved ? <Check /> : null} {saved ? 'Saved' : 'Save plan'}
            </Button>
            {!iPhone && (
              <Button
                variant="outline"
                disabled={!valid}
                onClick={() => void saveCalendarFile('aura-fasting-plan.ics', planRemindersIcs({ startTime, goalHours: goal!, days }))}
              >
                <CalendarPlus /> Add to Calendar
              </Button>
            )}
          </div>
          {!iPhone && (
            <p className="text-xs text-muted-foreground">
              Add to Calendar creates two repeating reminders — “Start your fast” and “Fasting goal” — that alert you
              even when Aura is closed.
            </p>
          )}
          {iPhone && valid && <IPhoneReminders startTime={startTime} goalHours={goal!} days={days} />}

          <div className="space-y-2 border-t pt-4 text-sm">
            <p className="flex items-center gap-2 font-semibold">
              {alerts === 'granted' ? <Bell className="size-4 text-fast" /> : <BellOff className="size-4 text-muted-foreground" />}
              Alerts while Aura is open
            </p>
            <p className="text-muted-foreground">
              {alerts === 'granted'
                ? 'On. Aura shows a notification at each new stage and when you reach your goal, as long as it’s open.'
                : alerts === 'denied'
                  ? 'Notifications are blocked for this browser. You’ll still see banners inside Aura.'
                  : alerts === 'unsupported'
                    ? `This browser can’t show notifications, so Aura shows a banner inside the app instead. For alerts when Aura is closed, use ${iPhone ? 'the Clock alarms and Remind me' : 'Add to Calendar'}.`
                    : 'Aura always shows a banner at each stage. Turn on notifications to get them as system alerts too.'}
            </p>
            {alerts === 'default' && (
              <Button size="sm" variant="outline" onClick={async () => setAlerts(await askToNotify())}>
                <Bell /> Turn on notifications
              </Button>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  )
}

/** iPhone: the Clock alarms for your plan, and the one-time Shortcut behind "Remind me". */
function IPhoneReminders(plan: { startTime: string; goalHours: number; days: number[] }) {
  const [showSteps, setShowSteps] = useState(false)
  return (
    <div className="space-y-4 border-t pt-4 text-sm">
      <div className="space-y-2">
        <p className="flex items-center gap-2 font-semibold">
          <AlarmClock className="size-4 text-fast" /> Clock alarms for your plan
        </p>
        <p className="text-muted-foreground">
          The surest reminder on iPhone. Set these once in the <strong>Clock</strong> app → <strong>Alarms</strong> →{' '}
          <strong>+</strong>, using <strong>Repeat</strong> and <strong>Label</strong>:
        </p>
        <ul className="divide-y rounded-md border bg-muted/40">
          {planAlarms(plan).map((alarm) => (
            <li key={alarm.label} className="flex items-baseline gap-3 px-3 py-2">
              <span className="text-lg font-semibold tabular-nums">{alarm.time}</span>
              <span className="flex-1">{alarm.label}</span>
              <span className="text-xs text-muted-foreground">{alarm.days}</span>
            </li>
          ))}
        </ul>
        <p className="text-xs text-muted-foreground">If you change your plan, update the alarms to match.</p>
      </div>

      <div className="space-y-2">
        <p className="flex items-center gap-2 font-semibold">
          <Timer className="size-4 text-fast" /> “Remind me” timer — one-time setup
        </p>
        <p className="text-muted-foreground">
          Lets “Remind me” start a Clock timer for the time left in a fast. Takes about a minute.
        </p>
        <button type="button" className="font-semibold text-primary" onClick={() => setShowSteps((v) => !v)} aria-expanded={showSteps}>
          {showSteps ? 'Hide steps' : 'Show me how'}
        </button>
        {showSteps && (
          <ol className="list-decimal space-y-1.5 pl-5">
            <li>
              Open the <strong>Shortcuts</strong> app and tap <strong>+</strong>.
            </li>
            <li>
              Tap the name at the top and call it exactly <strong>{SHORTCUT_NAME}</strong>.
            </li>
            <li>
              Tap <strong>Add Action</strong>, search for <strong>Start Timer</strong> and add it.
            </li>
            <li>
              Tap the <strong>30</strong> in “Start timer for 30 minutes”, choose <strong>Select Variable</strong>,
              then <strong>Shortcut Input</strong>. Keep it as minutes.
            </li>
            <li>
              Tap <strong>Done</strong>. Then test it below — iPhone will ask once to let Aura open Shortcuts.
            </li>
          </ol>
        )}
        <Button size="sm" variant="outline" onClick={() => openAppLink(shortcutTimerUrl(1))}>
          <Timer /> Test: 1-minute timer
        </Button>
      </div>
    </div>
  )
}

function goalEnd(startTime: string, goal: number): string {
  const [h, m] = startTime.split(':').map(Number)
  const endMin = h * 60 + m + goal * 60
  const days = Math.floor(endMin / 1440)
  const t = endMin % 1440
  const hhmm = `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`
  return days === 0 ? hhmm : days === 1 ? `${hhmm} the next day` : `${hhmm}, ${days} days later`
}

// ---- The science ------------------------------------------------------------

function AboutStages() {
  const [open, setOpen] = useState(false)
  return (
    <Card>
      <button type="button" className="flex w-full items-start gap-3 px-5 text-left" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <Hourglass className="mt-0.5 size-5 shrink-0 text-fast" />
        <span className="flex-1 space-y-1">
          <span className="block font-semibold">About the stages</span>
          <span className="block text-sm text-muted-foreground">What the research says, and its limits</span>
        </span>
        <ChevronDown className={cn('mt-1 size-5 text-muted-foreground transition-transform', open && 'rotate-180')} />
      </button>
      {open && (
        <CardContent className="space-y-4 text-sm">
          <p>
            The hours are typical, not exact: when you switch stages depends on your last meal, how active you are
            and your own metabolism. Each stage notes how strong its evidence is.
          </p>
          {STAGES.map((s) => (
            <div key={s.fromHours} className="space-y-1">
              <p className="font-semibold">
                {s.fromHours} h · {s.name} <span className="font-normal text-muted-foreground">— {s.evidence}</span>
              </p>
              <p className="text-muted-foreground">{s.detail}</p>
            </div>
          ))}
          <div className="space-y-1 border-t pt-3">
            <p className="font-semibold">Sources</p>
            <ul className="list-disc space-y-1 pl-5 text-xs text-muted-foreground">
              {Object.values(SOURCES).map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </div>
          <p className="rounded-md bg-muted p-3 text-xs">
            Not medical advice. If you have diabetes, take medication, are pregnant, or have a history of eating
            disorders, talk to a doctor before fasting. Stop if you feel unwell.
          </p>
        </CardContent>
      )}
    </Card>
  )
}
