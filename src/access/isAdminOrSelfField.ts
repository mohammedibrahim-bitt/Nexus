import type { FieldAccess } from 'payload'

import type { User } from '@/payload-types'

/**
 * Field-level version of isAdminOrSelf — restricts a field (e.g. a personal
 * API key) so only the owning user or an admin can read/update it, even
 * though the Users collection itself is readable by any authenticated user.
 */
export const isAdminOrSelfField: FieldAccess<User> = ({ id, req: { user } }) => {
  if (!user || user.collection !== 'users') return false
  if (user.role === 'admin') return true
  return user.id === id
}
