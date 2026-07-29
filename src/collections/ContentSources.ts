import type { CollectionConfig } from 'payload'

import { isAdmin } from '../access/isAdmin'

export const ContentSources: CollectionConfig = {
  slug: 'content-sources',
  access: {
    create: isAdmin,
    delete: isAdmin,
    read: isAdmin,
    update: isAdmin,
  },
  admin: {
    defaultColumns: ['name', 'feedUrl', 'active', 'lastFetchStatus'],
    description:
      'External RSS/Atom feeds to pull new articles from. Add a source, then trigger a sync from POST /api/sync-content-sources (protected by CRON_SECRET, or works automatically for logged-in admins) — wire an external cron to that URL to check on a schedule.',
    group: 'Site',
    hidden: ({ user }) => user?.role !== 'admin',
    useAsTitle: 'name',
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      admin: {
        description: 'Just a label for you, e.g. "Partner Co Blog".',
      },
      required: true,
    },
    {
      name: 'feedUrl',
      type: 'text',
      admin: {
        description: 'The RSS or Atom feed URL, e.g. https://example.com/feed.xml',
      },
      required: true,
      validate: (value: string | null | undefined) => {
        if (!value) return 'A feed URL is required.'
        try {
          const url = new URL(value)
          return url.protocol === 'http:' || url.protocol === 'https:'
            ? true
            : 'URL must use http or https.'
        } catch {
          return 'Enter a valid URL.'
        }
      },
    },
    {
      name: 'active',
      type: 'checkbox',
      admin: {
        description: 'Only active sources are checked when a sync runs.',
      },
      defaultValue: true,
    },
    {
      name: 'autoPublish',
      type: 'checkbox',
      admin: {
        description:
          'If checked, imported articles are published immediately using the reviewer below. If unchecked, they land as drafts for someone to review first (recommended).',
      },
      defaultValue: false,
      label: 'Publish automatically',
    },
    {
      name: 'defaultReviewer',
      type: 'relationship',
      admin: {
        condition: (_, siblingData) => Boolean(siblingData?.autoPublish),
        description:
          'Required for auto-publish — imported posts need a reviewer on file, same as any other post.',
      },
      filterOptions: {
        role: { in: ['admin', 'reviewer'] },
      },
      relationTo: 'users',
    },
    {
      name: 'defaultCategory',
      type: 'relationship',
      admin: {
        description: 'Optional. Tag every post imported from this source with this category.',
      },
      relationTo: 'categories',
    },
    {
      name: 'defaultAuthor',
      type: 'relationship',
      admin: {
        description: 'Optional. Byline to credit for imported posts.',
      },
      relationTo: 'users',
    },
    {
      name: 'lastFetchedAt',
      type: 'date',
      admin: {
        position: 'sidebar',
        readOnly: true,
      },
    },
    {
      name: 'lastFetchStatus',
      type: 'text',
      admin: {
        position: 'sidebar',
        readOnly: true,
      },
    },
  ],
}
