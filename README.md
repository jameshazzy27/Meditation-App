# Aura

A personal, offline-first journal for runs, kettlebell workouts, mood and (later) meditation.
See `CLAUDE.md` for the project rules and `PLAN.md` for the build plan.

## Use it

**https://jameshazzy27.github.io/Meditation-App/** — open it on your phone, then add it to your
home screen (iPhone: Safari → Share → Add to Home Screen; Android: Chrome menu → Install app).
It works offline, and everything is saved on the phone only — use **Settings → Backup → Export**
now and then.

Every push is checked (lint + tests), built and published by `.github/workflows/deploy.yml`.

## Run it on a computer

```bash
npm install
npm run dev     # open the URL it prints (usually http://localhost:5173)
```

Other commands: `npm test` (automated checks), `npm run build` (production build), `npm run lint`.
