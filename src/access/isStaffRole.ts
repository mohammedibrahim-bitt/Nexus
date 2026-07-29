import type { Access } from 'payload'

// True for admin/author/reviewer — the roles an admin has explicitly
// granted content responsibilities to. `reader` is the public self-signup
// default and cannot create content, even though they're a normal
// authenticated user of the same `users` collection.
export const isStaffRole: Access = ({ req: { user } }) => {
  return Boolean(
    user &&
      user.collection === 'users' &&
      (user.role === 'admin' || user.role === 'author' || user.role === 'reviewer'),
  )
}
