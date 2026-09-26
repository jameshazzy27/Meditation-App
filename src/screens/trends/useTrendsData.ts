import { complexes, kettlebellSessions, meditations, moods, runs, useLiveData } from '@/data'

/** Everything the Trends screen draws from, loaded once and kept up to date. */
export function useTrendsData() {
  return useLiveData(async () => {
    const [allRuns, sessions, allMoods, allMeditations, allComplexes] = await Promise.all([
      runs.list(),
      kettlebellSessions.list(),
      moods.list(),
      meditations.list(),
      complexes.list(),
    ])
    return { runs: allRuns, sessions, moods: allMoods, meditations: allMeditations, complexes: allComplexes }
  })
}

export type TrendsData = NonNullable<ReturnType<typeof useTrendsData>>
