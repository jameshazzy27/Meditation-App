import { useLiveQuery } from 'dexie-react-hooks'

/**
 * Runs a data-layer query and re-runs it automatically whenever the data it
 * read changes. Returns undefined while the first result is loading.
 *
 *   const day = useLiveData(() => getEntriesForDay(date), [date])
 */
export function useLiveData<T>(query: () => Promise<T>, deps: unknown[] = []): T | undefined {
  return useLiveQuery(query, deps)
}
