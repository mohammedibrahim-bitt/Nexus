import type { CollectionBeforeChangeHook } from 'payload'
import { APIError } from 'payload'

import { userTenantIds } from '@/access/permissions'

/**
 * Closes a gap in `@payloadcms/plugin-multi-tenant`'s `withTenantAccess`:
 * for `read`/`update`/`delete`, a non-super_admin's returned constraint is a
 * `Where` clause that Payload applies as a query filter against *existing*
 * rows — real enforcement. For `create`, there's no existing row to filter;
 * Payload's `executeAccess` (`node_modules/payload/dist/auth/executeAccess.js`)
 * only checks the result is truthy, and a `Where` object is truthy. So a
 * tenant-scoped user's create access silently resolves to "allowed," with
 * nothing stopping them from setting `tenant` to a tenant they don't belong
 * to at all — verified directly against a running server: a tenant-admin's
 * plain `POST /api/posts` with `tenant: <another tenant's id>` succeeded.
 * This predates the tenant-admin role — `author`/`reviewer` had the same
 * exposure, just never exercised.
 *
 * Attach to `hooks.beforeChange` on every collection carrying a plain
 * `tenant` relationship (not `Reviews`, whose tenant is deliberately derived
 * from the referenced Post in its own hook, not the submitting user — a
 * bare reader with no tenant of their own can still leave a review; and not
 * `form-submissions`, same reasoning, derived from the referenced Form).
 * super_admin is completely unrestricted, matching `userHasAccessToAllTenants`.
 */
export const enforceTenantOwnership: CollectionBeforeChangeHook = ({ data, operation, req }) => {
  const user = req.user

  if (!user || user.collection !== 'users' || user.role === 'super_admin') {
    return data
  }

  const allowedTenantIds = userTenantIds(user)
  const requestedTenantId = typeof data.tenant === 'object' ? data.tenant?.id : data.tenant

  if (requestedTenantId !== undefined && requestedTenantId !== null) {
    if (!allowedTenantIds.includes(Number(requestedTenantId))) {
      throw new APIError('You can only create or modify content in your own tenant.', 403)
    }
    return data
  }

  // No tenant supplied at all (e.g. a bare API call, or a collection whose
  // admin UI doesn't surface the tenant field) — default to the user's own,
  // same fallback assignSignupTenant.ts already uses for the Users collection.
  if (operation === 'create' && allowedTenantIds.length > 0) {
    data.tenant = allowedTenantIds[0]
  }

  return data
}
