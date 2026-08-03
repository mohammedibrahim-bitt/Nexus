import type { Access } from 'payload'

import type { User } from '@/payload-types'

export const isAdminOrSelf: Access<User> = ({ req: { user } }) => {
  if (!user || user.collection !== 'users') return false
  if (user.role === 'admin') return true

  return {
    id: {
      equals: user.id,
    },
  }
}
