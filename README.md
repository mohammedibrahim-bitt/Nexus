# Nexus

A blog built with [Payload CMS](https://payloadcms.com) and [Next.js](https://nextjs.org). Fully self-editable from the admin panel — site name, logo, and brand color are all configurable without touching code, making this easy to re-skin or hand off to a new owner.

## Features

- Page builder (hero, content, call-to-action, media, form blocks) editable from the admin panel
- Posts with categories, authors, reviewer sign-off, and SEO fields
- Newsletter signup form (submissions land in the admin's Form Submissions collection)
- Site-wide **Settings** global — change the site name, logo, and brand color from one place, no code changes required
- Light/dark mode for both the public site and the admin panel
- Social share buttons and a back-to-top button on post pages
- Search, redirects, drafts, and live preview

## Getting started

### 1. Install dependencies

```bash
npm install
```

### 2. Set up environment variables

```bash
cp .env.example .env
```

Then edit `.env` and set `PAYLOAD_SECRET` to a long, random string (used to sign auth tokens). The default `DATABASE_URL` points at a local SQLite file and works out of the box.

### 3. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) for the site, and [http://localhost:3000/admin](http://localhost:3000/admin) for the admin panel. On first run you'll be prompted to create an admin account.

## Customizing branding

Log into the admin panel and go to **Settings** (under the "Site" group in the sidebar):

- **Site Name** — used in the header/footer logo text and page titles
- **Logo** — upload an image to replace the text logo everywhere
- **Brand Color** — a hex color used for buttons, links, and accents site-wide

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
| `npm test` | Run integration and e2e tests |

## Project structure

- `src/collections` — Pages, Posts, Media, Users, Categories, Customers, Reviews
- `src/Header`, `src/Footer`, `src/Settings` — site-wide globals
- `src/blocks` — page builder blocks (hero, content, CTA, form, media, archive)
- `src/heros` — hero section variants
- `src/app/(frontend)` — the public-facing site
- `src/app/(payload)` — the admin panel

## Deployment

This is a standard Next.js app and can be deployed anywhere Next.js is supported (Vercel, a Node server, Docker — see `Dockerfile` and `docker-compose.yml`). Make sure to set the environment variables from `.env.example` in your hosting provider, and note that the default SQLite database is a local file — for production, either persist that file on a volume or switch to a hosted database.

## Built on

This project started from the official [Payload Website Template](https://github.com/payloadcms/payload/tree/3.x/templates/website).
