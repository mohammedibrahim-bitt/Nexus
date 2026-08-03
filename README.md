# Nexus

A multi-tenant blog/news platform built with [Payload CMS](https://payloadcms.com) and [Next.js](https://nextjs.org). Each tenant is an independent site on its own subdomain, with fully isolated content, media, and branding — self-editable from the admin panel, no code changes required to re-skin or onboard a new client.

On top of that, a tenant's site can either use Nexus's own templates (branded via colors/logo/fonts pulled from the client's real site), **or** be a full pixel-level clone of the client's existing homepage, with the Nexus blog mounted at `/blog` inside it. Both modes are covered below.

If you're picking this project up for the first time, read this whole file before touching code — the multi-tenancy and clone-pipeline sections cover non-obvious architecture decisions and a few sharp edges that cost real debugging time to find.

## Features

- **Multi-tenant**: each tenant gets its own subdomain, isolated Posts/Pages/Media/Categories/Tags/Reviews/content sources, and its own branding — one Payload instance and one database serve every tenant
- **Optional full-site clone**: given a client's URL and DNS proof of ownership, scrape their homepage, store a rewritten self-contained copy, and serve it as that tenant's shell with `/blog` mounted inside — gated behind a quality check and manual admin approval, never auto-published
- Page builder (hero, content, call-to-action, media, form blocks) editable from the admin panel
- Posts with categories, a **reader/author/reviewer/admin** role system, reviewer sign-off, and SEO fields
- Unified sign-in — anyone can self-register (as a reader), only an admin can promote someone to author/reviewer/admin
- **SEO Research Agent** — trigger it manually, or define keyword rules that run automatically on a schedule (`[month]`/`[year]`-style templated keywords supported), scoped per tenant with a per-tenant daily run cap; every run always lands as a draft for human review, never auto-published
- Contact/newsletter forms — submissions land in the admin's Form Submissions collection and in an in-app **Messages** page for admins
- Per-tenant **Settings**, **Header**, and **Footer** — site name, logo, favicon, brand color, fonts, corner radius, density, animations, analytics, social links, and navigation, all from one place, no code changes required
- Light/dark mode for both the public site and the admin panel
- Search, redirects, drafts, and live preview

## Requirements

- **Node.js** `^18.20.2` or `>=20.9.0`
- **npm** (or pnpm `^9`/`^10`/`^11` — this repo has been run with both; `package-lock.json` and `pnpm-lock.yaml` may both be present)
- **A PostgreSQL database.** This project runs on Postgres via `@payloadcms/db-postgres` — [Supabase](https://supabase.com) (free tier is enough to start) is the easiest option and what this project is currently configured against, but any Postgres instance works.
- **A [Resend](https://resend.com) account** (free tier) if you want the app to actually send email (password resets, account verification). See [Email](#email-resend) below — there's a dev-only bypass so local signup works without this.
- **Supabase Storage** (or another object store — see [Full-site clone pipeline](#full-site-clone-pipeline)), only if you're using the clone feature. Not needed to run the app otherwise.
- **A Playwright Chromium binary**, only for the clone feature (headless scrape + screenshot). See the [version-pinning warning](#playwrights-browser-version-is-pinned--do-not-bump-it-carelessly) below before touching this.
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
| `RESEND_API_KEY` | Recommended | Your Resend API key. Without a **verified domain** on the Resend side, transactional email can only be delivered to your own Resend account address — see [Email](#email-resend). |
| `SUPABASE_URL` | Only for cloning | Your Supabase project's **Storage** API URL — `https://<project-ref>.supabase.co`. This is **not** the Postgres connection string; it's a different service on a different URL, even though it's the same Supabase project. |
| `SUPABASE_SERVICE_ROLE_KEY` | Only for cloning | Supabase dashboard → Project Settings → API → `service_role` secret. Bypasses Row Level Security and has full project access. Server-side only — never prefix an env var like this with `NEXT_PUBLIC_`, or Next.js bundles it into client JS and ships it to every visitor. |
| `SUPABASE_STORAGE_BUCKET` | Only for cloning | Bucket name for cloned tenant assets. Defaults to `tenant-assets` if unset. Should be a **public** bucket — see [why](#why-the-storage-bucket-is-public-not-private) below. |
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

Open [http://localhost:3000](http://localhost:3000) for the default tenant's site, and [http://localhost:3000/admin](http://localhost:3000/admin) for the admin panel. On first run you'll be prompted to create an admin account — the very first account created always becomes an admin regardless of the normal reader-by-default signup rule.

To see a *different* tenant locally, see [Local subdomain testing](#local-subdomain-testing) below — you do not need to edit `/etc/hosts` or anything system-level.

## Multi-tenancy

This is the part of the architecture most likely to surprise someone new to the repo, so read this section before making changes to any collection, global, or frontend data-fetching code.

### How a tenant is resolved

`src/middleware.ts` reads the request's `Host` header and rewrites `{tenant}.{domain}/path` → `/[tenantDomain]/path`, mapping onto the `[tenantDomain]` dynamic segment under `src/app/(frontend)/`. `/admin`, `/api`, static assets, and a couple of infrastructure routes are excluded from this rewrite. A host with no recognizable tenant label (bare `localhost`, the production apex domain) falls back to the **default tenant** (`slug: 'default'`).

The middleware does **not** validate that the tenant actually exists — it just does the string rewrite. An unknown subdomain resolves to a route that then 404s for real, via `requireTenant()` (see below), rather than the middleware doing a database lookup on every request.

### Resolving a tenant inside a page/route

- **Inside `[tenantDomain]/...`**: the tenant slug is already a route param. Call `requireTenant(tenantDomain)` from `src/utilities/getTenant.ts` — it resolves the slug to the tenant doc, or calls `notFound()` if it doesn't exist. This is the actual enforcement point for unknown subdomains.
- **Outside `[tenantDomain]`** (the root layout, `<BrandColor>`, `<Analytics>`, the OG image route, etc.) — there's no route param, so use `getRequestTenant()` instead, which reads the `Host` header directly via `next/headers`.
- **In a Route Handler that already has the request object** (e.g. `og/route.tsx`), read `req.headers.get('host')` and call `resolveTenant(host)` directly rather than going through `next/headers`.

**This mattered in practice**: early in this project's multi-tenant conversion, several files outside `[tenantDomain]` (`BrandColor`, the root layout's `generateMetadata`, `generateMeta()` itself, the OG route, `Analytics`, and all six auth pages) were still calling `getBrandData()` with no tenant argument, silently defaulting to the default tenant's branding regardless of which subdomain was actually being viewed — colors, fonts, corner radius, and page titles were all wrong for every non-default tenant. If you add a new file that reads branding or tenant-specific data, make sure it resolves its own tenant; don't assume it's inherited from somewhere else.

### Filtering a query by tenant

Use `tenantWhere(tenant.id)` from `src/utilities/tenantWhere.ts`:

```ts
where: { and: [tenantWhere(tenant.id), { _status: { equals: 'published' } }] }
```

**Filter on `tenant.id`, not `tenant.slug`.** Payload rejects a relationship-subfield filter like `{ 'tenant.slug': { equals: tenantDomain } }` at the API level (`"The following path cannot be queried: slug"`) — resolve the tenant to its id first with `requireTenant()`/`resolveTenant()`, then filter on the id.

### Tenant-scoped collections

`posts`, `pages`, `media`, `categories`, `tags`, `reviews`, `content-sources`, `seo-research-runs`, `seo-research-rules`, and the search-plugin's `search` index are all tenant-scoped via [`@payloadcms/plugin-multi-tenant`](https://www.npmjs.com/package/@payloadcms/plugin-multi-tenant) (registered in `src/plugins/index.ts`, must be the **last** plugin registered — it decorates collections other plugins generate, notably `search`).

Two non-obvious consequences of this plugin worth knowing before you add a new tenant-scoped collection or debug an access-denied error:

1. **A new self-registered user's `tenants` array starts empty**, and the plugin denies non-admin access to *every* tenant-scoped collection outright (not filtered — flatly denied) for a user with an empty `tenants` array, regardless of what that collection's own `access` config says. `src/collections/Users/hooks/assignSignupTenant.ts` fixes this by assigning the tenant a signup request came from (via `Host`) at creation time. If you add a new way to create a user (an invite flow, an admin bulk-import, etc.), make sure it also populates `tenants`, or that account will be silently locked out of everything except reading its own user doc.

2. **`slugField()`'s default unique index is global, not per-tenant.** Every collection using Payload's `slugField()` helper (Pages, Posts, Categories, Tags) had this turned off (`disableUnique: true`) and replaced with `uniqueSlugPerTenant()` (`src/utilities/uniqueSlugPerTenant.ts`), a field-level `validate` that scopes the uniqueness check to `tenant + slug`. Without this, two different tenants could never both have a page called `home`, or a post with the same slug — which defeats a large part of the point of having separate tenants. If you add a `slugField()` anywhere new, use the same pattern.

### Per-tenant "globals": Settings, Header, Footer

`Settings`, `Header`, and `Footer` used to be true Payload **Globals** (singletons). Payload Globals can't be tenant-scoped, so all three were converted to ordinary **collections** — one row per tenant — and registered with the multi-tenant plugin's `isGlobal: true` option, which makes the admin UI still treat each as a singleton *per tenant* rather than a list.

If you're used to the original [Payload Website Template](https://github.com/payloadcms/payload/tree/3.x/templates/website) this repo started from, this is the biggest structural departure from it: `payload.findGlobal({ slug: 'settings' })` no longer works — use `getCachedTenantDoc('settings', tenant.id)` from `src/utilities/getTenantDoc.ts` instead. Their revalidation hooks also changed from `GlobalAfterChangeHook` to `CollectionAfterChangeHook`, and the Next cache tag is tenant-scoped (`tenant_${id}_settings`, built by `tenantCacheTag()`) — a shared tag would let one tenant's edit invalidate every other tenant's cached pages.

### Creating a tenant

In the admin panel, under **Tenants**, there's a **"Create a tenant from a URL"** panel above the list (admin-only; the panel is hidden in the UI for non-admins, and the `/api/tenants/create-from-url` route it posts to independently re-checks `role === 'admin'` server-side — the UI check is convenience, not the security boundary).

Give it a name, a subdomain, and (optionally) the client's existing site URL — the latter runs brand sync immediately (logo/color/name extracted from their site's meta tags or a `brand.json`), rather than waiting for the ~5-minute background poll that keeps it in sync afterward.

### Local subdomain testing

`*.localhost` resolves to `127.0.0.1` in essentially every modern OS/browser without any `/etc/hosts` edit. To view a specific tenant locally, just use its subdomain directly:

```
http://localhost:3000            → default tenant
http://acme.localhost:3000       → the "acme" tenant
```

`curl -H "Host: acme.localhost:3000" http://localhost:3000/` works the same way for testing from a script or CI, without needing DNS to resolve at all.

## Full-site clone pipeline

Beyond brand sync (colors/logo/name only), a tenant's `sourceUrl` can be fully cloned: the homepage is scraped, rewritten into a self-contained static shell (all assets rewritten to point at Supabase Storage, tracking scripts stripped), screenshotted and pixel-diffed against the live source, and held for manual admin approval before it can ever be served on the tenant's subdomain.

**Scope is deliberately homepage-only.** There is no crawler, no sitemap traversal, no internal-link discovery — the clone becomes the site's shell, and `/blog` (the existing Nexus blog, mounted inside it) is where the real, ongoing content lives.

### 1. DNS ownership verification (required before anything else)

A tenant's clone pipeline is entirely blocked until domain ownership is proven via a DNS TXT record — enforced server-side in `POST /api/tenants/clone` (`dnsVerified !== true` → `403`), independent of what the admin UI shows.

In the tenant's admin edit view, under **Domain Verification**, a token is generated once (on creation, or on first save for a tenant that predates this field) and never rotated. The panel shows the exact record to publish:

```
Type:  TXT
Name:  _nexus-verify.<sourceDomain>
Value: nexus-verify=<32-char token>
```

Click **"Check now"** once it's live — this is a manual, on-demand check (`POST /api/tenants/verify-dns`), not a blocking wait, because DNS propagation genuinely takes anywhere from minutes to hours. It fails closed: no record, wrong record, or a lookup error all leave `dnsVerified: false`.

Changing a tenant's `sourceUrl` to point at a different domain automatically clears `dnsVerified` — the old TXT record was proof of ownership for a different domain, and shouldn't silently keep authorizing a clone of the new one.

### 2. Running the clone

From the tenant's edit view, **Site Clone → Clone site**. This:

1. Launches headless Chromium, navigates to `sourceUrl`, and **auto-scrolls top-to-bottom in increments, pausing after each one** — long enough for lazy-loaded images (`IntersectionObserver`-swapped `data-src`) to resolve and scroll-triggered animations (Framer Motion, GSAP ScrollTrigger, AOS) to finish transitioning, not just for the scroll itself to stop. Snapshotting before this settles captures unloaded images and elements frozen mid-fade.
2. Takes a full-page screenshot of the live source (used for the QA diff).
3. Strips scripts: third-party trackers/widgets and framework runtime (`__NEXT_DATA__`, webpack/turbopack chunks — dead weight without the original server to hydrate against) are removed outright. Anything the stripper can't positively identify is **kept and flagged for review** instead of deleted — deleting what turns out to be the mobile-nav toggle is a worse failure than leaving one unrecognized script in the shell.
4. Extracts every asset reference (`img`/`srcset`/`<link>`/CSS `url()`/inline `style`), resolves each one against the **source origin** — this matters because `next/font` static files and root-relative paths like `/logo.svg` look "internal" but must still be treated as belonging to the source site, not the new subdomain, or they silently 404 once served from Supabase Storage instead of the client's server.
5. Unwraps `next/image` proxy URLs (`/_next/image?url=<encoded>&w=...`) back to the real underlying image before downloading — the proxy path doesn't exist once served outside the source site's own Next.js server.
6. Uploads everything to Supabase Storage under `{tenantId}/assets/...`, content-addressed by a hash of the source URL so re-running a clone overwrites in place instead of accumulating duplicates.
7. Rewrites the captured HTML to point at the stored copies, and checks for any surviving reference to the source domain (should be empty in a fully self-contained shell — surfaced in the clone log if not).
8. Renders the *rewritten* shell in a fresh headless browser (proving the rewritten URLs actually resolve, not just reading the file off disk) and pixel-diffs it against the source screenshot, producing a 0–100 similarity score.

The result always lands in `pending_review` — **nothing is ever auto-published**, regardless of score. Fidelity varies a lot by source site (CSS-in-JS, obfuscated class names, and SPA hydration all degrade it); this pipeline is not attempting to solve that for every possible site, which is exactly why the quality gate below exists.

### 3. Review, approve, or fall back

Each tenant has a configurable **QA Threshold** (default 85). Below it, the admin panel surfaces a recommendation to use the brand-only fallback instead of publishing a low-fidelity clone.

- **Preview** opens `/admin-preview/{tenantId}` (admin-gated, sandboxed `<iframe>`) — not live anywhere, just a look before deciding.
- **Approve & publish** (`POST /api/tenants/clone/decide`, `{ decision: 'approve' }`) is the *only* path to `cloneStatus: 'published'`. Only a shell in `pending_review` can be approved.
- **Use brand-only instead** (`{ decision: 'fallback' }`) discards the stored shell, deletes its Storage objects, and runs the ordinary brand-sync resolver against the same `sourceUrl` — applying just color/logo/name to the standard Nexus templates.

### Serving

The tenant's root page checks `shouldServeShell()` (`src/utilities/clone/serveShell.ts`) — **only** `cloneStatus === 'published'` with a stored shell path renders the clone; every other status (`pending_review`, `brand_only`, `scraping`, `failed`, `none`) falls through to the normal Nexus templates. This is the actual safety property to preserve if you touch this code: an approved-pending shell must never be reachable on the live subdomain just because it exists in storage.

`/blog` and `/blog/[slug]` re-export the existing `/posts` implementation rather than duplicating it — both stay in lockstep automatically. If the shell has a detectable `<nav>` with existing links, a "Blog" link pointing at `/blog` is appended, inheriting the last link's CSS class so it looks native; if the nav is too ambiguous to safely edit, it's left untouched and `/blog` is still reachable by URL directly.

### Re-syncing

**"Re-sync clone"** in the same panel re-runs the whole pipeline (steps 1–3 above) and goes back through the same quality gate — a re-clone is a deliberate, reviewable action, not an automatic background job, since source sites redesign and change build tooling in ways that can silently break a previously-working scrape.

### Two things that will bite you if you're not careful

#### Playwright's browser version is pinned — do not bump it carelessly

`playwright` and `@playwright/test` **must be the exact same version**, because the Chromium *revision* a Playwright version expects changes between releases, and `npx playwright install chromium` downloads whatever revision the currently-installed `playwright-core` wants. Bumping just one of the two (e.g. `npm install playwright` picking up a newer default while `@playwright/test` stays pinned in `package.json`) silently moves the expected browser revision and invalidates any already-downloaded browser — `npx playwright install` then has to redownload ~150MB again, and until it does, every clone attempt fails with `browserType.launch: Executable doesn't exist`.

If you ever need to change the Playwright version, bump both packages together and re-run `npx playwright install chromium` in the same step. Check what's actually required and installed with:

```bash
node -e "console.log(require('playwright/package.json').version, require('@playwright/test/package.json').version)"
node -e "const b=require('playwright-core/browsers.json'); console.log(b.browsers.find(x=>x.name==='chromium').revision)"
```

Also: `npx playwright install` can leave a stale `__dirlock` file (at `~/AppData/Local/ms-playwright/__dirlock` on Windows, or the equivalent under `~/.cache/ms-playwright` elsewhere) if a previous install was killed mid-download rather than allowed to finish — a subsequent install then fails immediately with an "active lockfile" error even though nothing is actually running. Safe to delete if you've confirmed (via your OS's process list) that no `playwright install` process is genuinely still in flight.

#### Why the Storage bucket is public, not private

Cloned assets are copies of an already-public marketing site — there's no confidentiality concern. A **private** bucket would mean every asset URL is a signed URL with an expiry, which would force a re-sign *and* a full HTML rewrite on every single render, and would prevent normal browser/CDN caching. Public is both simpler and correct here; don't "harden" this to private without also solving the re-signing problem first.

## Database (Postgres / Supabase)

This project uses Postgres, not SQLite. If you're using Supabase specifically, there's one non-obvious gotcha worth knowing:

Supabase gives you two different pooled connection strings:

- **Transaction pooler (port `6543`)** — meant for many short-lived serverless connections. It does **not** support prepared statements or advisory locks, both of which Payload's migration runner needs. Using this for `DATABASE_URL` will make `payload migrate` hang or fail unpredictably.
- **Session pooler (port `5432`)** — behaves like a normal long-lived Postgres connection. **Use this one** for `DATABASE_URL`.

Also make sure your connection string includes SSL — this project's `payload.config.ts` already passes `ssl: { rejectUnauthorized: false }` to the Postgres adapter, so you don't need `?sslmode=require` in the URL itself, but the app will hang on connect without SSL enabled on the adapter side if you copy this config elsewhere.

**Note that `SUPABASE_URL` (Storage API) and `DATABASE_URL` (Postgres) are two different services on two different URLs**, even though they belong to the same Supabase project — `SUPABASE_URL` is `https://<project-ref>.supabase.co`, not the `postgresql://...` connection string. Don't conflate them.

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

This diffs the current database schema against your Payload config and writes a new `src/migrations/<timestamp>_<name>.ts` file with `up()`/`down()` SQL. **Always review the generated SQL before applying it** — Payload's auto-generator gets most things right but has produced genuinely broken migrations in this project's history:

- An `ALTER TYPE ... ADD VALUE` followed by using that same new enum value later in the *same* transaction — Postgres allows adding an enum value inside a transaction, but not using it in that same transaction (`unsafe use of new value`). The fix is either dropping the redundant statement if nothing actually needs the new default at the DB level, or adding the value on a separate, independently-committing connection before the transactional part runs (see `20260728_190303_add_reader_role.ts` for the pattern).
- A generated `DROP CONSTRAINT` immediately after a `DROP TABLE ... CASCADE` that had already removed that same constraint as a side effect — fails with "constraint does not exist". Safe to just delete the redundant `DROP CONSTRAINT` line; the `CASCADE` already did the work.

**Check migration status:**

```bash
npm run payload migrate:status
```

**Roll back the most recent migration:**

```bash
npm run payload migrate:down
```

### Troubleshooting: `payload migrate` hangs with zero output

If you've previously run `npm run dev` against this database, Payload's dev-mode schema auto-push leaves a `batch: -1` row in its own `payload_migrations` table. The next time you run `payload migrate` for real, it detects that row and prompts:

> *"It looks like you've run Payload in dev mode... If you'd like to run migrations, data loss will occur. Would you like to proceed? (y/N)"*

Run without an attached TTY (a background process, a script, some CI setups), that prompt renders **nothing at all** and blocks on stdin forever — indistinguishable from a genuine hang unless you know to look for it. Confirm this is what's happening with `ps`/Task Manager (near-zero CPU, no database activity), then either run it with a real TTY attached, or pipe the answer in directly:

```bash
printf 'y\n' | NODE_ENV=production npx payload migrate
```

Reading the library's source before answering that prompt is worth doing once: the "yes" path here only filters the stale `dev` row out of Payload's own tracking table and then runs whatever pending migrations exist — it does not touch your actual data. The "data loss will occur" wording is a generic warning about dev-push/migration divergence in general, not a description of what this specific action does.

`NODE_OPTIONS=--no-deprecation` in front of migration commands (see the `payload` script in `package.json`) is just noise suppression, unrelated to this.

## Email (Resend)

Password reset and account verification emails go through [Resend](https://resend.com):

1. Create a free Resend account and generate an API key.
2. Set `RESEND_API_KEY` in `.env` (or your hosting provider's environment variables).
3. By default this project sends from `onboarding@resend.dev` — Resend's shared sandbox address. It works immediately with no setup, **but a Resend account without a verified domain can only deliver to the email address you signed up to Resend with** — every other recipient gets a `403`. Fine for a single developer testing locally; not fine once anyone else needs to sign up.
4. For production, verify a domain you own in Resend (Project Settings → Domains — this needs DNS records on a real domain, a personal Gmail/Outlook address cannot be verified this way), then update `defaultFromAddress`/`defaultFromName` passed to `resendAdapter(...)` in `src/payload.config.ts`.

### Dev-only email bypass

Outside `production` (`NODE_ENV !== 'production'`), two things are wrapped in specifically to keep local development unblocked without needing a verified domain:

- `src/utilities/devSafeEmailAdapter.ts` wraps whichever email adapter is configured so that **any** send failure is logged as a console warning instead of thrown — the sandbox-restriction 403 above, Resend's separate rejection of certain placeholder domains, or anything else. In production this wrapper is a complete no-op; the real adapter runs unwrapped and failures still throw normally.
- `src/collections/Users/hooks/autoVerifyInDev.ts` marks new accounts `_verified: true` on creation outside production, since the verification email that would normally gate login often can't actually be delivered locally.

Neither of these does anything once `NODE_ENV === 'production'` — this is purely so `npm run dev` doesn't require Resend setup to test signup end-to-end.

## Customizing branding

Each tenant has its own **Settings** doc (Admin → Tenants → open a tenant, or directly under Settings if only one tenant exists): site name, logo, favicon, brand color, fonts, corner radius, density, animations, default OG image, copyright text, and social links, applied across that tenant's site — including the favicon, the auth pages (login/signup/reset/verify), and transactional emails. The admin panel's own browser tab title/icon is a static build-time default and does not change per tenant.

### Syncing branding from a tenant's real website

Set a tenant's **Brand Source URL** to their actual site, and name/color/logo sync automatically — checked roughly every 5 minutes; any field found remotely overrides the manual Settings values. This is separate from (and much lighter-weight than) the [full-site clone pipeline](#full-site-clone-pipeline) above — this only ever touches a handful of branding fields, never the page layout itself.

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

2. **Just the site's homepage URL** — if no JSON is found there, it automatically falls back to reading standard meta tags: `og:site_name` (or `<title>`) for the name, `theme-color` for the color, and the favicon/apple-touch-icon for the logo.

If the sync URL is unreachable or returns nothing usable, the site silently falls back to the manual Settings values — it never breaks.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the local dev server |
| `npm run build` | Build for production |
| `npm run start` | Run the production build |
| `npm run lint` | Lint the codebase |
| `npm run generate:types` | Regenerate TypeScript types from the Payload config |
| `npm run generate:importmap` | Regenerate the admin panel's import map (run after adding/removing a custom admin UI component) |
| `npm run payload migrate` | Apply all pending database migrations |
| `npm run payload migrate:create <name>` | Generate a new migration from the current config/schema diff |
| `npm run payload migrate:status` | List applied/pending migrations |
| `npm run seed:content` | Import the committed `content-seed/data.json` bundle (pages, published posts, categories, forms, header/footer nav) into the default tenant — safe to run on a fresh database and safe to re-run |
| `npm test` | Run integration and e2e tests — see [Testing](#testing) |

## Project structure

- `src/collections` — Pages, Posts, Media, Users (reader/author/reviewer/admin), Categories, Tags, Tenants, Reviews, ContentSources, SeoResearchRuns, SeoResearchRules, and the per-tenant Settings/Header/Footer collections
- `src/collections/Tenants` — the Tenants collection, its DNS-verification and site-clone admin panels (`components/DnsVerification`, `components/ClonePanel`)
- `src/plugins/index.ts` — plugin registration; `multiTenantPlugin` **must stay last**
- `src/middleware.ts` — subdomain → `[tenantDomain]` rewrite (Edge runtime — see the comment at the top about why it only imports from `tenantConstants.ts`, never anything that reaches `payload.config.ts`)
- `src/utilities/getTenant.ts`, `getTenantDoc.ts`, `tenantWhere.ts`, `tenantCacheTag.ts` — tenant resolution, per-tenant "global" reads, query scoping, and cache-tag helpers
- `src/utilities/clone/` — the full-site clone pipeline: `scrape.ts` (Playwright capture + asset pipeline orchestration), `qa.ts` (pixel-diff scoring), `assetUrls.ts` (asset extraction/rewriting — pure functions, unit-tested independent of the browser), `nextImage.ts` (`next/image` proxy unwrapping), `scripts.ts` (tracking/framework script stripping), `serveShell.ts` (the live-serving gate), `storage.ts` (Supabase Storage upload/read/delete)
- `src/app/(payload)/api/tenants/` — `create-from-url`, `verify-dns`, `clone`, `clone/decide` routes; all admin-only, all re-check the role server-side independent of the admin UI
- `src/app/(clone-preview)/admin-preview/[id]` — the clone preview route. **Deliberately its own route group**, not nested under `(payload)`/`/admin` — Payload's `admin/[[...segments]]` optional catch-all swallows every path beneath it (including its own layout's `access.admin` check, which throws a 500 rather than a clean 404 for a non-admin), so a route literally cannot execute if placed under `/admin/anything`.
- `src/blocks` — page builder blocks (hero, content, CTA, form, media, archive)
- `src/heros` — hero section variants
- `src/app/(frontend)` — layout/globals.css/not-found at the group root (rendered on every tenant, so anything here must resolve its own tenant — see [Multi-tenancy](#multi-tenancy)); `[tenantDomain]/` holds every actual page, including `/dashboard` (staff area), the auth pages, and `/blog`
- `src/app/(payload)` — the admin panel
- `src/migrations` — database migrations (see [Database migrations](#database-migrations))
- `src/utilities/seoResearch` — the SEO Research Agent's pipeline (SerpApi lookup, AI competitor analysis/strategy/writing, keyword-template resolution, the per-tenant automatic scheduler)

## Testing

```bash
npm test          # integration (vitest) + e2e (Playwright), full suite
npm run test:int  # vitest only — src logic, including everything in src/utilities/clone/
npm run test:e2e  # Playwright browser tests — needs the browser installed, see below
```

The clone pipeline's pure logic (asset URL resolution/rewriting, `next/image` unwrapping, script classification, the serving gate, DNS token/record matching) is covered by `tests/int/*.spec.ts` and runs with plain `vitest` — no browser needed. The actual Playwright-driven scrape and pixel-diff are exercised for real only by running the clone feature itself (or by e2e tests that drive a full clone), which needs Chromium installed:

```bash
npx playwright install chromium
```

See [the version-pinning warning](#playwrights-browser-version-is-pinned--do-not-bump-it-carelessly) above before touching Playwright's version.

## Deployment

This is a standard Next.js app and can be deployed anywhere Next.js is supported — Vercel, a Node server, or Docker (see `Dockerfile` and `docker-compose.yml`). One important distinction between them:

### Vercel (serverless)

1. Push the repo to GitHub/GitLab/Bitbucket and import it into Vercel.
2. Set every environment variable from the table in [Getting started](#2-set-up-environment-variables) in the Vercel project's Environment Variables settings.
3. Run `npm run payload migrate` against the production database **before** the first deploy goes live (from your local machine with `DATABASE_URL` pointed at production, or via a one-off Vercel deploy hook/CI step) — Vercel's build step does not run migrations for you.
4. **The SEO Research Agent's automatic scheduler will not run on Vercel.** It's implemented as an in-process `setInterval` (see `src/utilities/seoResearch/scheduler.ts`), which only works on a long-lived server process — serverless functions like Vercel's spin up per-request and don't stay running in the background. Wire up [Vercel Cron](https://vercel.com/docs/cron-jobs) (or any external cron service) to `POST /api/seo-research/run-due` with an `Authorization: Bearer <CRON_SECRET>` header instead. Do the same for `POST /api/sync-content-sources` if you use RSS content sources with auto-sync.
5. **The clone pipeline's headless-Chromium scrape is unlikely to work as-is on Vercel's serverless functions** — Playwright's full Chromium build is large and generally needs a persistent filesystem/longer execution window than a typical serverless function provides. If you need cloning in a serverless deploy, look at `@sparticuz/chromium` (a Lambda/serverless-optimized Chromium build) as a drop-in for the `chromium.launch(...)` calls in `src/utilities/clone/scrape.ts` and `qa.ts`, rather than assuming this works unmodified — it has not been tested against Vercel by this project.

### Docker / a long-lived Node server

Everything above applies except steps 4 and the Chromium caveat in step 5 — the in-process scheduler works as-is, and a normal Playwright Chromium install works fine, since the process stays running with a persistent filesystem. You can still wire up external cron to the scheduled-job endpoints if you'd rather not rely on the in-process timer, but it isn't required here.

## Known gaps / not yet done

Being upfront about what's built but unproven, so you don't assume more confidence in it than is warranted:

- **The clone pipeline's Playwright-dependent parts (auto-scroll capture, real asset download, the pixel-diff score) have unit-tested logic but have not yet been run end-to-end against a real client site in this repository's history.** Expect the auto-scroll settle timing (`scrollSettleMs` in `scrape.ts`) to need tuning once you do — it's currently a reasonable guess, not a value validated against real sites.
- **No optional automatic DNS-verification polling** (the task this pipeline was built from allowed for an automatic recheck via the existing `CRON_SECRET` cron infrastructure, on top of the manual "Check now" button — only the manual path is implemented; it satisfies the requirement on its own).
- Local project state should not be assumed to match `origin/Ibrahim-backend` until you've confirmed it — check `git log`/`git status` rather than assuming a fresh clone is current, especially around the multi-tenant and clone-pipeline work.

## Built on

This project started from the official [Payload Website Template](https://github.com/payloadcms/payload/tree/3.x/templates/website).
