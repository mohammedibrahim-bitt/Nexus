import type { Access, Where } from 'payload'

import type { User } from '@/payload-types'

import { usersSharingTenantWhere } from './permissions'

// Used by Users' `update` access. super_admin can update anyone. The
// tenant-scoped `admin` can update anyone sharing a tenant with them, or
// themselves — but never escalate a role or reassign someone outside their
// own tenant(s); that boundary is enforced in
// `enforceTenantAdminBoundaries.ts` (a beforeChange hook, since it's a
// cross-field invariant an access function's Where clause can't express).
// Everyone else can only update their own record.
export const isAdminOrSelf: Access<User> = ({ req: { user } }) => {
  if (!user || user.collection !== 'users') return false
  if (user.role === 'super_admin') return true

  if (user.role === 'admin') {
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
