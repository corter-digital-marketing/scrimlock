# Deadlock Esports

A competitive-scene platform for Valve's Deadlock — tournaments, scrims, and
LFT (looking for team), styled after a 1940s occult-era New York.

Built with Next.js (App Router) + TypeScript, Tailwind CSS + shadcn/ui, and
Supabase (Postgres, Auth, RLS, Storage).

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Supabase setup

The app talks to Supabase via `@supabase/ssr` (`src/lib/supabase/`). To run
it against a real backend:

1. Create a project at [supabase.com](https://supabase.com) (or run one
   locally with `npx supabase start`, which needs Docker Desktop).
2. Copy `.env.local.example` to `.env.local` and fill in the three values
   from **Project Settings → API**:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (server-only — never expose to the client)
3. Apply the migrations in `supabase/migrations/`:
   ```bash
   npx supabase link --project-ref <your-project-ref>
   npx supabase db push
   ```
   (Or, for local dev: `npx supabase start` picks up migrations
   automatically.)

Every table ships with Row-Level Security enabled from its very first
migration — the anon key is public, so access control lives in Postgres
policies, not just the UI.

## Project structure

- `src/app/` — routes (App Router)
- `src/components/site/` — themed layout chrome (nav, footer, deco motifs)
- `src/components/ui/` — shadcn/ui primitives
- `src/lib/supabase/` — browser/server Supabase clients + generated DB types
- `supabase/migrations/` — SQL migrations, one per feature area

## Build phases

This is being built incrementally — see the build plan for the full phase
list. Current status: **Phase 1 — Foundation** (scaffold, theme, Supabase
wiring, `ranks`/`heroes` reference tables, themed nav with placeholder tabs).
