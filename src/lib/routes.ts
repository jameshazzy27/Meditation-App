import { todayKey } from '@/data'

/** Where to see a day: the Today tab for today, otherwise that day's page. */
export function dayPath(date: string): string {
  return date === todayKey() ? '/' : `/day/${date}`
}
