import type { Access, Where } from 'payload'

import type { User } from '@/payload-types'

import { usersSharingTenantWhere } from './permissions'

// Staff (super_admin/admin/author/reviewer) can browse the user directory —
// needed to assign post authors/reviewers. super_admin sees everyone;
// everyone else (including the tenant-scoped `admin`) only sees users who
// share a tenant with them, or their own record — Users isn't a
// plugin-managed collection, so this tenant filtering has to be hand-written
// (see usersSharingTenantWhere). A reader can only read their own record.
export const isStaffOrSelf: Access<User> = ({ req: { user } }) => {
  if (!user || user.collection !== 'users') return false
  if (user.role === 'super_admin') return true

  if (user.role === 'admin' || user.role === 'author' || user.role === 'reviewer') {
    const result: Where = { or: [{ id: { equals: user.id } }, usersSharingTenantWhere(user)] }
    return result
  }

  const result: Where = {
    id: {
      equals: user.id,
    },
  }
  return result
}
