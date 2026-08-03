import type { Access } from 'payload'

// Used by Pages' `read` access. Pages are site structure (About, Home,
// etc.), not author content, so — unlike Posts — there is no "your own
// draft" carve-out here: only admins can see unpublished pages.
export const publishedOrAdmin: Access = ({ req: { user } }) => {
  if (user && user.collection === 'users' && user.role === 'admin') {
    return true
  }

  return {
    _status: {
      equals: 'published',
    },
  }
}
