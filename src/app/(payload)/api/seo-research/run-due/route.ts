import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { headers as getHeaders } from 'next/headers'
import { NextResponse } from 'next/server'

import { runDueSeoResearchRules } from '@/utilities/seoResearch/runDueRules'

// Mirrors the auth pattern already used for /api/sync-content-sources:
// logged-in admins can trigger this from the browser, and an external cron
// (Vercel Cron, GitHub Actions, cron-job.org, etc.) can trigger it headlessly
// with the CRON_SECRET bearer token. In normal operation you don't need to
// wire anything up to this route at all — the in-process scheduler (see
// payload.config.ts's onInit) already calls the same underlying function on
// its own; this route exists for manually forcing a check, or as a backup
// trigger if you'd rather rely on an external cron instead.
async function isAuthorized(req: Request): Promise<boolean> {
  const payload = await getPayload({ config: configPromise })
  const headers = await getHeaders()
  const { user } = await payload.auth({ headers })

  // This checks every tenant's due rules in one pass, so it must stay
  // platform-wide — a tenant-scoped `admin` doesn't qualify.
  if (user && user.collection === 'users' && user.role === 'super_admin') return true

  const secret = process.env.CRON_SECRET
  if (!secret) return false

  const authHeader = req.headers.get('authorization')
  return authHeader === `Bearer ${secret}`
}

async function handle(req: Request) {
  if (!(await isAuthorized(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const payload = await getPayload({ config: configPromise })
  const result = await runDueSeoResearchRules(payload)

  return NextResponse.json(result)
}

// Vercel Cron invokes with GET, automatically attaching
// `Authorization: Bearer $CRON_SECRET` when a CRON_SECRET env var is set.
// POST is kept for the admin-triggered manual check and other external cron
// callers (GitHub Actions, cron-job.org, etc).
export const GET = handle
export const POST = handle
