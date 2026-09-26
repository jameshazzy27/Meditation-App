import { describe, expect, it } from 'vitest'

import { addMonths, monthGrid } from './calendar'

describe('calendar', () => {
  it('lays out a month Monday-first', () => {
    // September 2026 starts on a Tuesday and has 30 days.
    const weeks = monthGrid('2026-09')
    expect(weeks[0]).toEqual([null, '2026-09-01', '2026-09-02', '2026-09-03', '2026-09-04', '2026-09-05', '2026-09-06'])
    expect(weeks.flat().filter(Boolean)).toHaveLength(30)
    expect(weeks.every((w) => w.length === 7)).toBe(true)
    expect(weeks.at(-1)?.at(-1)).toBeNull()
  })

  it('moves between months across years', () => {
    expect(addMonths('2026-01', -1)).toBe('2025-12')
    expect(addMonths('2026-12', 1)).toBe('2027-01')
  })
})
