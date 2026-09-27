import { describe, expect, it } from 'vitest'

import { backupReminderDue } from './backupFile'

const now = Date.parse('2026-09-27T12:00:00Z')
const daysAgo = (d: number) => new Date(now - d * 86400000).toISOString()

describe('backupReminderDue', () => {
  it('nudges when there has never been a backup, or it was 14+ days ago', () => {
    expect(backupReminderDue(null, null, now)).toBe(true)
    expect(backupReminderDue(daysAgo(15), null, now)).toBe(true)
    expect(backupReminderDue(daysAgo(3), null, now)).toBe(false)
  })

  it('stays quiet for 3 days after "Later"', () => {
    expect(backupReminderDue(null, daysAgo(1), now)).toBe(false)
    expect(backupReminderDue(null, daysAgo(4), now)).toBe(true)
  })
})
