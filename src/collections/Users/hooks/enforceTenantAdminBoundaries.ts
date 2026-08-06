import type { CollectionBeforeChangeHook } from 'payload'
import { APIError } from 'payload'

import { userTenantIds } from '@/access/permissions'

/**
 * Access functions (`isAdminOrSelf`, `isStaffOrSelf`, `isSuperAdminOrTenantAdmin`)
 * already confine a tenant-scoped `admin` to same-tenant users for
 * read/update/delete. What they can't express is a *cross-field* invariant —
 * "the role you're writing," "whether you're editing yourself," "which
 * tenant you're assigning" — those all depend on the incoming `data`, not
 * just which document is being targeted. Hence a beforeChange hook, the
 * same pattern already used for `assignSignupTenant.ts`.
 *
 * Only constrains the tenant-scoped `admin` role. super_admin (and the
 * collection's own access control denying everyone else from reaching
 * `create`/`update` on the `role`/`tenants` fields at all) are unaffected.
 */
export const enforceTenantAdminBoundaries: CollectionBeforeChangeHook = async ({
  data,
  operation,
  originalDoc,
  req,
}) => {
  const actor = req.user

  if (!actor || actor.collection !== 'users' || actor.role !== 'admin') {
    return data
  }

  if (data.role === 'super_admin') {
    throw new APIError('Only a Super Admin can grant the Super Admin role.', 403)
  }

  // No self-role-changes for a tenant admin, including to their own current
  // role — prevents both self-promotion and a tenant admin locking
  // themselves into a different role by accident.
  if (
    operation === 'update' &&
    originalDoc &&
    String(originalDoc.id) === String(actor.id) &&
    'role' in data &&
    data.role !== originalDoc.role
  ) {
    throw new APIError('You cannot change your own role.', 403)
  }

  if (data.tenants) {
    const actorTenantIds = userTenantIds(actor)
    const targetTenantIds = (data.tenants as Array<{ tenant?: number | { id: number } | string }>)
      .map((row) => (typeof row?.tenant === 'object' ? row.tenant?.id : row?.tenant))
      .filter((id): id is number => typeof id === 'number')

    const assignsOutsideOwnTenants = targetTenantIds.some((id) => !actorTenantIds.includes(id))

    if (assignsOutsideOwnTenants) {
      throw new APIError('You can only assign users to your own tenant.', 403)
    }
  }

  return data
}
