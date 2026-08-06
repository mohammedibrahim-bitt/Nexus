import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { headers as getHeaders } from 'next/headers'
import { NextResponse } from 'next/server'

import { fetchRemoteBrand } from '@/utilities/getBrandData'
import { removeTenantAssets } from '@/utilities/clone/storage'

/**
 * The human decision at the end of the quality gate: publish the reviewed
 * shell, or discard it and fall back to brand-only.
 *
 * Publishing is deliberately a separate, explicit call — a pixel score can't
 * tell you the mobile nav is dead, so a person has to look first.
 */

const hexColorRegex = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/

export async function POST(request: Request) {
  const payload = await getPayload({ config: configPromise })
  const headers = await getHeaders()
  const { user } = await payload.auth({ headers })

  if (!user || user.collection !== 'users' || user.role !== 'super_admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  let body: { decision?: string; tenantId?: number | string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { decision, tenantId } = body

  if (!tenantId) return NextResponse.json({ error: 'A tenantId is required.' }, { status: 400 })
  if (decision !== 'approve' && decision !== 'fallback') {
    return NextResponse.json(
      { error: "decision must be 'approve' or 'fallback'." },
      { status: 400 },
    )
  }

  const tenant = await payload.findByID({
    id: tenantId,
    collection: 'tenants',
    depth: 0,
    disableErrors: true,
  })

  if (!tenant) return NextResponse.json({ error: 'Tenant not found.' }, { status: 404 })

  const update = (data: Record<string, unknown>) =>
    payload.update({
      id: tenant.id,
      collection: 'tenants',
      context: { disableRevalidate: true },
      data,
      overrideAccess: true,
    })

  // ── Approve: the only path to `published`.
  if (decision === 'approve') {
    if (tenant.cloneStatus !== 'pending_review') {
      return NextResponse.json(
        {
          error: `Only a shell in pending_review can be published (this tenant is "${tenant.cloneStatus}").`,
        },
        { status: 409 },
      )
    }

    if (!tenant.shellHtmlPath) {
      return NextResponse.json({ error: 'This tenant has no stored shell to publish.' }, { status: 409 })
    }

    await update({
      cloneLog: `${tenant.cloneLog || ''}\nApproved by ${user.email} at ${new Date().toISOString()} — published (score ${tenant.qaScore ?? 'n/a'}%).`.trim(),
      cloneMode: 'full_clone',
      cloneStatus: 'published',
    })

    payload.logger.info(`[clone] ${tenant.slug} published as full_clone by ${user.email}`)

    return NextResponse.json({ mode: 'full_clone', status: 'published' })
  }

  // ── Fallback: discard the shell, keep only the extracted branding.
  let syncedNote = 'no brand data resolved'

  if (tenant.sourceUrl) {
    try {
      const remote = await fetchRemoteBrand(tenant.sourceUrl)

      if (remote) {
        const settings = await payload.find({
          collection: 'settings',
          depth: 0,
          limit: 1,
          where: { tenant: { equals: tenant.id } },
        })

        const target = settings.docs[0]
        const data: Record<string, unknown> = {}

        if (typeof remote.siteName === 'string' && remote.siteName.trim()) {
          data.siteName = remote.siteName.trim()
        }
        if (typeof remote.primaryColor === 'string' && hexColorRegex.test(remote.primaryColor)) {
          data.primaryColor = remote.primaryColor
        }

        if (target && Object.keys(data).length > 0) {
          await payload.update({
            id: target.id,
            collection: 'settings',
            context: { disableRevalidate: true },
            data,
            overrideAccess: true,
          })
          syncedNote = `applied ${Object.keys(data).join(', ')}`
        }
      }
    } catch (err) {
      syncedNote = `brand sync failed: ${err instanceof Error ? err.message : 'unknown error'}`
    }
  }

  const removedCount = await removeTenantAssets(tenant.id).catch(() => 0)

  await update({
    cloneLog:
      `${tenant.cloneLog || ''}\nFell back to brand-only by ${user.email} at ${new Date().toISOString()} — score ${tenant.qaScore ?? 'n/a'}% vs threshold ${tenant.qaThreshold ?? 85}%; ${syncedNote}; removed ${removedCount} stored object(s).`.trim(),
    cloneMode: 'brand_only',
    cloneStatus: 'brand_only',
    diffScreenshotPath: null,
    shellHtmlPath: null,
    shellScreenshotPath: null,
  })

  payload.logger.info(
    `[clone] ${tenant.slug} fell back to brand_only by ${user.email} (${syncedNote})`,
  )

  return NextResponse.json({ brandSync: syncedNote, mode: 'brand_only', status: 'brand_only' })
}
