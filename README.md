# ScrimLock

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
pages render, but the Google/Discord buttons show a "not connected" message
instead of crashing.

Sign-in is **Google and Discord only** — no email/password, so there's no
password-reset flow to build or run. Each needs an OAuth app registered with
the provider, since Supabase can't create those on your behalf.

### Enabling "Continue with Google"

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

### Enabling "Continue with Discord"

1. In the [Discord Developer Portal](https://discord.com/developers/applications),
   create a new application → **OAuth2** tab.
2. Add a **Redirect**: `https://<your-project-ref>.supabase.co/auth/v1/callback`
   (same URL shape as Google's, shown again under Supabase's **Authentication
   → Providers → Discord**).
3. Copy the **Client ID** and (under **Reset Secret**) the **Client Secret**.
4. In the Supabase dashboard, go to **Authentication → Providers → Discord**,
   enable it, and paste in the Client ID/Secret. Save.

### One more step for both

In **Authentication → URL Configuration**, make sure your site URL (and
`http://localhost:3000` for local dev) is in the allowed redirect URLs — the
app redirects back to `/auth/callback` after the provider hands control back
to Supabase.

No app code changes needed beyond that — `signInWithOAuthAction` (in
`src/lib/actions/auth.ts`) and the `/auth/callback` route already handle
both providers.

## Project structure

- `src/app/` — routes (App Router)
- `src/components/site/` — themed layout chrome (nav, footer, deco motifs)
- `src/components/ui/` — shadcn/ui primitives
- `src/lib/supabase/` — browser/server Supabase clients + generated DB types
- `src/lib/actions/` — Server Actions (mutations), validated with Zod
- `src/lib/validations/` — Zod schemas shared by forms and Server Actions
- `supabase/migrations/` — SQL migrations, one per feature area

## Build phases

Phases 1–6 of the original build plan are done: foundation, auth +
profiles, teams, LFT, scrims, and tournaments, plus an admin panel for the
hero roster. Now expanding into the ScrimLock-specific feature set: Google/
Discord-only auth, richer profiles (social links, friends), team invites,
on-site messaging, and PUG scrims (party queue, ELO, lobby handoff, result
voting).
