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
