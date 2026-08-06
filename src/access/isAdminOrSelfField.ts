import type { FieldAccess } from 'payload'

import type { User } from '@/payload-types'

import { isSuperAdmin, userTenantIds } from './permissions'

/**
 * Field-level version of isAdminOrSelf — restricts a field (e.g. a personal
 * API key) so only the owning user, a super_admin, or a tenant-admin who
 * shares a tenant with the target user can read/update it, even though the
 * Users collection itself is readable by any authenticated user.
 *
 * These are per-user secrets (SerpApi/AI provider keys), so — unlike other
 * "tenant manager" checks — a tenant-scoped `admin` only gets access to
 * *another* user's key when that user is actually in one of their tenants,
 * checked against `doc` (the target user being read/updated) rather than a
 * blanket isTenantManagerRole allow, which would otherwise leak every
 * tenant's users' secrets to every tenant admin.
 */
export const isAdminOrSelfField: FieldAccess<User> = ({ doc, id, req: { user } }) => {
  if (!user || user.collection !== 'users') return false
  if (isSuperAdmin(user)) return true
  if (user.id === id) return true

  if (user.role === 'admin' && doc) {
    const requesterTenantIds = userTenantIds(user)
    const targetTenantIds = userTenantIds(doc)
    return targetTenantIds.some((tenantId) => requesterTenantIds.includes(tenantId))
  }

  return false
}
