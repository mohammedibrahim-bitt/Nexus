import type { CollectionConfig } from 'payload'

export const Customers: CollectionConfig = {
  slug: 'customers',
  access: {
    admin: () => false,
    create: () => true,
    delete: ({ req: { user } }) => Boolean(user && user.collection === 'users'),
    read: ({ req: { user } }) => {
      if (user && user.collection === 'users') return true
      if (user && user.collection === 'customers') {
        return {
          id: {
            equals: user.id,
          },
        }
      }
      return false
    },
    update: ({ req: { user }, id }) => {
      if (user && user.collection === 'users') return true
      if (user && user.collection === 'customers') return user.id === id
      return false
    },
  },
  admin: {
    defaultColumns: ['name', 'email'],
    // Managing reader/customer accounts is an admin-only concern.
    hidden: ({ user }) => user?.role !== 'admin',
    useAsTitle: 'name',
  },
  auth: true,
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
  ],
  timestamps: true,
}
