# Mira

A calm, AI-powered reflective companion for exploring **self-defined futures** through reflection, value discovery, and multiple possible pathways.

Mira never tells you what you should do. It reflects patterns, mirrors values, highlights themes, and presents unranked possibilities — supporting autonomy, competence, and relatedness (Self-Determination Theory) with a futures-thinking lens.

## Stack

| Layer | Tech |
| --- | --- |
| Frontend | Next.js (App Router), React, Tailwind CSS |
| Backend | Next.js Route Handlers |
| AI | OpenAI API (with offline reflective fallbacks) |
| Voice / Empathy | Hume AI Empathic Voice Interface (EVI) + TTS |
| Database | Supabase (Postgres) — local JSON store if unset |

## Features

1. **Reflection Session** — conversational interface seeded with:
   - What has been occupying your thoughts recently?
   - What kind of future are you hoping for?
   - What values feel most important in your life right now?
   - What uncertainty are you currently navigating?
2. **Empathic Voice (Hume)** — speak with Mira via EVI; live vocal expression scores; transcripts sync into the session; “Hear Mira” TTS on text replies.
3. **Adaptive Mirroring Engine** — recurring values, motivations, tensions, emotions + mirror summaries (no advice).
4. **Future Pathway Generator** — three unranked scenarios (title, description, values, opportunities, tradeoffs).
5. **Reflection Dashboard** — cards + charts for values, emotions, themes, pathways, and theme evolution.
6. **Session History** — revisit past reflections and watch themes change over time.

## Project structure

```
src/
  app/
    page.tsx                  # Landing
    reflect/page.tsx          # Starts a session
    session/[id]/page.tsx     # Chat + mirror + pathways
    dashboard/page.tsx
    history/page.tsx
    api/
      sessions/               # Create / list
      sessions/[id]/          # Session detail
      sessions/[id]/messages/ # Reflection turn
      sessions/[id]/mirror/   # Adaptive mirroring
      sessions/[id]/pathways/ # Future pathways
      dashboard/
  components/                 # UI
  lib/
    prompts.ts                # OpenAI prompt engineering
    mira-engine.ts            # Reflect / mirror / pathways
    db/                       # Supabase + local store
    supabase/
supabase/schema.sql           # Database schema
```

## Local setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment

| Variable | Required | Notes |
| --- | --- | --- |
| `OPENAI_API_KEY` | No* | Without it, built-in reflective/mirror/pathway fallbacks run |
| `OPENAI_MODEL` | No | Default `gpt-4o-mini` |
| `HUME_API_KEY` | For voice | From [platform.hume.ai](https://platform.hume.ai) |
| `HUME_SECRET_KEY` | For voice | Required with API key for access tokens |
| `HUME_CONFIG_ID` | No | Optional existing EVI config; otherwise Mira auto-creates one |
| `NEXT_PUBLIC_SUPABASE_URL` | No* | Without Supabase, data lives in `.data/store.json` |
| `SUPABASE_SERVICE_ROLE_KEY` | With Supabase | Used by API routes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Optional | For future client-side auth |

\*Recommended for production on Vercel.

### Hume voice setup

1. Create an account at [platform.hume.ai](https://platform.hume.ai).
2. Copy **API key** and **Secret key** into `.env.local`.
3. Restart `npm run dev`.
4. Open a reflection → switch to **Voice · Empathy** → **Start voice session**.

Note: Hume is sunsetting EVI/TTS access on Nov 13, 2026 — export configs before then if needed.

### Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. SQL Editor → paste and run the full `supabase/schema.sql` (creates `mira_*` tables so it won’t clash with a starter `profiles` table).
3. Project Settings → API → copy URL + **secret** / service role key into `.env.local` (no spaces after `=`).
4. Restart `npm run dev`.

## Design principles (AI)

Prompt engineering lives in `src/lib/prompts.ts`:

- **Non-prescriptive** — forbids “you should”, “I recommend”, ranked “best” futures
- **Human-centered** — companion, not coach
- **SDT** — autonomy, competence, relatedness
- **Futures thinking** — multiple equal possibilities

## Deploy on Vercel

1. Push this repo to GitHub.
2. [vercel.com/new](https://vercel.com/new) → import the repo.
3. Add environment variables:
   - `OPENAI_API_KEY`
   - `OPENAI_MODEL` (optional)
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
4. Deploy. Vercel detects Next.js automatically.
5. Run `supabase/schema.sql` on your Supabase project before first use.

**Important:** Do not rely on the local `.data/` store in production — use Supabase.

### CLI alternative

```bash
npm i -g vercel
vercel
vercel env add OPENAI_API_KEY
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel --prod
```

## Scripts

```bash
npm run dev      # development
npm run build    # production build
npm run start    # serve build
npm run lint     # eslint
```

## Safety note

Mira is not therapy or a crisis service. If someone is in danger, seek immediate local help (US: call or text **988**).
