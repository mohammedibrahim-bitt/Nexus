import type { Access } from 'payload'

// Public visitors only ever see approved posts; any signed-in staff member
// (author/reviewer/admin) can see everything, including pending/rejected
// drafts — mirrors `authenticatedOrPublished` on the main Posts collection.
export const canReadNexusPost: Access = ({ req: { user } }) => {
  if (user) return true

  return {
    status: {
      equals: 'approved',
    },
  }
}
