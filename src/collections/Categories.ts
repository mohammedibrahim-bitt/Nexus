import type { CollectionConfig } from 'payload'

import { anyone } from '../access/anyone'
import { isStaffRole } from '../access/isStaffRole'
import { uniqueSlugPerTenant } from '../utilities/uniqueSlugPerTenant'
import { slugField } from 'payload'
import { enforceTenantOwnership } from '@/hooks/enforceTenantOwnership'

export const Categories: CollectionConfig = {
  slug: 'categories',
  access: {
    create: isStaffRole,
    delete: isStaffRole,
    read: anyone,
    update: isStaffRole,
  },
  admin: {
    useAsTitle: 'title',
  },
  hooks: {
    beforeChange: [enforceTenantOwnership],
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    slugField({
      position: undefined,
      disableUnique: true,
      overrides: (baseField) => {
        const slugTextField = baseField.fields[1]
        if (slugTextField.type === 'text') slugTextField.validate = uniqueSlugPerTenant('categories')
        return baseField
      },
    }),
  ],
}
