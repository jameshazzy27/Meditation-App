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

interface Complex {            // user-editable kettlebell routine (A, B, C, D...)
  id: string; name: string;    // e.g. "A"
  movements: string[];         // e.g. ["Swing", "Goblet squat", ...]
  format: 'amrap';
  durationMin: number;         // default 20
  targetRounds?: number;       // e.g. 6
  archived: boolean;           // hide without deleting history
  createdAt: string; updatedAt: string;
}

interface KettlebellSession {
  id: string; date: string; createdAt: string; updatedAt: string;
  complexId: string;
  complexSnapshot: { name: string; movements: string[] }; // keeps history accurate if the complex is edited later
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
```

## Export format
```json
{ "app": "aura", "schemaVersion": 1, "exportedAt": "...", "data": { "runs": [], "complexes": [], "kettlebellSessions": [], "moods": [], "meditations": [] } }
```
