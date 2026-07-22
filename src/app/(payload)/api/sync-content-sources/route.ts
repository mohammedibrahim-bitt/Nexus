import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { headers as getHeaders } from 'next/headers'
import { NextResponse } from 'next/server'

import { syncContentSource } from '@/utilities/syncContentSource'

// Mirrors the auth pattern already used for the jobs queue in payload.config.ts:
// logged-in admins can trigger this from the browser, and an external cron
// (Vercel Cron, GitHub Actions, cron-job.org, etc.) can trigger it headlessly
// with the CRON_SECRET bearer token.
async function isAuthorized(req: Request): Promise<boolean> {
  const payload = await getPayload({ config: configPromise })
  const headers = await getHeaders()
  const { user } = await payload.auth({ headers })

  if (user) return true

  const secret = process.env.CRON_SECRET
  if (!secret) return false

  const authHeader = req.headers.get('authorization')
  return authHeader === `Bearer ${secret}`
}

export async function POST(req: Request) {
  if (!(await isAuthorized(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const payload = await getPayload({ config: configPromise })

  const { docs: sources } = await payload.find({
    collection: 'content-sources',
    limit: 100,
    where: { active: { equals: true } },
  })

  const results = []

  for (const source of sources) {
    const result = await syncContentSource(payload, source)

    await payload.update({
      id: source.id,
      collection: 'content-sources',
      context: { disableRevalidate: true },
      data: {
        lastFetchedAt: new Date().toISOString(),
        lastFetchStatus:
          result.errors.length > 0
            ? `Imported ${result.imported}, ${result.errors.length} error(s): ${result.errors[0]}`
            : `Imported ${result.imported}, skipped ${result.skipped} already-seen item(s)`,
      },
    })

    results.push({ source: source.name, ...result })
  }

  return NextResponse.json({ results })
}
