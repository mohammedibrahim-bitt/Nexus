export const isAdmin = ({ req }: any): boolean => {
  const user = req?.user
  return Boolean(user && user.collection === 'users' && user.role === 'admin')
}
