import type { AccessArgs } from 'payload'

import type { User } from '@/payload-types'

type IsAdminOrReviewer = (args: AccessArgs<User>) => boolean

export const isAdminOrReviewer: IsAdminOrReviewer = ({ req: { user } }) => {
  return Boolean(
    user && user.collection === 'users' && (user.role === 'admin' || user.role === 'reviewer'),
  )
}
