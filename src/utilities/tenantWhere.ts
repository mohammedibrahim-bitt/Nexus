import type { Where } from 'payload'

/**
 * The tenant constraint every frontend query must carry.
 *
 * Filters on the tenant's **id**, not `tenant.slug`. Payload rejects the
 * relationship-subfield form here ("The following path cannot be queried:
 * slug"), and matching on the foreign key is a plain indexed comparison rather
 * than a join. Resolve the route's `[tenantDomain]` param to a tenant first
 * with `requireTenant`, then pass `tenant.id`.
 *
 * Compose into a larger query with `and`:
 *   where: { and: [tenantWhere(tenant.id), { _status: { equals: 'published' } }] }
 */
export const tenantWhere = (tenantId: number | string): Where => ({
  tenant: { equals: tenantId },
})
