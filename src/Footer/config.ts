import type { CollectionConfig } from 'payload'

import { isAdmin } from '@/access/isAdmin'
import { link } from '@/fields/link'
import { navIcon } from '@/fields/navIcon'
import { revalidateFooter } from './hooks/revalidateFooter'

// Per-tenant "global" — see the note on Settings for why this is a collection
// rather than a Payload Global.
export const Footer: CollectionConfig = {
  slug: 'footer',
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
    plural: 'Footer',
    singular: 'Footer',
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
      ],
      maxRows: 14,
      admin: {
        initCollapsed: true,
        components: {
          RowLabel: '@/Footer/RowLabel#RowLabel',
        },
      },
    },
  ],
  hooks: {
    afterChange: [revalidateFooter],
  },
}
