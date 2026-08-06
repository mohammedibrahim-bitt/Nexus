import type { Access } from 'payload'

import { isTenantManagerRole } from './permissions'

// Used by Pages' `read` access. Pages are site structure (About, Home,
// etc.), not author content, so — unlike Posts — there is no "your own
// draft" carve-out here: only super_admin/tenant-admin can see unpublished
// pages. (A tenant-admin's visibility into a specific tenant's drafts is
// still narrowed to their own tenant by the multi-tenant plugin's
// `withTenantAccess` wrapper on this collection.)
export const publishedOrAdmin: Access = ({ req: { user } }) => {
  if (isTenantManagerRole(user)) {
    return true
  }

  return {
    _status: {
      equals: 'published',
    },
  }
}
