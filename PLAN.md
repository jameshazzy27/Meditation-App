# Aura — Build Plan

Work through one step at a time in Claude Code. Each step ends with a working app. Copy the **Prompt** into Claude Code, test the **Done when** checks yourself, then commit before moving on.

---

## Phase 0 — Setup

**Step 0.1 — Scaffold the project**
Prompt: *"Read CLAUDE.md. Set up a new Vite + React + TypeScript project with Tailwind and shadcn/ui. Add a simple app shell with bottom navigation for: Today, History, Log, Settings. Initialise git."*
Done when: the app opens in the browser with the nav bar working.

**Step 0.2 — Visual style**
Prompt: *"Create a calm, modern visual theme for Aura: colour palette, typography, card styles, light and dark mode. Show it on a style preview page."*
Done when: you like the look. Iterate here — it's cheap now and expensive later.

**Step 0.3 — Data layer**
Prompt: *"Set up Dexie with the data model in CLAUDE.md. Build the data layer in src/data/ with functions to create, read, update and delete each entry type, plus getEntriesForDay(date). No UI yet. Add a few sample entries I can delete later."*
Done when: sample data appears and survives a page refresh.

---

## Phase 1 — Core journal

**Step 1.1 — Kettlebell complexes manager**
Prompt: *"Build a Settings screen to create, edit and archive kettlebell complexes (name, list of movements, AMRAP duration default 20 min, optional target rounds)."*
Done when: you can add A, B and C with your real movements, then add a D.

**Step 1.2 — Log a kettlebell session**
Prompt: *"Build the kettlebell log form: choose a date (default today), pick a complex from a dropdown which then shows its movements, enter weight, rounds and notes. Save a snapshot of the complex with the session."*
Done when: logging session A pre-fills A's movements.

**Step 1.3 — Log a run**
Prompt: *"Build the run log form: date, run type dropdown (intervals / short / long), distance, time, auto-calculated pace, notes."*
Done when: pace calculates correctly as you type.

**Step 1.4 — Log mood**
Prompt: *"Build a quick mood entry: tap a 1–5 rating, pick optional tags (with ability to add custom tags), optional notes. It should take under 10 seconds to log."*

**Step 1.5 — Day view**
Prompt: *"Build the Today screen and a day detail view showing all entries for that day grouped as cards (mood, runs, kettlebell). Allow editing and deleting entries. Add previous/next day navigation."*

**Step 1.6 — History**
Prompt: *"Build the History screen: a scrollable list of days (newest first) with a compact summary of each day, plus a month calendar view with dots on days that have entries."*

**Step 1.7 — Export / import**
Prompt: *"Add Export (download a JSON backup) and Import (restore from JSON, with a confirmation and a choice to merge or replace) in Settings, using the export format in CLAUDE.md. Validate the file before importing."*
Done when: export → clear browser data → import brings everything back exactly.

**Step 1.8 — Installable & offline**
Prompt: *"Make Aura an installable PWA that works fully offline, with an app icon and name."*
Done when: you can add it to your home screen and it opens in airplane mode.

**Checkpoint:** use it for real for a week or two before starting Phase 2. Note anything annoying.

---

## Phase 2 — Charts & trends

**Step 2.1** — Kettlebell: rounds per session over time, per complex, with the target line; highlight when you're consistently beating target (time to size up the bell).
**Step 2.2** — Running: weekly distance, pace trend by run type, run count per week.
**Step 2.3** — Mood: mood over time line chart, most common tags, average mood on workout days vs rest days.
**Step 2.4** — Insights screen tying it together: streaks, weekly summary card, this week vs last week.

Prompt pattern: *"Using Recharts and the existing theme, add [chart] to a new Trends screen. Include a time range selector (4 weeks / 3 months / all)."*

---

## Phase 3 — Meditation with heart rate

**Step 3.1 — Timer**
Prompt: *"Build a meditation timer: choose a duration, start/pause/stop, gentle bell at start and end, screen stays awake. Save a MeditationSession when finished."*

**Step 3.2 — Bluetooth heart rate**
Prompt: *"Add a 'Connect heart rate monitor' button using the Web Bluetooth API and the standard Heart Rate Service (0x180D, characteristic 0x2A37). Show live BPM, handle disconnects and reconnects gracefully, and show a clear message if the browser doesn't support Web Bluetooth."*

**Step 3.3 — Live chart & session summary**
Prompt: *"During meditation, show a live heart-rate line. After the session, save the samples and show a summary: average, min, max and how much HR dropped from start to end."*

**Step 3.4** — Add meditation to the day view and the Trends screen.

⚠️ **Browser note:** Web Bluetooth works in Chrome and Edge on desktop and Android. It does **not** work in Safari or any browser on iPhone/iPad. Test this before building Phase 3 around a particular device.

---

## Later (optional)
- Supabase sync for multi-device use (swap the data layer, import the JSON backup)
- Reminders, streak nudges
- Photo attachments on entries
- Link runs to your parkrun results
