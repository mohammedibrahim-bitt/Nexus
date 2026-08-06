import type { Access } from 'payload'

import type { Post } from '@/payload-types'

import { isTenantManagerRole } from './permissions'

/**
 * super_admin and the tenant-scoped admin can update/delete any post in
 * their scope, and reviewers can update/delete any post (they need this to
 * do their job). Authors can only update/delete posts they're credited on
 * — enforced as a query constraint, not just a UI restriction, so it holds
 * even against a direct REST/local-API call for another author's post.
 */
export const isAdminOrReviewerOrAuthor: Access<Post> = ({ req: { user } }) => {
  if (!user || user.collection !== 'users') return false
  if (isTenantManagerRole(user) || user.role === 'reviewer') return true

  return {
    authors: {
      contains: user.id,
    },
  }
}
