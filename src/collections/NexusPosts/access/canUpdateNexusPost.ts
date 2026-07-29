import type { Where } from 'payload'

// Admins can edit or decide on anything. Reviewers can review pending posts.
// Users and authors can only edit their own post while it's still pending —
// once approved/rejected it's locked to them (the `status` field itself is
// separately admin/reviewer-only, so they can never approve themselves).
export const canUpdateNexusPost = ({ req }: any): boolean | Where => {
  const user = req?.user
  if (!user || user.collection !== 'users') return false
  if (user.role === 'admin') return true

  if (user.role === 'reviewer') {
    return {
      and: [{ status: { equals: 'pending' } }],
    }
  }

  if (user.role === 'author' || user.role === 'user') {
    return {
      and: [{ author: { equals: user.id } }, { status: { equals: 'pending' } }],
    }
  }

  return false
}
