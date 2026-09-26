import { describe, expect, it } from 'vitest'

import { formatDuration, formatPace, joinMeta } from './format'

describe('format', () => {
  it('formats durations', () => {
    expect(formatDuration(0)).toBe('0:00')
    expect(formatDuration(27 * 60 + 40)).toBe('27:40')
    expect(formatDuration(65 * 60 + 20)).toBe('1:05:20')
  })

  it('formats pace per km', () => {
    expect(formatPace(5, 25 * 60)).toBe('5:00/km')
    expect(formatPace(12.1, 65 * 60 + 20)).toBe('5:24/km')
    expect(formatPace(0, 100)).toBeUndefined()
    expect(formatPace(5, undefined)).toBeUndefined()
  })

  it('joins only the parts that exist', () => {
    expect(joinMeta('a', undefined, false, 'b')).toBe('a · b')
  })
})
