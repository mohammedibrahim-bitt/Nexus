import type { Where } from 'payload'

// Admins can edit or decide on anything. Authors can only edit their own
// post, and only while it's still pending — once approved/rejected it's
// locked to them (the `status` field itself is separately admin-only, so an
// author editing their own pending post can never approve themselves).
export const canUpdateNexusPost = ({ req }: any): boolean | Where => {
  const user = req?.user
  if (!user || user.collection !== 'users') return false
  if (user.role === 'admin') return true

  if (user.role === 'author') {
    return {
      and: [{ author: { equals: user.id } }, { status: { equals: 'pending' } }],
    }
  }

  return false
}
