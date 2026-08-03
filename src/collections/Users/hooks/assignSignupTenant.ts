import type { CollectionBeforeChangeHook } from 'payload'

import { resolveTenant } from '@/utilities/getTenant'

/**
 * The multi-tenant plugin wraps every access key (create/read/update/delete)
 * on tenant-scoped collections so that a non-admin user with an EMPTY
 * `tenants` array gets flatly denied — not just filtered to nothing, denied
 * outright (see withTenantAccess.js: "User with no tenants should have no
 * access to tenant-scoped documents").
 *
 * Self-registered accounts (the public /signup flow — see Users.access.create
 * = anyone) never had anything populate that `tenants` array, so every
 * reader was permanently locked out of every tenant-scoped collection,
 * including creating their own Reviews — the account existed and could log
 * in, but literally nothing else worked. This assigns the tenant the signup
 * request came from (via the Host header), so a new reader can act within
 * the site they actually signed up on.
 *
 * Only fires when `tenants` wasn't already provided, so it never overrides
 * an explicit assignment (e.g. an admin creating staff in /admin and picking
 * tenants there).
 */
export const assignSignupTenant: CollectionBeforeChangeHook = async ({ data, operation, req }) => {
  if (operation === 'create' && (!data.tenants || data.tenants.length === 0)) {
    const tenant = await resolveTenant(req.headers.get('host'))

    if (tenant) {
      data.tenants = [{ tenant: tenant.id }]
    }
  }

  return data
}
