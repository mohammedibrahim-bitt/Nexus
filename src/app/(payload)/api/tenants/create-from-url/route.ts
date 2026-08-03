import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { headers as getHeaders } from 'next/headers'
import { NextResponse } from 'next/server'

import { fetchRemoteBrand } from '@/utilities/getBrandData'
import { ensureDefaultTenantContent } from '@/utilities/tenantDefaultContent'

/**
 * Creates a tenant, its per-tenant Settings document, and runs the brand-sync
 * resolver immediately so the new subdomain is branded on its very first load
 * rather than after the next 5-minute revalidate window.
 *
 * SECURITY: this re-checks `role === 'admin'` itself. The admin UI hides the
 * Create-from-URL panel from non-admins, but hiding UI is not a security
 * boundary — this route is reachable directly and must stand on its own.
 */

const hexColorRegex = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/
const subdomainRegex = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/
const RESERVED = ['www', 'admin', 'api', 'app', 'static', 'assets']

export async function POST(request: Request) {
  const payload = await getPayload({ config: configPromise })
  const headers = await getHeaders()
  const { user } = await payload.auth({ headers })

  if (!user || user.collection !== 'users' || user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  let body: { domain?: string; name?: string; slug?: string; sourceUrl?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const name = body.name?.trim()
  const slug = body.slug?.trim().toLowerCase()
  const domain = body.domain?.trim().toLowerCase() || undefined
  const sourceUrl = body.sourceUrl?.trim()

  if (!name) return NextResponse.json({ error: 'A tenant name is required.' }, { status: 400 })
  if (!slug || !subdomainRegex.test(slug) || slug.length > 63) {
    return NextResponse.json(
      { error: 'Subdomain must be lowercase letters, numbers and hyphens (no leading/trailing hyphen).' },
      { status: 400 },
    )
  }
  if (RESERVED.includes(slug)) {
    return NextResponse.json({ error: `"${slug}" is a reserved subdomain.` }, { status: 400 })
  }
  if (sourceUrl) {
    try {
      const parsed = new URL(sourceUrl)
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') throw new Error()
    } catch {
      return NextResponse.json(
        { error: 'Brand source must be a valid http(s) URL.' },
        { status: 400 },
      )
    }
  }

  const duplicate = await payload.find({
    collection: 'tenants',
    depth: 0,
    limit: 1,
    where: { slug: { equals: slug } },
  })

  if (duplicate.docs[0]) {
    return NextResponse.json({ error: `A tenant with subdomain "${slug}" already exists.` }, { status: 409 })
  }

  const tenant = await payload.create({
    collection: 'tenants',
    context: { disableRevalidate: true },
    data: { domain, name, slug, sourceUrl },
  })

  // Resolve branding up front so the values are persisted on the Settings doc
  // instead of relying on the cached read-time overlay in getBrandData.
  let synced: { primaryColor?: string; siteName?: string } = {}
  let syncError: null | string = null

  if (sourceUrl) {
    try {
      const remote = await fetchRemoteBrand(sourceUrl)

      if (remote) {
        if (typeof remote.siteName === 'string' && remote.siteName.trim()) {
          synced.siteName = remote.siteName.trim()
        }
        if (typeof remote.primaryColor === 'string' && hexColorRegex.test(remote.primaryColor)) {
          synced.primaryColor = remote.primaryColor
        }
      }
    } catch (err) {
      // A dead or unreachable brand URL shouldn't undo tenant creation — the
      // tenant is still valid, it just falls back to default branding.
      syncError = err instanceof Error ? err.message : 'Brand sync failed'
      payload.logger.warn(`[tenants] brand sync failed for "${slug}": ${syncError}`)
    }
  }

  try {
    await payload.create({
      collection: 'settings',
      context: { disableRevalidate: true },
      data: {
        brandSyncUrl: sourceUrl,
        // primaryColor is required on Settings, so always supply one — the
        // synced brand color when we resolved it, otherwise the house default.
        primaryColor: synced.primaryColor || '#dc2626',
        siteName: synced.siteName || name,
        tenant: tenant.id,
      },
    })
  } catch (err) {
    // Roll back the tenant rather than leave one with no settings behind.
    await payload
      .delete({ collection: 'tenants', id: tenant.id, context: { disableRevalidate: true } })
      .catch(() => undefined)

    return NextResponse.json(
      { error: `Failed to create tenant settings: ${err instanceof Error ? err.message : 'unknown error'}` },
      { status: 500 },
    )
  }

  try {
    await ensureDefaultTenantContent(payload, tenant.id)
  } catch (err) {
    // Non-fatal: the tenant and its branding are already valid without the
    // standard About/Contact pages and nav — just log so it can be retried.
    payload.logger.warn(
      `[tenants] failed to seed default content for "${slug}": ${err instanceof Error ? err.message : 'unknown error'}`,
    )
  }

  return NextResponse.json({
    brandSync: sourceUrl ? { error: syncError, ...synced } : null,
    tenant: { id: tenant.id, name: tenant.name, slug: tenant.slug },
  })
}
