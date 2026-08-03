import type { Access, Where } from 'payload'

// Used by Posts' `read` access. Anyone can self-register as an author (see
// the Users collection), so "is there a user at all" is not a trust
// signal — only admins/reviewers get blanket visibility into drafts.
// Plain authors additionally see their own drafts (powers the "My Posts"
// dashboard and post editor), everyone else only sees published posts.
export const authenticatedOrPublished: Access = ({ req: { user } }) => {
  if (user && user.collection === 'users' && (user.role === 'admin' || user.role === 'reviewer')) {
    return true
  }

  if (user && user.collection === 'users') {
    const result: Where = {
      or: [{ _status: { equals: 'published' } }, { authors: { contains: user.id } }],
    }
    return result
  }

  const result: Where = {
    _status: {
      equals: 'published',
    },
  }
  return result
}
