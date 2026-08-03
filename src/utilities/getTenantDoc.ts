import type { Config } from '@/payload-types'

import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { unstable_cache } from 'next/cache'

import { tenantCacheTag } from './tenantCacheTag'

/**
 * The collections that behave as per-tenant singletons (registered with the
 * multi-tenant plugin's `isGlobal: true`). These were Payload Globals before
 * multi-tenancy; this module is the tenant-aware replacement for the old
 * `getCachedGlobal` helper.
 */
export type TenantGlobalSlug = 'footer' | 'header' | 'settings'

type TenantGlobalDoc<T extends TenantGlobalSlug> = Config['collections'][T]

async function getTenantDoc<T extends TenantGlobalSlug>(
  slug: T,
  tenantId: number | string,
  depth = 0,
): Promise<null | TenantGlobalDoc<T>> {
  const payload = await getPayload({ config: configPromise })

  const { docs } = await payload.find({
    collection: slug,
    depth,
    limit: 1,
    where: { tenant: { equals: tenantId } },
  })

  return (docs[0] as TenantGlobalDoc<T>) ?? null
}

/**
 * Tenant-scoped equivalent of the old `getCachedGlobal`. The cache key and tag
 * both include the tenant, so one tenant's edit never busts another's pages —
 * the invalidating hooks build the same tag via `tenantCacheTag`.
 */
export const getCachedTenantDoc = <T extends TenantGlobalSlug>(
  slug: T,
  tenantId: number | string,
  depth = 0,
) =>
  unstable_cache(async () => getTenantDoc<T>(slug, tenantId, depth), [slug, String(tenantId), String(depth)], {
    tags: [tenantCacheTag(slug, tenantId)],
  })
