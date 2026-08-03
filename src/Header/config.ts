import type { CollectionConfig } from 'payload'

import { isAdmin } from '@/access/isAdmin'
import { link } from '@/fields/link'
import { navIcon } from '@/fields/navIcon'
import { revalidateHeader } from './hooks/revalidateHeader'

// Per-tenant "global" — see the note on Settings for why this is a collection
// rather than a Payload Global.
export const Header: CollectionConfig = {
  slug: 'header',
  access: {
    read: () => true,
    create: isAdmin,
    delete: isAdmin,
    update: isAdmin,
  },
  admin: {
    group: 'Site',
  },
  labels: {
    plural: 'Header',
    singular: 'Header',
  },
  fields: [
    {
      name: 'navItems',
      type: 'array',
      fields: [
        link({
          appearances: false,
        }),
        navIcon(),
        {
          name: 'staffOnly',
          type: 'checkbox',
          admin: {
            description:
              'Only show this link to logged-in staff (admin/author/reviewer) — hidden from readers and logged-out visitors, e.g. for a "New Post" shortcut.',
          },
          defaultValue: false,
        },
      ],
      maxRows: 6,
      admin: {
        initCollapsed: true,
        components: {
          RowLabel: '@/Header/RowLabel#RowLabel',
        },
      },
    },
  ],
  hooks: {
    afterChange: [revalidateHeader],
  },
}
