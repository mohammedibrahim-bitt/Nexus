import type { Access, Where } from 'payload'

import { isTenantManagerRole } from './permissions'

// Used by Posts' `read` access. Anyone can self-register as an author (see
// the Users collection), so "is there a user at all" is not a trust
// signal — only super_admin/tenant-admin/reviewers get blanket visibility
// into drafts (a tenant-admin's blanket visibility is itself narrowed to
// their own tenant by the multi-tenant plugin's `withTenantAccess` wrapper).
// Plain authors additionally see their own drafts (powers the "My Posts"
// dashboard and post editor), everyone else only sees published posts.
export const authenticatedOrPublished: Access = ({ req: { user } }) => {
  if (isTenantManagerRole(user) || (user && user.collection === 'users' && user.role === 'reviewer')) {
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
