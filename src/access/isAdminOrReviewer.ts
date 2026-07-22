export const isAdminOrReviewer = ({ req }: any): boolean => {
  const user = req?.user
  return Boolean(
    user && user.collection === 'users' && (user.role === 'admin' || user.role === 'reviewer'),
  )
}
