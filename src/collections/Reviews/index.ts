import type { CollectionConfig } from 'payload'

import { isAdmin } from '../../access/isAdmin'
import { isAdminOrReviewer } from '../../access/isAdminOrReviewer'

export const Reviews: CollectionConfig = {
  slug: 'reviews',
  access: {
    create: ({ req: { user } }) => Boolean(user && user.collection === 'customers'),
    delete: isAdmin,
    read: ({ req: { user } }) => {
      if (user && user.collection === 'users') return true
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
    hidden: ({ user }) => user?.role === 'author' || user?.role === 'user',
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
      relationTo: 'customers',
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
        if (operation === 'create' && req.user && req.user.collection === 'customers') {
          data.customer = req.user.id
        }
        return data
      },
    ],
  },
  timestamps: true,
}
