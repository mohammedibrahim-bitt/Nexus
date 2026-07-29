import type { GlobalConfig } from 'payload'

import { link } from '@/fields/link'
import { navIcon } from '@/fields/navIcon'
import { revalidateHeader } from './hooks/revalidateHeader'

export const Header: GlobalConfig = {
  slug: 'header',
  access: {
    read: () => true,
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
