import { Bell, BellOff, Bluetooth, BluetoothSearching, Heart, Pause, Play, Square } from 'lucide-react'
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router'

import { BackLink } from '@/components/BackLink'
import { HeartRateChart } from '@/components/charts/HeartRateChart'
import { StatTile } from '@/components/charts/StatTile'
import { Field } from '@/components/Field'
import { NumberStepper } from '@/components/NumberStepper'
import { ScreenHeader } from '@/components/ScreenHeader'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { meditations, todayKey } from '@/data'
import { ringBell, unlockBell } from '@/lib/bell'
import { useFocusMode } from '@/lib/focusMode'
import { formatDuration } from '@/lib/format'
import { useHeartRateMonitor, type MonitorState } from '@/lib/heartRateMonitor'
import { formatClock, SessionClock, summariseHeartRate, type HrSample } from '@/lib/meditation'
import { parseWholeNumber } from '@/lib/numbers'
import { dayPath } from '@/lib/routes'
import { cn } from '@/lib/utils'
import { useWakeLock } from '@/lib/wakeLock'

type Stage = 'setup' | 'running' | 'paused' | 'done'

const PRESETS = [5, 10, 15, 20, 30]
const PREFS_KEY = 'aura-meditation-prefs' // last length and bell choice, on this device only

function readPrefs(): { minutes: number; bell: boolean } {
  try {
    const saved = JSON.parse(localStorage.getItem(PREFS_KEY) ?? '{}')
    return { minutes: Number(saved.minutes) || 10, bell: saved.bell !== false }
  } catch {
    return { minutes: 10, bell: true }
  }
}

/** The meditation timer, with optional live heart rate from a Bluetooth monitor. */
export function MeditateScreen() {
  const navigate = useNavigate()
  const [prefs] = useState(readPrefs)
  const [minutesText, setMinutesText] = useState(String(prefs.minutes))
  const [bell, setBell] = useState(prefs.bell)
  const [stage, setStage] = useState<Stage>('setup')
  const [elapsedSec, setElapsedSec] = useState(0)
  const [samples, setSamples] = useState<HrSample[]>([])
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const clock = useRef(new SessionClock())
  const date = useRef(todayKey())

  const minutes = Math.min(180, Math.max(1, parseWholeNumber(minutesText) ?? 10))
  const targetSec = minutes * 60
  const active = stage === 'running' || stage === 'paused'

  // Heart-rate readings are recorded (one per second) only while the timer is running.
  const recordReading = useCallback((bpm: number) => {
    if (!clock.current.running) return
    const t = Math.floor(clock.current.elapsedMs() / 1000)
    setSamples((list) => (list.at(-1)?.t === t ? [...list.slice(0, -1), { t, bpm }] : [...list, { t, bpm }]))
  }, [])
  const monitor = useHeartRateMonitor(recordReading)

  useWakeLock(active)
  useFocusMode(active)

  // Tick the display; finish (with the bell) when the time is up.
  useEffect(() => {
    if (stage !== 'running') return
    const timer = setInterval(() => {
      const sec = clock.current.elapsedMs() / 1000
      setElapsedSec(sec)
      if (sec >= targetSec) {
        clock.current.pause()
        setElapsedSec(targetSec)
        setStage('done')
        if (bell) ringBell()
      }
    }, 250)
    return () => clearInterval(timer)
  }, [stage, targetSec, bell])

  // Ask before leaving the page mid-session.
  useEffect(() => {
    if (!active) return
    const warn = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [active])

  function start() {
    unlockBell() // sound is only allowed straight after a tap
    try {
      localStorage.setItem(PREFS_KEY, JSON.stringify({ minutes, bell }))
    } catch {
      // Only a convenience.
    }
    date.current = todayKey()
    clock.current = new SessionClock()
    clock.current.start()
    setSamples([])
    setElapsedSec(0)
    setStage('running')
    if (bell) ringBell()
  }

  function togglePause() {
    if (stage === 'running') {
      clock.current.pause()
      setStage('paused')
    } else {
      clock.current.start()
      setStage('running')
    }
  }

  function endEarly() {
    if (!confirm('End the session now? You can still save it.')) return
    clock.current.pause()
    setElapsedSec(clock.current.elapsedMs() / 1000)
    setStage('done')
    if (bell) ringBell()
  }

  async function save() {
    setSaving(true)
    const summary = summariseHeartRate(samples)
    const note = notes.trim()
    await meditations.create({
      date: date.current,
      durationSec: Math.round(elapsedSec),
      hrSamples: samples,
      ...(summary && { avgBpm: summary.avgBpm, minBpm: summary.minBpm, maxBpm: summary.maxBpm }),
      ...(samples.length > 0 && monitor.deviceName && { deviceName: monitor.deviceName }),
      ...(note && { notes: note }),
    })
    monitor.disconnect()
    navigate(dayPath(date.current))
  }

  function discard() {
    if (!confirm('Discard this session? It won’t be saved.')) return
    setStage('setup')
    setSamples([])
    setNotes('')
  }

  if (stage === 'done') {
    return (
      <Summary
        elapsedSec={elapsedSec}
        samples={samples}
        notes={notes}
        onNotes={setNotes}
        onSave={() => void save()}
        onDiscard={discard}
        saving={saving}
      />
    )
  }

  if (active) {
    const remaining = targetSec - elapsedSec
    const progress = Math.min(1, elapsedSec / targetSec)
    return (
      <div className="flex min-h-[70dvh] flex-col items-center justify-center gap-8 pt-4">
        <ProgressRing progress={progress} breathing={stage === 'running'}>
          <p className="text-6xl font-semibold tracking-tight tabular-nums" aria-live="off">
            {formatClock(remaining)}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">{stage === 'paused' ? 'Paused' : `of ${minutes} min`}</p>
        </ProgressRing>

        <LiveHeartRate monitor={monitor} samples={samples} />

        <div className="flex w-full max-w-xs gap-3">
          <Button variant="secondary" size="lg" className="flex-1" onClick={togglePause}>
            {stage === 'paused' ? <Play /> : <Pause />}
            {stage === 'paused' ? 'Resume' : 'Pause'}
          </Button>
          <Button variant="outline" size="lg" className="flex-1" onClick={endEarly}>
            <Square /> End
          </Button>
        </div>
      </div>
    )
  }

  return (
    <>
      <BackLink to="/log" label="Log" />
      <ScreenHeader title="Meditate" subtitle="Settle in" />
      <div className="space-y-4">
        <Card>
          <CardContent className="space-y-5">
            <Field label="Length" htmlFor="minutes">
              <div className="grid grid-cols-5 gap-2">
                {PRESETS.map((m) => (
                  <button
                    key={m}
                    type="button"
                    aria-pressed={minutes === m}
                    onClick={() => setMinutesText(String(m))}
                    className={cn(
                      'h-11 rounded-xl text-sm font-medium transition-colors',
                      minutes === m ? 'bg-meditation text-white dark:text-background' : 'bg-muted text-muted-foreground',
                    )}
                  >
                    {m}
                  </button>
                ))}
              </div>
              <NumberStepper id="minutes" value={minutesText} onChange={setMinutesText} min={1} />
              <p className="text-center text-sm text-muted-foreground">minutes</p>
            </Field>
            <button
              type="button"
              aria-pressed={bell}
              onClick={() => setBell((b) => !b)}
              className="flex w-full items-center gap-3 rounded-xl bg-muted px-4 py-3 text-left text-sm"
            >
              {bell ? <Bell className="size-5 text-meditation" /> : <BellOff className="size-5 text-muted-foreground" />}
              <span className="flex-1">
                <span className="block font-medium">Bell at start and end</span>
                <span className="text-muted-foreground">
                  {bell ? 'On — turn your ringer on to hear it' : 'Off — a silent session'}
                </span>
              </span>
              <span
                className={cn('h-6 w-10 rounded-full p-0.5 transition-colors', bell ? 'bg-meditation' : 'bg-border')}
                aria-hidden
              >
                <span className={cn('block size-5 rounded-full bg-white transition-transform', bell && 'translate-x-4')} />
              </span>
            </button>
          </CardContent>
        </Card>

        <HeartRateCard monitor={monitor} />

        <Button size="lg" className="h-14 w-full text-base" onClick={start}>
          <Play /> Begin {minutes} {minutes === 1 ? 'minute' : 'minutes'}
        </Button>
      </div>
    </>
  )
}

function ProgressRing({ progress, breathing, children }: { progress: number; breathing: boolean; children: ReactNode }) {
  const r = 120
  const c = 2 * Math.PI * r
  return (
    <div className="relative grid size-72 place-items-center">
      {/* A slow "breathing" glow; switched off if you've asked your phone for reduced motion. */}
      <div
        aria-hidden
        className={cn(
          'absolute inset-6 rounded-full bg-meditation/15 blur-xl',
          breathing && 'animate-[breathe_10s_ease-in-out_infinite] motion-reduce:animate-none',
        )}
      />
      <svg viewBox="0 0 280 280" className="absolute inset-0 -rotate-90" aria-hidden>
        <circle cx="140" cy="140" r={r} fill="none" stroke="var(--border)" strokeWidth="6" />
        <circle
          cx="140"
          cy="140"
          r={r}
          fill="none"
          stroke="var(--meditation)"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - progress)}
          className="transition-[stroke-dashoffset] duration-300 ease-linear"
        />
      </svg>
      <div className="relative text-center">{children}</div>
    </div>
  )
}

function LiveHeartRate({ monitor, samples }: { monitor: MonitorState; samples: HrSample[] }) {
  if (monitor.status === 'unsupported' || monitor.status === 'idle') return null
  return (
    <div className="w-full space-y-2">
      <p className="flex items-center justify-center gap-2 text-sm text-muted-foreground" aria-live="polite">
        <Heart className={cn('size-4 text-meditation', monitor.bpm && 'animate-pulse motion-reduce:animate-none')} />
        {monitor.status === 'connected' && monitor.bpm ? (
          <>
            <span className="text-2xl font-semibold text-foreground tabular-nums">{monitor.bpm}</span> bpm
          </>
        ) : (
          (monitor.message ?? 'Waiting for heart rate…')
        )}
      </p>
      {samples.length > 1 && <HeartRateChart samples={samples} height={120} />}
    </div>
  )
}

function HeartRateCard({ monitor }: { monitor: ReturnType<typeof useHeartRateMonitor> }) {
  if (monitor.status === 'unsupported') {
    const isIPhone = /iPhone|iPad|iPod/.test(navigator.userAgent)
    return (
      <Card className="border-dashed bg-transparent shadow-none">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Bluetooth className="size-4 text-muted-foreground" /> Heart rate not available here
          </CardTitle>
          <CardDescription>
            {isIPhone
              ? 'iPhone browsers can’t connect to Bluetooth devices. To see live heart rate, open Aura in the free Bluefy browser from the App Store. The timer works fine without it.'
              : 'This browser can’t connect to Bluetooth devices. Chrome or Edge on Android or a computer can. The timer works fine without it.'}
          </CardDescription>
        </CardHeader>
        {isIPhone && (
          <CardContent>
            <Button
              variant="outline"
              size="sm"
              onClick={() => void navigator.clipboard?.writeText(window.location.href)}
            >
              Copy link for Bluefy
            </Button>
          </CardContent>
        )}
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Heart className="size-4 text-meditation" /> Heart rate
          <span className="font-normal text-muted-foreground">Optional</span>
        </CardTitle>
        <CardDescription>
          {monitor.status === 'connected'
            ? `Connected to ${monitor.deviceName ?? 'your monitor'}.`
            : 'Connect a chest strap, or a watch set to broadcast heart rate (on a Garmin: hold Light → Broadcast Heart Rate).'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {monitor.status === 'connected' || monitor.status === 'reconnecting' ? (
          <div className="flex items-center justify-between gap-3">
            <p className="flex items-center gap-2" aria-live="polite">
              <Heart className="size-5 text-meditation" />
              {monitor.bpm ? (
                <>
                  <span className="text-3xl font-semibold tabular-nums">{monitor.bpm}</span>
                  <span className="text-muted-foreground">bpm</span>
                </>
              ) : (
                <span className="text-sm text-muted-foreground">{monitor.message ?? 'Waiting for a reading…'}</span>
              )}
            </p>
            <Button variant="ghost" size="sm" onClick={monitor.disconnect}>
              Disconnect
            </Button>
          </div>
        ) : (
          <Button variant="outline" onClick={() => void monitor.connect()} disabled={monitor.status === 'connecting'}>
            <BluetoothSearching /> {monitor.status === 'connecting' ? 'Connecting…' : 'Connect heart rate monitor'}
          </Button>
        )}
        {monitor.status === 'error' && monitor.message && <p className="text-sm text-destructive">{monitor.message}</p>}
      </CardContent>
    </Card>
  )
}

function Summary({
  elapsedSec,
  samples,
  notes,
  onNotes,
  onSave,
  onDiscard,
  saving,
}: {
  elapsedSec: number
  samples: HrSample[]
  notes: string
  onNotes: (v: string) => void
  onSave: () => void
  onDiscard: () => void
  saving: boolean
}) {
  const hr = summariseHeartRate(samples)
  return (
    <>
      <ScreenHeader title="Well done" subtitle="Session complete" />
      <div className="space-y-4">
        <StatTile label="Meditated for" value={formatDuration(Math.round(elapsedSec))} />
        {hr && (
          <>
            <div className="grid grid-cols-3 gap-2">
              <StatTile label="Average" value={hr.avgBpm} unit="bpm" className="p-3" />
              <StatTile label="Lowest" value={hr.minBpm} unit="bpm" className="p-3" />
              <StatTile label="Highest" value={hr.maxBpm} unit="bpm" className="p-3" />
            </div>
            <Card>
              <CardHeader>
                <CardTitle>
                  {hr.drop > 0
                    ? `Heart rate fell ${hr.drop} bpm`
                    : hr.drop < 0
                      ? `Heart rate rose ${-hr.drop} bpm`
                      : 'Heart rate held steady'}
                </CardTitle>
                <CardDescription>
                  From {hr.startBpm} bpm at the start to {hr.endBpm} bpm at the end
                </CardDescription>
              </CardHeader>
              <CardContent>
                <HeartRateChart samples={samples} />
              </CardContent>
            </Card>
          </>
        )}
        <Card>
          <CardContent>
            <Field label="Notes" hint="Optional" htmlFor="notes">
              <Textarea id="notes" value={notes} onChange={(e) => onNotes(e.target.value)} placeholder="How was it?" />
            </Field>
          </CardContent>
        </Card>
        <Button size="lg" className="w-full" onClick={onSave} disabled={saving}>
          Save session
        </Button>
        <Button variant="ghost" className="w-full text-muted-foreground" onClick={onDiscard}>
          Discard
        </Button>
      </div>
    </>
  )
}
