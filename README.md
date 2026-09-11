# CampusFlow

Unified Student Journey Platform (Problem Statement 4). Students, faculty, and admins share one command center for deadlines, attendance risk, notices, exams, events, and achievements.

## Run the MVP

```bash
cd campusflow
npm install
npm run dev
```

Demo accounts (password `CampusFlow!23`):

- `student@campusflow.edu` — Command Center, simulator, corrections, portfolio
- `faculty@campusflow.edu` — Attendance grid + correction queue
- `admin@campusflow.edu` — Smart notice publisher

Press **Ctrl/Cmd + K** for the command palette. No Supabase keys are required for the local demo.

## Connect Supabase

1. Create a project and paste URL + anon key into `.env` (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`).
2. Run `supabase/migrations/001_init.sql` then create the three Auth users listed in `002_seed.sql`.
3. Run `002_seed.sql`.

RLS: students read their own attendance/achievements/corrections; faculty/admin write attendance, assignments, and notices.
