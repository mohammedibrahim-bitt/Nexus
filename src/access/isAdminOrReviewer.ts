type IsAdminOrReviewer = (args: any) => boolean

export const isAdminOrReviewer: IsAdminOrReviewer = ({ req: { user } }) => {
  return Boolean(
    user && user.collection === 'users' && (user.role === 'admin' || user.role === 'reviewer'),
  )
}
