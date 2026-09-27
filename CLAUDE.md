# Aura — Project Context for Claude Code

Aura is a personal, offline-first journal web app for one user (Hazzy). It logs runs, kettlebell workouts and mood, shows trends over time, and later adds a meditation timer with live Bluetooth heart rate.

The owner is not a developer. Explain decisions in plain English, keep changes small, and always leave the app in a working state at the end of each task.

## Tech stack
- **Vite + React + TypeScript** — app framework
- **Tailwind CSS + shadcn/ui** — styling and components (the app must look polished and visual, not like a default form)
- **Dexie.js** (wrapper around IndexedDB) — all data stored locally in the browser
- **Recharts** — charts and trends (Phase 2)
- **vite-plugin-pwa** — installable, works offline
- **Web Bluetooth API** — heart rate (Phase 3)

No backend, no login, no server. Everything saves automatically on-device.

## Core rules
1. **Local-first.** All reads/writes go through a single data layer (`src/data/`). UI components never touch Dexie directly. This keeps a future move to Supabase to a single swap.
2. **Every record** has: `id` (UUID), `date` (`YYYY-MM-DD`, the day it belongs to), `createdAt`, `updatedAt` (ISO timestamps).
3. **Days are the organising unit.** Every entry belongs to a date; the main view groups entries by day.
4. **Structured fields + free-text notes** on every entry type.
5. **Nothing hardcoded that the user may want to change** (e.g. kettlebell complexes live in the database, not in code).
6. **Export/import** must always round-trip every table without data loss. Bump `schemaVersion` whenever the data model changes and write a migration.
7. Mobile-friendly layout first; it will mostly be used on a phone.
8. After each task: run the app, check it works, and summarise what changed in plain English.

## Data model
```ts
type RunType = 'intervals' | 'short' | 'long';

interface Run {
  id: string; date: string; createdAt: string; updatedAt: string;
  runType: RunType;
  distanceKm?: number;
  durationSec?: number;
  // pace is calculated from distance + duration, not stored
  notes?: string;
}

interface Movement {            // e.g. "Renegade rows × 6 each arm"
  name: string;
  reps?: number;
  eachArm?: boolean;           // reps are done on each arm
}

interface Complex {            // user-editable kettlebell routine (A, B, C, D...)
  id: string; name: string;    // e.g. "A"
  movements: Movement[];
  format: 'amrap';
  durationMin: number;         // default 20
  targetRounds?: number;       // e.g. 6
  archived: boolean;           // hide without deleting history
  createdAt: string; updatedAt: string;
}

interface KettlebellSession {
  id: string; date: string; createdAt: string; updatedAt: string;
  complexId: string;
  complexSnapshot: { name: string; movements: Movement[] }; // keeps history accurate if the complex is edited later
  weightKg?: number;
  rounds?: number;
  durationMin?: number;
  notes?: string;
}

interface MoodEntry {
  id: string; date: string; createdAt: string; updatedAt: string;
  rating: 1 | 2 | 3 | 4 | 5;
  tags: string[];              // e.g. ["sleep", "work", "exercise"]
  notes?: string;
}

interface MeditationSession {   // Phase 3
  id: string; date: string; createdAt: string; updatedAt: string;
  durationSec: number;
  hrSamples: { t: number; bpm: number }[]; // t = seconds since start
  avgBpm?: number; minBpm?: number; maxBpm?: number;
  deviceName?: string;
  notes?: string;
}

interface FastSession {        // date = the day the fast ended (or began, while still running)
  id: string; date: string; createdAt: string; updatedAt: string;
  startedAt: string;           // ISO time
  endedAt?: string;            // ISO time; missing while fasting (at most one such fast)
  goalHours: number;
  notes?: string;
}

interface FastingPlan {        // single record, id "plan" — used for calendar reminders
  id: string; createdAt: string; updatedAt: string;
  goalHours: number;
  startTime: string;           // "HH:MM", e.g. "20:00"
  days: number[];              // 0 = Sunday … 6 = Saturday
}
```

## Schema versions
- **1** — first version.
- **2** — movements changed from text (`"Swing × 20"`) to `{ name, reps, eachArm }`. Old databases and v1 backup files are upgraded automatically (`src/data/db.ts`, `src/data/backup.ts`).
- **3** — added `fasts` and `fastingPlans` tables. No data changes; older backups simply have no fasting data.

## Fasting stages & notifications
- Body-state stages live in `src/lib/fasting.ts` with their sources and an evidence level. Keep claims to what the research supports (e.g. autophagy timing in humans is not established) and keep the "not medical advice" note.
- There is no server, so notifications only fire while Aura is open (`src/lib/fastAlerts.ts`). Alerts when it's closed come from calendar (.ics) reminders.

## Export format
```json
{ "app": "aura", "schemaVersion": 3, "exportedAt": "...", "data": { "runs": [], "complexes": [], "kettlebellSessions": [], "moods": [], "meditations": [], "fasts": [], "fastingPlans": [] } }
```
