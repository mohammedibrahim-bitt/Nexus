import type { Tenant } from '@/payload-types'

import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { headers as getHeaders } from 'next/headers'
import { notFound } from 'next/navigation'
import { unstable_cache } from 'next/cache'

import { DEFAULT_TENANT_SLUG as DEFAULT_SLUG } from './tenantConstants'

// Re-exported for convenience so Node-side callers have a single import, but
// defined in a leaf module that the Edge middleware can also import safely.
export { DEFAULT_TENANT_SLUG } from './tenantConstants'

/*
 * Tenant lookups intentionally run with the Local API's default
 * `overrideAccess: true`. The `tenants` collection restricts `read` to staff so
 * the REST surface stays locked down, but host->tenant resolution has to work
 * for anonymous visitors, and it only ever reads routing metadata
 * (name/slug/domain) that is already public by virtue of being in the URL.
 */

async function findTenantBySlug(slug: string): Promise<Tenant | null> {
  const payload = await getPayload({ config: configPromise })

  const { docs } = await payload.find({
    collection: 'tenants',
    depth: 0,
    limit: 1,
    where: { slug: { equals: slug } },
  })

  return docs[0] ?? null
}

async function findTenantByHost(host: string): Promise<Tenant | null> {
  const payload = await getPayload({ config: configPromise })

  // Strip the port — `acme.localhost:3000` and `acme.localhost` are the same
  // tenant — and normalise case, since hostnames are case-insensitive.
  const hostname = host.split(':')[0].toLowerCase()

  // An explicit custom domain wins over the subdomain convention.
  const byDomain = await payload.find({
    collection: 'tenants',
    depth: 0,
    limit: 1,
    where: { domain: { equals: hostname } },
  })

  if (byDomain.docs[0]) return byDomain.docs[0]

  const [subdomain, ...rest] = hostname.split('.')

  // A bare apex host (`example.com`, `localhost`) has no tenant label to read.
  if (rest.length === 0) return null

  return findTenantBySlug(subdomain)
}

export const getCachedTenantBySlug = (slug: string) =>
  unstable_cache(async () => findTenantBySlug(slug), ['tenant_by_slug', slug], {
    tags: [`tenant_slug_${slug}`],
  })

export const getCachedTenantByHost = (host: string) =>
  unstable_cache(async () => findTenantByHost(host), ['tenant_by_host', host], {
    tags: [`tenant_host_${host}`],
  })

/**
 * Resolves the tenant for a request, falling back to the default tenant so the
 * site still renders on a hostname that carries no tenant label.
 */
export async function resolveTenant(hostOrSlug?: null | string): Promise<Tenant | null> {
  if (hostOrSlug) {
    const matched = hostOrSlug.includes('.')
      ? await getCachedTenantByHost(hostOrSlug)()
      : await getCachedTenantBySlug(hostOrSlug)()

    if (matched) return matched
  }

  return getCachedTenantBySlug(DEFAULT_SLUG)()
}

/**
 * Resolves a `[tenantDomain]` route param to its tenant, or renders the 404
 * page when the subdomain doesn't correspond to one. Middleware maps hostnames
 * onto that segment without validating them, so this is where an unknown
 * subdomain actually gets rejected.
 */
export async function requireTenant(tenantDomain: string): Promise<Tenant> {
  const tenant = await getCachedTenantBySlug(tenantDomain)()

  if (!tenant) notFound()

  return tenant
}

/**
 * Resolves the tenant from the incoming request's Host header. Server
 * components only — reading headers opts the caller into dynamic rendering.
 *
 * Routes that render under the `[tenantDomain]` segment should prefer passing
 * their route param to `resolveTenant` directly, which keeps them statically
 * renderable.
 */
export async function getRequestTenant(): Promise<Tenant | null> {
  const headers = await getHeaders()

  return resolveTenant(headers.get('host'))
}
