import type { Access } from 'payload'

import type { User } from '@/payload-types'

// Staff (admin/author/reviewer) can browse the user directory — needed to
// assign post authors/reviewers. A reader can only read their own record.
export const isStaffOrSelf: Access<User> = ({ req: { user } }) => {
  if (!user || user.collection !== 'users') return false
  if (user.role === 'admin' || user.role === 'author' || user.role === 'reviewer') return true

  return {
    id: {
      equals: user.id,
    },
  }
}
