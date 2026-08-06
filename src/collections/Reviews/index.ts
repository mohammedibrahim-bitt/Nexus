import type { CollectionConfig } from 'payload'

import { isTenantManager } from '../../access/isTenantManager'
import { isAdminOrReviewer } from '../../access/isAdminOrReviewer'
import { isTenantManagerRole } from '../../access/permissions'

export const Reviews: CollectionConfig = {
  slug: 'reviews',
  access: {
    create: ({ req: { user } }) => Boolean(user && user.collection === 'users'),
    delete: isTenantManager,
    read: ({ req: { user } }) => {
      // Moderation visibility is role-based, not just "any signed-in
      // account" — anyone can self-register as an author, so plain authors
      // (and the public) only ever see approved reviews.
      if (isTenantManagerRole(user) || user?.role === 'reviewer') return true
      return {
        approved: {
          equals: true,
        },
      }
    },
    // Only an admin or reviewer can approve/reject reviews — a plain author
    // can't moderate reader feedback.
    update: isAdminOrReviewer,
  },
  admin: {
    defaultColumns: ['post', 'customer', 'rating', 'approved', 'createdAt'],
    // Authors have no way to act on reviews, so don't clutter their sidebar with it.
    hidden: ({ user }) => user?.role === 'author',
    useAsTitle: 'comment',
  },
  fields: [
    {
      name: 'post',
      type: 'relationship',
      relationTo: 'posts',
      required: true,
    },
    {
      name: 'customer',
      type: 'relationship',
      admin: {
        readOnly: true,
      },
      relationTo: 'users',
      required: true,
    },
    {
      name: 'rating',
      type: 'number',
      max: 5,
      min: 1,
      required: true,
    },
    {
      name: 'comment',
      type: 'textarea',
      required: true,
    },
    {
      name: 'approved',
      type: 'checkbox',
      admin: {
        description:
          'Reviews are shown publicly as soon as they\'re submitted. Uncheck to hide a specific review.',
        position: 'sidebar',
      },
      defaultValue: true,
    },
  ],
  hooks: {
    beforeChange: [
      async ({ req, data, operation }) => {
        if (operation === 'create' && req.user && req.user.collection === 'users') {
          data.customer = req.user.id
        }

        // Reviews is tenant-scoped, but the field has no admin UI (it's
        // sidebar-only, allowCreate/allowEdit: false — see the multi-tenant
        // plugin's tenantField) and the public review form never sends one.
        // A review belongs to whichever tenant the post it's on belongs to,
        // not necessarily the reviewer's own tenant — a reader could review
        // a post on a tenant they're not "assigned" to at all. Always
        // re-derived from the post, even if `data.tenant` was already
        // (explicitly) set — Reviews' `create` access has no tenant
        // restriction of its own (any authenticated user), so a client
        // supplying a mismatched tenant must never be trusted over the
        // actual post it's attached to.
        if (operation === 'create' && data.post) {
          const postId = typeof data.post === 'object' ? data.post.id : data.post
          const post = await req.payload.findByID({
            id: postId,
            collection: 'posts',
            depth: 0,
            req,
          })

          if (post?.tenant) {
            data.tenant = typeof post.tenant === 'object' ? post.tenant.id : post.tenant
          }
        }

        return data
      },
    ],
  },
  timestamps: true,
}
