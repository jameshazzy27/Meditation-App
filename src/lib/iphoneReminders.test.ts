import { describe, expect, it } from 'vitest'

import { planAlarms, shortcutTimerUrl } from './iphoneReminders'

describe('iPhone reminders', () => {
  it('builds the Shortcut link with whole minutes', () => {
    expect(shortcutTimerUrl(125.4)).toBe('shortcuts://run-shortcut?name=Aura%20Fast%20Timer&input=text&text=125')
    expect(shortcutTimerUrl(0.2)).toContain('text=1')
  })

  it('works out the alarms for a plan, moving the goal alarm to the next day past midnight', () => {
    expect(planAlarms({ startTime: '20:00', goalHours: 16, days: [1, 2, 3, 4, 5] })).toEqual([
      { time: '20:00', label: 'Start your fast', days: 'Weekdays' },
      { time: '12:00', label: 'Fasting goal reached', days: 'Tue Wed Thu Fri Sat' },
    ])
    expect(planAlarms({ startTime: '08:00', goalHours: 10, days: [0, 1, 2, 3, 4, 5, 6] })).toEqual([
      { time: '08:00', label: 'Start your fast', days: 'Every day' },
      { time: '18:00', label: 'Fasting goal reached', days: 'Every day' },
    ])
    expect(planAlarms({ startTime: '19:30', goalHours: 18, days: [5, 6] })[1]).toEqual({
      time: '13:30',
      label: 'Fasting goal reached',
      days: 'Weekends',
    })
  })
})
