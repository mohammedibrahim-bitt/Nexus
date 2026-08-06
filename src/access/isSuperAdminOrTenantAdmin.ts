import type { Access } from 'payload'

import type { User } from '@/payload-types'

import { usersSharingTenantWhere } from './permissions'

/**
 * Used by Users' `delete` access. super_admin can delete anyone; a
 * tenant-scoped `admin` can only delete users sharing a tenant with them
 * (no self-delete carve-out — that matches the prior admin-only behavior,
 * which never allowed self-delete either). Everyone else: no delete access.
 */
export const isSuperAdminOrTenantAdmin: Access<User> = ({ req: { user } }) => {
  if (!user || user.collection !== 'users') return false
  if (user.role === 'super_admin') return true
  if (user.role === 'admin') return usersSharingTenantWhere(user)
  return false
}
