import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { headers as getHeaders } from 'next/headers'
import { NextResponse } from 'next/server'

import { describeQaOutcome, meetsQaThreshold, runShellQa } from '@/utilities/clone/qa'
import { scrapeSiteToShell } from '@/utilities/clone/scrape'
import { getPublicUrl } from '@/utilities/clone/storage'

/**
 * Runs (or re-runs) the full-site clone for a tenant, then the QA gate.
 *
 * HARD REQUIREMENT: `dnsVerified === true`. This is enforced here, server-side,
 * independent of anything the admin UI shows or hides — without proof of domain
 * ownership we will not scrape a third-party site.
 *
 * Never publishes. The best possible outcome is `pending_review`.
 */
export async function POST(request: Request) {
  const payload = await getPayload({ config: configPromise })
  const headers = await getHeaders()
  const { user } = await payload.auth({ headers })

  if (!user || user.collection !== 'users' || user.role !== 'super_admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  let tenantId: number | string | undefined
  try {
    tenantId = (await request.json())?.tenantId
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (!tenantId) return NextResponse.json({ error: 'A tenantId is required.' }, { status: 400 })

  const tenant = await payload.findByID({
    id: tenantId,
    collection: 'tenants',
    depth: 0,
    disableErrors: true,
  })

  if (!tenant) return NextResponse.json({ error: 'Tenant not found.' }, { status: 404 })

  // ── The gate. Deliberately before any network call to the source site.
  if (tenant.dnsVerified !== true) {
    return NextResponse.json(
      {
        error:
          'Domain ownership is not verified for this tenant. Publish the DNS TXT record and verify it before cloning.',
      },
      { status: 403 },
    )
  }

  if (!tenant.sourceUrl) {
    return NextResponse.json({ error: 'This tenant has no Brand Source URL to clone.' }, { status: 400 })
  }

  const update = (data: Record<string, unknown>) =>
    payload.update({
      id: tenant.id,
      collection: 'tenants',
      context: { disableRevalidate: true },
      data,
      overrideAccess: true,
    })

  await update({ cloneStatus: 'scraping' })

  try {
    const scrape = await scrapeSiteToShell({ sourceUrl: tenant.sourceUrl, tenantId: tenant.id })

    // Score the rewritten shell as a browser would actually load it.
    const shellUrl = getPublicUrl(scrape.shellHtmlPath)
    const sourceScreenshotUrl = getPublicUrl(scrape.sourceScreenshotPath)
    const sourceScreenshot = Buffer.from(await (await fetch(sourceScreenshotUrl)).arrayBuffer())

    const qa = await runShellQa({ shellUrl, sourceScreenshot, tenantId: tenant.id })

    const threshold = typeof tenant.qaThreshold === 'number' ? tenant.qaThreshold : 85
    const passes = meetsQaThreshold(qa.score, threshold)

    const logLines = [
      describeQaOutcome(qa.score, threshold),
      `Assets stored: ${scrape.assetCount}.`,
      `Scripts removed: ${scrape.removedScripts.length}; kept for review: ${scrape.flaggedScripts.length}.`,
    ]

    if (scrape.residualSourceRefs.length > 0) {
      logLines.push(
        `WARNING: ${scrape.residualSourceRefs.length} reference(s) still point at the source domain, e.g. ${scrape.residualSourceRefs[0]}`,
      )
    }

    await update({
      cloneLog: logLines.join('\n'),
      cloneStatus: 'pending_review',
      diffScreenshotPath: qa.diffScreenshotPath,
      flaggedScripts: scrape.flaggedScripts,
      lastClonedAt: new Date().toISOString(),
      qaScore: qa.score,
      shellHtmlPath: scrape.shellHtmlPath,
      shellScreenshotPath: qa.shellScreenshotPath,
      sourceScreenshotPath: scrape.sourceScreenshotPath,
    })

    payload.logger.info(`[clone] ${tenant.slug}: score ${qa.score}% (threshold ${threshold}%)`)

    return NextResponse.json({
      assetCount: scrape.assetCount,
      belowThreshold: !passes,
      flaggedScripts: scrape.flaggedScripts,
      qaScore: qa.score,
      recommendation: passes
        ? 'Review the preview, then approve to publish.'
        : 'Quality is low — consider the brand-only fallback.',
      residualSourceRefs: scrape.residualSourceRefs,
      status: 'pending_review',
      threshold,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Clone failed'

    await update({
      cloneLog: `Clone failed: ${message}`,
      cloneStatus: 'failed',
    })

    payload.logger.error(`[clone] ${tenant.slug} failed: ${message}`)

    // A missing browser binary is the most likely cause in a fresh checkout,
    // and the fix is a single command — say so rather than a bare stack trace.
    const needsBrowser = /executable doesn't exist|browserType\.launch/i.test(message)

    return NextResponse.json(
      {
        error: needsBrowser
          ? `Playwright's browser is not installed. Run: npx playwright install chromium\n\n${message}`
          : message,
      },
      { status: 500 },
    )
  }
}
