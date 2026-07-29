import type { CollectionConfig } from 'payload'

import { isAdmin } from '../../access/isAdmin'
import { isAdminOrReviewer } from '../../access/isAdminOrReviewer'

export const Reviews: CollectionConfig = {
  slug: 'reviews',
  access: {
    create: ({ req: { user } }) => Boolean(user && user.collection === 'users'),
    delete: isAdmin,
    read: ({ req: { user } }) => {
      // Moderation visibility is role-based, not just "any signed-in
      // account" — anyone can self-register as an author, so plain authors
      // (and the public) only ever see approved reviews.
      if (user && (user.role === 'admin' || user.role === 'reviewer')) return true
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
        description: 'Only approved reviews are shown publicly.',
        position: 'sidebar',
      },
      defaultValue: false,
    },
  ],
  hooks: {
    beforeChange: [
      ({ req, data, operation }) => {
        if (operation === 'create' && req.user && req.user.collection === 'users') {
          data.customer = req.user.id
        }
        return data
      },
    ],
  },
  timestamps: true,
}
