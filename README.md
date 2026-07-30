# Nexus

A blog built with [Payload CMS](https://payloadcms.com) and [Next.js](https://nextjs.org). Fully self-editable from the admin panel — site name, logo, and brand color are all configurable without touching code, making this easy to re-skin or hand off to a new owner.

## Features

- Page builder (hero, content, call-to-action, media, form blocks) editable from the admin panel
- Posts with categories, a **reader/author/reviewer/admin** role system, reviewer sign-off, and SEO fields
- Unified sign-in — anyone can self-register (as a reader), only an admin can promote someone to author/reviewer/admin
- **SEO Research Agent** — trigger it manually, or define keyword rules that run automatically on a schedule (`[month]`/`[year]`-style templated keywords supported); every run always lands as a draft for human review, never auto-published
- Contact/newsletter forms — submissions land in the admin's Form Submissions collection and in an in-app **Messages** page for admins
- Site-wide **Settings** global — site name, logo, favicon, brand color, fonts, corner radius, density, animations, analytics, and social links, all from one place, no code changes required
- Light/dark mode for both the public site and the admin panel
- Search, redirects, drafts, and live preview

## Requirements

- **Node.js** `^18.20.2` or `>=20.9.0`
- **npm** (or pnpm `^9`/`^10`/`^11` — this repo has been run with both; `package-lock.json` and `pnpm-lock.yaml` may both be present)
- **A PostgreSQL database.** This project runs on Postgres via `@payloadcms/db-postgres` — [Supabase](https://supabase.com) (free tier is enough to start) is the easiest option and what this project is currently configured against, but any Postgres instance works.
- **A [Resend](https://resend.com) account** (free tier) if you want the app to actually send email (password resets, account verification). Without it, the app still runs fine, but any email it tries to send just gets printed to the server console instead of delivered.
- Optional, per-user (not global — each staff member sets their own on their `/dashboard/profile` page): a [SerpApi](https://serpapi.com) key and an API key for one AI provider (Anthropic, OpenAI, or Google), needed only to use the SEO Research Agent.

## Getting started

### 1. Install dependencies

```bash
npm install
```

### 2. Set up environment variables

```bash
cp .env.example .env
```

Then edit `.env`:

| Variable | Required | Notes |
| --- | --- | --- |
| `DATABASE_URL` | Yes | Postgres connection string. For Supabase, use the **session pooler** connection (port `5432`), not the transaction pooler (port `6543`) — see [Database](#database-postgres--supabase) below for why. |
| `PAYLOAD_SECRET` | Yes | Long, random string used to sign auth tokens. Generate one with `openssl rand -base64 32` or similar. |
| `NEXT_PUBLIC_SERVER_URL` | Yes | The site's own public URL (e.g. `http://localhost:3000` locally, `https://yourdomain.com` in production). Used for CORS, absolute links in emails, and OG/sitemap URLs. |
| `CRON_SECRET` | Yes | Bearer-token secret that lets external cron services (or Vercel Cron) trigger scheduled jobs — RSS content-source syncing (`/api/sync-content-sources`) and forcing an SEO-rule check (`/api/seo-research/run-due`). Any long random string. |
| `PREVIEW_SECRET` | Yes | Used to validate Payload's live-preview/draft-mode requests. Any long random string. |
| `RESEND_API_KEY` | Recommended | Your Resend API key. Without it, transactional email (password reset, account verification) silently fails to deliver — see [Email](#email-resend) below. |
| _(no SerpApi/AI-provider env var)_ | — | Not configured via `.env` — each staff member sets their own SerpApi key and AI provider key on their `/dashboard/profile` page instead. `.env.example` has a comment explaining this, not an actual variable. |

Optional model overrides (only relevant if you use the SEO Research Agent):

```bash
ANTHROPIC_MODEL=claude-sonnet-5
OPENAI_MODEL=gpt-4o
GOOGLE_MODEL=gemini-flash-latest
```

### 3. Run the database migrations

See [Database migrations](#database-migrations) below — required before first run, and after pulling any change that touches a collection/global schema.

### 4. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) for the site, and [http://localhost:3000/admin](http://localhost:3000/admin) for the admin panel. On first run you'll be prompted to create an admin account — the very first account created always becomes an admin regardless of the normal reader-by-default signup rule.

### 5. Load the real site content

Migrations only create the database **schema** (tables/columns) — they don't add any content. A freshly migrated database has no pages, no posts, and no header/footer nav items, so the site will look bare (just the search icon, theme toggle, and sign-in button) until something populates it. The database itself is git-ignored on purpose — it holds real user accounts, password hashes, and per-user API keys, so it's never committed.

To get the actual site content — the real pages, published posts, categories, forms, header/footer nav, and the images they use — run:

```bash
npm run seed:content
```

This reads the non-sensitive content bundle committed at [`content-seed/`](content-seed/) and imports it into your database. It's safe to run more than once: everything is upserted by slug/filename, and it will never overwrite your header/footer nav if you've already customized it. **Nothing sensitive is in this bundle or this command** — no user accounts, no passwords, no `aiApiKey`/`serpApiKey`, no draft posts, no contact-form submissions. The imported posts are attributed to a placeholder "Site Editor" account created automatically the first time you run it, not to any real person.

To refresh `content-seed/` from the live database after editing content in `/admin` (e.g. before committing changes for others to pull), run:

```bash
node --import tsx/esm scripts/content-seed/export.mjs
```

Alternatively, the stock Payload **"Seed your database"** button on the `/admin` dashboard creates generic placeholder pages/posts instead — useful for exploring the template from scratch, but it does not use your real content and (unlike `seed:content`) it deletes existing pages/posts first.

## Database (Postgres / Supabase)

This project uses Postgres, not SQLite. If you're using Supabase specifically, there's one non-obvious gotcha worth knowing:

Supabase gives you two different pooled connection strings:

- **Transaction pooler (port `6543`)** — meant for many short-lived serverless connections. It does **not** support prepared statements or advisory locks, both of which Payload's migration runner needs. Using this for `DATABASE_URL` will make `payload migrate` hang or fail unpredictably.
- **Session pooler (port `5432`)** — behaves like a normal long-lived Postgres connection. **Use this one** for `DATABASE_URL`.

Also make sure your connection string includes SSL — this project's `payload.config.ts` already passes `ssl: { rejectUnauthorized: false }` to the Postgres adapter, so you don't need `?sslmode=require` in the URL itself, but the app will hang on connect without SSL enabled on the adapter side if you copy this config elsewhere.

## Database migrations

Schema changes (adding a field, a collection, etc.) are captured as migration files in `src/migrations/`, generated and applied via Payload's CLI.

**Apply all pending migrations** (run this after cloning, after pulling new commits, and before first `npm run dev`/deploy):

```bash
npm run payload migrate
```

**Create a new migration** after changing a collection/global config (field, access rule, new collection, etc.):

```bash
npm run payload migrate:create <a-short-name-for-the-change>
```

This diffs the current database schema against your Payload config and writes a new `src/migrations/<timestamp>_<name>.ts` file with `up()`/`down()` SQL. Review the generated SQL before applying it — it's usually right, but worth a glance, especially for destructive changes (dropped columns/tables).

**Check migration status:**

```bash
npm run payload migrate:status
```

**Roll back the most recent migration:**

```bash
npm run payload migrate:down
```

### Troubleshooting: `payload migrate` hangs or never completes

If the CLI appears to hang indefinitely (no output, no error, just sits there), this has been observed in sandboxed/restricted network environments — the CLI's own telemetry phone-home call can block before it ever gets to the actual migration. Two ways around it:

1. Retry a few times — it's sometimes transient.
2. Apply the migration's SQL directly: open the generated `src/migrations/<file>.ts`, copy the SQL inside the `up()` function's ``` sql`...` ``` block, and run it against your database with any Postgres client (`psql`, a one-off Node script with the `pg` package, Supabase's SQL editor, etc.). Run each top-level statement individually if you hit `ALTER TYPE ... ADD VALUE cannot run inside a transaction block` — that specific statement type can't be batched with others in one transaction.

Either way, once the SQL is applied, the migration is done — there's no separate "mark as applied" step beyond the SQL itself (Payload tracks applied migrations in its own `payload_migrations` table, which the generated SQL/CLI already updates as part of running it normally; if you apply SQL manually you generally don't need to touch that table yourself for schema-only changes).

## Email (Resend)

Password reset and account verification emails go through [Resend](https://resend.com):

1. Create a free Resend account and generate an API key.
2. Set `RESEND_API_KEY` in `.env` (or your hosting provider's environment variables).
3. By default this project sends from `onboarding@resend.dev` — Resend's shared sandbox address. It works immediately with no setup, **but can only deliver to the email address you signed up to Resend with.** Fine for development; not fine for real users.
4. For production, verify your own domain in Resend (Resend walks you through adding a few DNS records), then update the `defaultFromAddress`/`defaultFromName` passed to `resendAdapter(...)` in `src/payload.config.ts` to use your verified domain.

Without a configured `RESEND_API_KEY` at all, the app still runs — Payload just logs `No email adapter provided` and prints emails to the console instead of sending them, so password reset/signup verification links become unusable for real users (fine for local dev, not for production).

## Customizing branding

Log into the admin panel and go to **Settings** (under the "Site" group in the sidebar): site name, logo, favicon, brand color, fonts, corner radius, density, animations, default OG image, copyright text, and social links are all editable there and apply across the whole site — including the favicon, the auth pages (login/signup/reset/verify), and transactional emails. The admin panel's own browser tab title/icon is a static build-time default and does not update from Settings.

### Syncing branding from a main website

If this blog runs as a subdomain of a main website (e.g. `blog.example.com` under `example.com`), set **Brand Sync URL** in Settings to that main site, and it'll pick up the name/color/logo automatically — no manual re-entry needed. It's checked roughly every 5 minutes, and any field found remotely overrides the manual Settings values above.

Two ways to point it:

1. **A dedicated JSON file** (most reliable) — e.g. `https://example.com/brand.json`:
   ```json
   {
     "siteName": "Example Inc",
     "primaryColor": "#2563eb",
     "logoUrl": "https://example.com/logo.svg"
   }
   ```
   All fields are optional; only the ones present are applied.

2. **Just the main site's homepage URL** — if no JSON is found there, the blog automatically falls back to reading standard meta tags: `og:site_name` (or `<title>`) for the name, `theme-color` for the color, and the favicon/apple-touch-icon for the logo. Works with zero changes to the main site, though fidelity depends on what that site already publishes.

If the sync URL is unreachable or returns nothing usable, the blog silently falls back to the manual Settings values — it never breaks the site.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the local dev server |
| `npm run build` | Build for production |
| `npm run start` | Run the production build |
| `npm run lint` | Lint the codebase |
| `npm run generate:types` | Regenerate TypeScript types from the Payload config |
| `npm run payload migrate` | Apply all pending database migrations |
| `npm run payload migrate:create <name>` | Generate a new migration from the current config/schema diff |
| `npm run payload migrate:status` | List applied/pending migrations |
| `npm test` | Run integration and e2e tests |

## Project structure

- `src/collections` — Pages, Posts, Media, Users (reader/author/reviewer/admin), Categories, Tags, Reviews, ContentSources, SeoResearchRuns, SeoResearchRules
- `src/Header`, `src/Footer`, `src/Settings` — site-wide globals
- `src/blocks` — page builder blocks (hero, content, CTA, form, media, archive)
- `src/heros` — hero section variants
- `src/app/(frontend)` — the public-facing site, including `/dashboard` (staff area) and the auth pages
- `src/app/(payload)` — the admin panel
- `src/migrations` — database migrations (see [Database migrations](#database-migrations))
- `src/utilities/seoResearch` — the SEO Research Agent's pipeline (SerpApi lookup, AI competitor analysis/strategy/writing, keyword-template resolution, the automatic scheduler)

## Deployment

This is a standard Next.js app and can be deployed anywhere Next.js is supported — Vercel, a Node server, or Docker (see `Dockerfile` and `docker-compose.yml`). One important distinction between them:

### Vercel (serverless)

1. Push the repo to GitHub/GitLab/Bitbucket and import it into Vercel.
2. Set every environment variable from the table in [Getting started](#2-set-up-environment-variables) in the Vercel project's Environment Variables settings — `DATABASE_URL`, `PAYLOAD_SECRET`, `NEXT_PUBLIC_SERVER_URL` (your production domain), `CRON_SECRET`, `PREVIEW_SECRET`, and `RESEND_API_KEY`.
3. Run `npm run payload migrate` against the production database **before** the first deploy goes live (from your local machine with `DATABASE_URL` pointed at production, or via a one-off Vercel deploy hook/CI step) — Vercel's build step does not run migrations for you.
4. **The SEO Research Agent's automatic scheduler will not run on Vercel.** It's implemented as an in-process `setInterval` (see `src/utilities/seoResearch/scheduler.ts`), which only works on a long-lived server process — serverless functions like Vercel's spin up per-request and don't stay running in the background. On Vercel, wire up [Vercel Cron](https://vercel.com/docs/cron-jobs) (or any external cron service) to `POST /api/seo-research/run-due` with an `Authorization: Bearer <CRON_SECRET>` header instead, on whatever schedule you want it checked (e.g. hourly). Do the same for `POST /api/sync-content-sources` if you use RSS content sources with auto-sync.

### Docker / a long-lived Node server

Everything above applies except step 4 — the in-process scheduler works as-is on a normal server (`npm run start`, Docker, etc.) since the process stays running. You can still additionally wire up external cron to the same endpoints if you'd rather not rely on the in-process timer, but it isn't required there.

## Built on

This project started from the official [Payload Website Template](https://github.com/payloadcms/payload/tree/3.x/templates/website).
