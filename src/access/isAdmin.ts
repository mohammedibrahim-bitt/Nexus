type IsAdmin = (args: any) => boolean

export const isAdmin: IsAdmin = ({ req: { user } }) => {
  return Boolean(user && user.collection === 'users' && user.role === 'admin')
}
