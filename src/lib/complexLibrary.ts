import type { Movement } from '@/data'

/**
 * Ready-made complexes you can add with a tap, from "20 Best Kettlebell
 * Complexes" (PD). They're a starting point only: adding one copies it into
 * your own complexes, where you can change anything.
 *
 * As in the source, complexes are single kettlebell, single arm (reps each
 * arm) unless marked otherwise. Chains written "A + B + C x5" are kept as one
 * line: do the whole chain that many times.
 */
export interface LibraryComplex {
  name: string
  /** Shown as a label when it isn't a single bell used one arm at a time. */
  equipment?: string
  movements: Movement[]
}

const arm = (name: string, reps: number): Movement => ({ name, reps, eachArm: true })
const both = (name: string, reps: number): Movement => ({ name, reps })

export const complexLibrary: LibraryComplex[] = [
  { name: 'PD Special', movements: [arm('Rows', 5), arm('Swings', 5), arm('Thrusters', 5)] },
  { name: 'Zeus', movements: [arm('Rows', 6), arm('Cleans', 5), arm('Single-arm front squats', 4)] },
  { name: 'Hercules', movements: [arm('Swings', 3), arm('Cleans', 3), arm('Push press', 3)] },
  { name: 'Poseidon', movements: [arm('Swings', 4), arm('High pulls', 3), arm('Snatches', 2)] },
  { name: 'Achilles', movements: [arm('Swings', 3), arm('Snatches', 3), arm('Overhead lunges', 3)] },
  {
    name: 'Sisyphus',
    equipment: '2 hands on bell',
    movements: [both('Two-hand squat cleans', 5), both('Goblet squats', 4), both('Lunges (each leg)', 3)],
  },
  {
    name: 'Gimli',
    equipment: '2 hands on bell',
    movements: [both('Swings', 5), both('Deadlift high pulls', 4), both('Goblet squats', 3)],
  },
  { name: 'Aragorn', movements: [arm('Rows', 6), arm('Cleans', 5), arm('Push press', 4)] },
  { name: 'Legolas', movements: [arm('Ballistic rows', 4), arm('Tactical cleans', 4), arm('Tactical snatches', 4)] },
  { name: 'Elrond', movements: [arm('Single-arm deadlifts', 5), arm('Cleans', 4), arm('Push press', 3)] },
  { name: 'Gandalf', movements: [arm('Swing + Tactical clean & thruster + Tactical snatch + Windmill', 2)] },
  { name: 'Leonidas', movements: [arm('Cleans', 4), arm('Push press', 3), arm('Thrusters', 2)] },
  { name: 'Codi Special', movements: [arm('Rows', 4), arm('Swings', 3), arm('Snatches', 2)] },
  { name: 'Starky Boy', movements: [arm('Row + Dead clean + Swing clean & thruster', 5)] },
  { name: 'Big Mick', movements: [arm('Rows', 3), arm('Swings', 4), arm('Snatches', 5)] },
  {
    name: 'King Kong',
    equipment: 'Double bell',
    movements: [both('Gorilla row + Gorilla row + Squat clean & thruster', 5)],
  },
  {
    name: "Devil's Tricycle",
    equipment: '2 hands on bell',
    movements: [both('Swings', 6), both('Deadlift high pulls', 6), arm('Offset squat cleans', 3)],
  },
  { name: 'DeGiuli', movements: [arm('Single-arm deadlift + Single-arm deadlift + Deadstop swing', 6)] },
  { name: 'Helldiver', equipment: '2 bells preferred', movements: [both('Swing + Snatch + Thruster', 5)] },
  {
    name: 'Worst Complex Ever',
    equipment: '2 bells',
    movements: [both('Rows', 10), both('Cleans', 10), both('Thrusters', 10)],
  },
]
