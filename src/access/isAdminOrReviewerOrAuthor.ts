import type { Access } from 'payload'

import type { Post } from '@/payload-types'

/**
 * Admins and reviewers can update/delete any post (reviewers need this to
 * do their job). Authors can only update/delete posts they're credited on
 * — enforced as a query constraint, not just a UI restriction, so it holds
 * even against a direct REST/local-API call for another author's post.
 */
export const isAdminOrReviewerOrAuthor: Access<Post> = ({ req: { user } }) => {
  if (!user || user.collection !== 'users') return false
  if (user.role === 'admin' || user.role === 'reviewer') return true

  return {
    authors: {
      contains: user.id,
    },
  }
}
