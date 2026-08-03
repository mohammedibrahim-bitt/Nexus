'use client'

import React, { useCallback, useState } from 'react'
import { Button, toast, useAuth } from '@payloadcms/ui'
import { useRouter } from 'next/navigation'

import './index.scss'

const slugify = (value: string): string =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 63)

/**
 * "Create from URL" panel above the Tenants list. Spins up a tenant, its
 * per-tenant Settings document, and runs brand sync in one step.
 *
 * Rendering is gated on the admin role, but that is only a convenience — the
 * /api/tenants/create-from-url route re-checks the role server-side, which is
 * the actual security boundary.
 */
export const CreateTenantFromURL: React.FC = () => {
  const { user } = useAuth()
  const router = useRouter()

  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [slugTouched, setSlugTouched] = useState(false)
  const [sourceUrl, setSourceUrl] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<null | string>(null)

  const onNameChange = useCallback(
    (value: string) => {
      setName(value)
      if (!slugTouched) setSlug(slugify(value))
    },
    [slugTouched],
  )

  const onSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      if (submitting) return

      setError(null)
      setSubmitting(true)

      try {
        const res = await fetch('/api/tenants/create-from-url', {
          body: JSON.stringify({ name, slug, sourceUrl: sourceUrl || undefined }),
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          method: 'POST',
        })

        const data = await res.json()

        if (!res.ok) {
          setError(data?.error || 'Failed to create tenant.')
          return
        }

        toast.success(
          data?.brandSync?.siteName
            ? `Created "${data.tenant.slug}" — branding synced as "${data.brandSync.siteName}".`
            : `Created tenant "${data.tenant.slug}".`,
        )

        if (data?.brandSync?.error) {
          toast.error(`Tenant created, but brand sync failed: ${data.brandSync.error}`)
        }

        setName('')
        setSlug('')
        setSlugTouched(false)
        setSourceUrl('')
        router.refresh()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to create tenant.')
      } finally {
        setSubmitting(false)
      }
    },
    [name, router, slug, sourceUrl, submitting],
  )

  if (!user || user.role !== 'admin') return null

  return (
    <div className="createTenantFromURL">
      <h4 className="createTenantFromURL__heading">Create a tenant from a URL</h4>
      <p className="createTenantFromURL__description">
        Sets up the subdomain, its own isolated content, and its Settings document — then reads
        branding (name, color, logo) straight from the source site, so the new subdomain is branded
        on first load.
      </p>

      <form onSubmit={onSubmit}>
        <div className="createTenantFromURL__row">
          <div className="createTenantFromURL__field">
            <label className="createTenantFromURL__label" htmlFor="tenant-name">
              Name
            </label>
            <input
              className="createTenantFromURL__input"
              id="tenant-name"
              onChange={(e) => onNameChange(e.target.value)}
              placeholder="Acme Insights"
              required
              value={name}
            />
          </div>

          <div className="createTenantFromURL__field">
            <label className="createTenantFromURL__label" htmlFor="tenant-slug">
              Subdomain
            </label>
            <input
              className="createTenantFromURL__input"
              id="tenant-slug"
              onChange={(e) => {
                setSlugTouched(true)
                setSlug(e.target.value)
              }}
              placeholder="acme"
              required
              value={slug}
            />
          </div>

          <div className="createTenantFromURL__field">
            <label className="createTenantFromURL__label" htmlFor="tenant-source">
              Brand source URL (optional)
            </label>
            <input
              className="createTenantFromURL__input"
              id="tenant-source"
              onChange={(e) => setSourceUrl(e.target.value)}
              placeholder="https://acme.com"
              type="url"
              value={sourceUrl}
            />
          </div>
        </div>

        <div className="createTenantFromURL__actions">
          <Button buttonStyle="primary" disabled={submitting} size="small" type="submit">
            {submitting ? 'Creating…' : 'Create tenant'}
          </Button>
          {error && <p className="createTenantFromURL__error">{error}</p>}
        </div>
      </form>
    </div>
  )
}
