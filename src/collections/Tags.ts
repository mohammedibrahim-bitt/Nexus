import type { CollectionConfig } from 'payload'

import { anyone } from '../access/anyone'
import { isStaffRole } from '../access/isStaffRole'
import { slugField } from 'payload'

export const Tags: CollectionConfig = {
  slug: 'tags',
  access: {
    create: isStaffRole,
    delete: isStaffRole,
    read: anyone,
    update: isStaffRole,
  },
  admin: {
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    slugField({
      position: undefined,
    }),
  ],
}
