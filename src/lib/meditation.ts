// Pure maths behind the meditation timer and its heart-rate summary.

export interface HrSample {
  /** Seconds since the session started (pauses don't count). */
  t: number
  bpm: number
}

/**
 * Reads one Heart Rate Measurement (Bluetooth characteristic 0x2A37).
 * The first byte's lowest bit says whether the value is 1 byte or 2 bytes long.
 */
export function parseHeartRate(value: DataView): number | undefined {
  if (value.byteLength < 2) return undefined
  const sixteenBit = (value.getUint8(0) & 0x01) === 1
  if (sixteenBit) return value.byteLength >= 3 ? value.getUint16(1, true) : undefined
  return value.getUint8(1)
}

/** A believable resting-to-active heart rate; anything else is a glitch (e.g. 0 while the strap settles). */
export const isPlausibleBpm = (bpm: number) => bpm >= 25 && bpm <= 230

export interface HeartRateSummary {
  avgBpm: number
  minBpm: number
  maxBpm: number
  /** Average of the first and last minute (or less, for short sessions). */
  startBpm: number
  endBpm: number
  /** How far heart rate fell from start to end — positive means it dropped. */
  drop: number
}

export function summariseHeartRate(samples: HrSample[]): HeartRateSummary | undefined {
  const good = samples.filter((s) => isPlausibleBpm(s.bpm))
  if (!good.length) return undefined
  const bpms = good.map((s) => s.bpm)
  const mean = (list: number[]) => Math.round(list.reduce((a, b) => a + b, 0) / list.length)
  const first = good[0].t
  const last = good[good.length - 1].t
  // Compare the first and last minute — or a quarter of the session each, if it's under 4 minutes.
  const window = Math.min(60, Math.max(1, (last - first) / 4))
  const startBpm = mean(good.filter((s) => s.t <= first + window).map((s) => s.bpm))
  const endBpm = mean(good.filter((s) => s.t >= last - window).map((s) => s.bpm))
  return {
    avgBpm: mean(bpms),
    minBpm: Math.min(...bpms),
    maxBpm: Math.max(...bpms),
    startBpm,
    endBpm,
    drop: startBpm - endBpm,
  }
}

/**
 * Keeps time using the clock rather than counting ticks, so it stays exact
 * even if the page is briefly slowed down. Pauses are not counted.
 */
export class SessionClock {
  private startedAt: number | null = null
  private banked = 0
  private now: () => number

  constructor(now: () => number = () => performance.now()) {
    this.now = now
  }

  get running() {
    return this.startedAt !== null
  }

  start() {
    if (this.startedAt === null) this.startedAt = this.now()
  }

  pause() {
    if (this.startedAt === null) return
    this.banked += this.now() - this.startedAt
    this.startedAt = null
  }

  /** Milliseconds meditated so far. */
  elapsedMs(): number {
    return this.banked + (this.startedAt === null ? 0 : this.now() - this.startedAt)
  }
}

/** "12:05" style countdown text. */
export function formatClock(totalSec: number): string {
  const s = Math.max(0, Math.ceil(totalSec))
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}
