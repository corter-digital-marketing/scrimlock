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

Until `.env.local` has real values, the app runs fine but auth is a no-op:
pages render, but sign up / sign in / Google buttons show a "not connected"
message instead of crashing.

### Enabling email sign-up

Works as soon as the three env vars above are set — Supabase's email/password
auth needs no extra configuration. By default a new Supabase project
requires the user to click a confirmation link before their first sign-in;
you'll see that reflected in the signup form's response. (Toggle it off
under **Authentication → Providers → Email → Confirm email**, if you'd
rather they land in the app immediately — fine for local testing, not for
production.)

### Enabling "Continue with Google"

This one needs a Google Cloud OAuth client, since Supabase can't create
that on your behalf:

1. In [Google Cloud Console](https://console.cloud.google.com/apis/credentials),
   create (or reuse) a project, then **Create Credentials → OAuth client
   ID** → Application type **Web application**.
2. Add an **Authorized redirect URI**:
   `https://<your-project-ref>.supabase.co/auth/v1/callback`
   (find the exact URL in Supabase under **Authentication → Providers →
   Google** — it's shown there too).
3. Copy the generated **Client ID** and **Client Secret**.
4. In the Supabase dashboard, go to **Authentication → Providers → Google**,
   enable it, and paste in the Client ID/Secret. Save.
5. In **Authentication → URL Configuration**, make sure your site URL (and
   `http://localhost:3000` for local dev) is in the allowed redirect URLs —
   the app redirects back to `/auth/callback` after Google hands control
   back to Supabase.

No app code changes needed beyond that — `signInWithGoogleAction` (in
`src/lib/actions/auth.ts`) and the `/auth/callback` route already handle the
rest of the flow.

## Project structure

- `src/app/` — routes (App Router)
- `src/components/site/` — themed layout chrome (nav, footer, deco motifs)
- `src/components/ui/` — shadcn/ui primitives
- `src/lib/supabase/` — browser/server Supabase clients + generated DB types
- `src/lib/actions/` — Server Actions (mutations), validated with Zod
- `src/lib/validations/` — Zod schemas shared by forms and Server Actions
- `supabase/migrations/` — SQL migrations, one per feature area

## Build phases

This is being built incrementally — see the build plan for the full phase
list. Current status: **Phase 1 — Foundation** done; **Phase 2 — Auth** in
progress (email/password + Google sign-up and sign-in, auto-created
profiles, session refresh via `src/proxy.ts`). Profile editing, teams,
scrims, and tournaments are still ahead.
