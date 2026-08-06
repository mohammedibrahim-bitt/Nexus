import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { headers as getHeaders } from 'next/headers'
import { notFound } from 'next/navigation'
import React from 'react'

import { getPublicUrl } from '@/utilities/clone/storage'

/**
 * Admin-only preview of a cloned shell before it can be published.
 *
 * The whole point of the quality gate: a pixel score can tell you the CSS
 * loaded, but only a person can tell you the mobile nav is dead. Nothing
 * reaches a live subdomain without someone opening this first.
 *
 * Deliberately at /admin-preview rather than nested under /admin: Payload's
 * `admin/[[...segments]]` optional catch-all swallows every path beneath it,
 * so a route at /admin/tenants/{id}/preview never executes. The `admin` prefix
 * still keeps it out of the tenant-subdomain middleware rewrite.
 *
 * Admin-gated server-side — a plain Next route, so it does its own auth rather
 * than inheriting Payload's.
 */

type Args = { params: Promise<{ id: string }> }

export default async function ShellPreviewPage({ params }: Args) {
  const { id } = await params

  const payload = await getPayload({ config: configPromise })
  const headers = await getHeaders()
  const { user } = await payload.auth({ headers })

  if (!user || user.collection !== 'users' || user.role !== 'super_admin') {
    // 404 rather than a redirect — don't confirm the route exists to a non-admin.
    notFound()
  }

  const tenant = await payload.findByID({
    id,
    collection: 'tenants',
    depth: 0,
    disableErrors: true,
  })

  if (!tenant) notFound()

  if (!tenant.shellHtmlPath) {
    return (
      <div style={{ fontFamily: 'system-ui', padding: 32 }}>
        <h1>No shell to preview</h1>
        <p>
          <strong>{tenant.name}</strong> has no stored clone. Run a clone from the tenant’s edit
          view first.
        </p>
      </div>
    )
  }

  const shellUrl = getPublicUrl(tenant.shellHtmlPath)
  const threshold = tenant.qaThreshold ?? 85
  const score = tenant.qaScore
  const below = typeof score === 'number' && score < threshold

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <header
        style={{
          background: below ? '#4a3209' : '#111',
          color: '#fff',
          flexShrink: 0,
          fontFamily: 'system-ui',
          padding: '12px 20px',
        }}
      >
        <div style={{ fontSize: 15, fontWeight: 700 }}>
          Preview — {tenant.name} ({tenant.cloneStatus})
        </div>
        <div style={{ fontSize: 13, opacity: 0.85 }}>
          QA similarity {typeof score === 'number' ? `${score}%` : '—'} vs threshold {threshold}%
          {below && ' — below threshold; brand-only fallback recommended'}
        </div>
        <div style={{ fontSize: 13, marginTop: 6 }}>
          Not live. Approve from the tenant’s edit view to publish.{' '}
          {tenant.shellScreenshotPath && (
            <a
              href={getPublicUrl(tenant.diffScreenshotPath || tenant.shellScreenshotPath)}
              rel="noopener noreferrer"
              style={{ color: '#9ec1ff' }}
              target="_blank"
            >
              View pixel diff
            </a>
          )}
        </div>
      </header>

      {/* Sandboxed: the shell is third-party markup, and any surviving script
          shouldn't get access to the admin session it's being previewed from. */}
      <iframe
        sandbox="allow-same-origin"
        src={shellUrl}
        style={{ border: 0, flex: 1, width: '100%' }}
        title={`Clone preview for ${tenant.name}`}
      />
    </div>
  )
}
