import { db } from './db'
import { addDays, todayKey } from './dates'
import type { Complex, KettlebellSession, MeditationSession, MoodEntry, Run } from './types'

// A few example entries so the app has something to show before real data
// exists. They use fixed ids so "Remove sample data" can find exactly these
// and nothing else. Added once, when the database is first created.

const ids = {
  complex: 'sample-complex-a',
  runs: ['sample-run-1', 'sample-run-2'],
  kettlebellSessions: ['sample-kb-1'],
  moods: ['sample-mood-1', 'sample-mood-2', 'sample-mood-3'],
  meditations: ['sample-meditation-1'],
}

function buildSampleData() {
  const today = todayKey()
  const yesterday = addDays(today, -1)
  const twoDaysAgo = addDays(today, -2)
  const at = (date: string, time: string) => new Date(`${date}T${time}`).toISOString()
  const stamps = (date: string, time: string) => ({ createdAt: at(date, time), updatedAt: at(date, time) })

  const complex: Complex = {
    id: ids.complex,
    name: 'Sample A',
    movements: [
      { name: 'Swing', reps: 15 },
      { name: 'Clean', reps: 5, eachArm: true },
      { name: 'Press', reps: 5, eachArm: true },
      { name: 'Front squat', reps: 10 },
    ],
    format: 'amrap',
    durationMin: 20,
    targetRounds: 6,
    archived: false,
    ...stamps(twoDaysAgo, '07:00'),
  }

  const runs: Run[] = [
    {
      id: ids.runs[0],
      date: today,
      runType: 'short',
      distanceKm: 5.2,
      durationSec: 27 * 60 + 40,
      notes: 'Easy loop round the park.',
      ...stamps(today, '07:30'),
    },
    {
      id: ids.runs[1],
      date: twoDaysAgo,
      runType: 'long',
      distanceKm: 12.1,
      durationSec: 65 * 60 + 20,
      notes: 'Along the river, legs felt fresh.',
      ...stamps(twoDaysAgo, '08:15'),
    },
  ]

  const kettlebellSessions: KettlebellSession[] = [
    {
      id: ids.kettlebellSessions[0],
      date: yesterday,
      complexId: complex.id,
      complexSnapshot: { name: complex.name, movements: complex.movements },
      weightKg: 24,
      rounds: 7,
      durationMin: 20,
      notes: 'Beat the target — nearly time for a heavier bell.',
      ...stamps(yesterday, '18:00'),
    },
  ]

  const moods: MoodEntry[] = [
    { id: ids.moods[0], date: today, rating: 4, tags: ['sleep', 'exercise'], ...stamps(today, '08:10') },
    { id: ids.moods[1], date: yesterday, rating: 3, tags: ['work'], notes: 'Long day.', ...stamps(yesterday, '21:00') },
    { id: ids.moods[2], date: twoDaysAgo, rating: 5, tags: ['family'], ...stamps(twoDaysAgo, '20:30') },
  ]

  const meditations: MeditationSession[] = [
    {
      id: ids.meditations[0],
      date: today,
      durationSec: 15 * 60,
      hrSamples: [
        { t: 0, bpm: 66 },
        { t: 300, bpm: 61 },
        { t: 600, bpm: 58 },
        { t: 900, bpm: 57 },
      ],
      avgBpm: 60,
      minBpm: 57,
      maxBpm: 66,
      ...stamps(today, '06:45'),
    },
  ]

  return { complexes: [complex], runs, kettlebellSessions, moods, meditations }
}

db.on('populate', async (tx) => {
  const sample = buildSampleData()
  await Promise.all([
    tx.table('complexes').bulkAdd(sample.complexes),
    tx.table('runs').bulkAdd(sample.runs),
    tx.table('kettlebellSessions').bulkAdd(sample.kettlebellSessions),
    tx.table('moods').bulkAdd(sample.moods),
    tx.table('meditations').bulkAdd(sample.meditations),
  ])
})

export async function hasSampleData(): Promise<boolean> {
  const found = await Promise.all([
    db.complexes.get(ids.complex),
    db.runs.bulkGet(ids.runs),
    db.kettlebellSessions.bulkGet(ids.kettlebellSessions),
    db.moods.bulkGet(ids.moods),
    db.meditations.bulkGet(ids.meditations),
  ])
  return found.flat().some(Boolean)
}

/** Removes only the sample entries; anything you've logged yourself is untouched. */
export async function deleteSampleData(): Promise<void> {
  await db.transaction('rw', [db.complexes, db.runs, db.kettlebellSessions, db.moods, db.meditations], () =>
    Promise.all([
      db.complexes.delete(ids.complex),
      db.runs.bulkDelete(ids.runs),
      db.kettlebellSessions.bulkDelete(ids.kettlebellSessions),
      db.moods.bulkDelete(ids.moods),
      db.meditations.bulkDelete(ids.meditations),
    ]),
  )
}
