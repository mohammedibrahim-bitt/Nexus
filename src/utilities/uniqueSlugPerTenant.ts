import type { Validate } from 'payload'

/**
 * Payload's `slugField()` applies a plain `unique: true` DB constraint by
 * default — a single global index across every tenant. For a tenant-scoped
 * collection that rejects perfectly valid data: two different tenants both
 * naming a page "home" (the single most common slug in the app) would
 * collide, even though they're on entirely different subdomains.
 *
 * The fix is two-part:
 *   1. `slugField({ disableUnique: true })` at each call site, dropping the
 *      DB-level constraint.
 *   2. This validator, scoping "is this slug already taken" to the document's
 *      own tenant instead of the whole table.
 *
 * Use as the slug field's `validate` — see Pages/Posts/Categories/Tags.
 */
export const uniqueSlugPerTenant =
  (collectionSlug: 'pages' | 'posts' | 'categories' | 'tags'): Validate =>
  async (value, { id, data, req }) => {
    if (!value) return true

    const tenantId = typeof data?.tenant === 'object' ? data?.tenant?.id : data?.tenant

    // No tenant assigned yet (e.g. mid-creation via the Local API in a
    // multi-step script) — nothing to scope against, so defer to the
    // collection's own required-field validation instead of blocking here.
    if (!tenantId) return true

    const { totalDocs } = await req.payload.count({
      collection: collectionSlug,
      req,
      where: {
        and: [
          { tenant: { equals: tenantId } },
          { slug: { equals: value } },
          ...(id ? [{ id: { not_equals: id } }] : []),
        ],
      },
    })

    return totalDocs === 0 || 'Another document in this tenant already uses this slug.'
  }
