import type { CollectionConfig } from 'payload'

import { getServerSideURL } from '../../utilities/getURL'

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
  auth: {
    // Both links point at frontend pages (customers can never reach /admin),
    // not Payload's default admin-panel verify/reset routes.
    forgotPassword: {
      generateEmailHTML: ({ token, user }) => {
        const url = `${getServerSideURL()}/reset-password?token=${token}`
        return `<p>Hi ${user?.name || ''},</p><p>Click the link below to reset your password:</p><p><a href="${url}">${url}</a></p><p>If you didn't request this, you can ignore this email.</p>`
      },
      generateEmailSubject: () => 'Reset your password',
    },
    verify: {
      generateEmailHTML: ({ token, user }) => {
        const url = `${getServerSideURL()}/verify?token=${token}`
        return `<p>Hi ${user?.name || ''},</p><p>Click the link below to verify your account:</p><p><a href="${url}">${url}</a></p>`
      },
      generateEmailSubject: () => 'Verify your account',
    },
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
  ],
  timestamps: true,
}
