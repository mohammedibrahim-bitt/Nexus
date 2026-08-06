import { isTenantManagerRole } from './permissions'

type IsAdminOrReviewer = (args: any) => boolean

export const isAdminOrReviewer: IsAdminOrReviewer = ({ req: { user } }) => {
  return isTenantManagerRole(user) || Boolean(user && user.collection === 'users' && user.role === 'reviewer')
}
