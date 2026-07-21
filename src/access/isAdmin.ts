import type { AccessArgs } from 'payload'

import type { User } from '@/payload-types'

type IsAdmin = (args: AccessArgs<User>) => boolean

export const isAdmin: IsAdmin = ({ req: { user } }) => {
  return Boolean(user && user.collection === 'users' && user.role === 'admin')
}
