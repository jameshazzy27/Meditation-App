import { describe, expect, it } from 'vitest'

import { formatClock, parseHeartRate, SessionClock, summariseHeartRate } from './meditation'

const bytes = (...b: number[]) => new DataView(new Uint8Array(b).buffer)

describe('parseHeartRate', () => {
  it('reads 8-bit and 16-bit values', () => {
    expect(parseHeartRate(bytes(0x00, 62))).toBe(62) // flags 0 → one byte
    expect(parseHeartRate(bytes(0x16, 58, 0x10, 0x03))).toBe(58) // extra flags (contact, RR) ignored
    expect(parseHeartRate(bytes(0x01, 0x2c, 0x01))).toBe(300) // 16-bit little-endian
    expect(parseHeartRate(bytes(0x00))).toBeUndefined()
  })
})

describe('summariseHeartRate', () => {
  it('works out average, range and the drop from the first to the last minute', () => {
    const samples = Array.from({ length: 601 }, (_, t) => ({ t, bpm: t < 60 ? 70 : t > 540 ? 58 : 64 }))
    expect(summariseHeartRate(samples)).toEqual({ avgBpm: 64, minBpm: 58, maxBpm: 70, startBpm: 70, endBpm: 58, drop: 12 })
  })

  it('ignores glitches and copes with no data', () => {
    expect(summariseHeartRate([])).toBeUndefined()
    expect(summariseHeartRate([{ t: 0, bpm: 0 }])).toBeUndefined()
    const s = summariseHeartRate([{ t: 0, bpm: 0 }, { t: 1, bpm: 66 }, { t: 2, bpm: 255 }, { t: 3, bpm: 60 }])
    expect(s).toMatchObject({ minBpm: 60, maxBpm: 66 })
  })
})

describe('SessionClock', () => {
  it('counts running time only', () => {
    let now = 1000
    const clock = new SessionClock(() => now)
    expect(clock.elapsedMs()).toBe(0)
    clock.start()
    now += 5000
    expect(clock.elapsedMs()).toBe(5000)
    clock.pause()
    now += 60000 // paused for a minute
    expect(clock.elapsedMs()).toBe(5000)
    clock.start()
    now += 2500
    expect(clock.elapsedMs()).toBe(7500)
    expect(clock.running).toBe(true)
  })
})

describe('formatClock', () => {
  it('shows minutes and seconds, rounding up', () => {
    expect(formatClock(600)).toBe('10:00')
    expect(formatClock(59.2)).toBe('1:00')
    expect(formatClock(0)).toBe('0:00')
    expect(formatClock(-3)).toBe('0:00')
  })
})
