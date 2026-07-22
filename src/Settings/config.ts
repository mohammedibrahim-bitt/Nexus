import type { GlobalConfig } from 'payload'

import { revalidateSettings } from './hooks/revalidateSettings'

export const Settings: GlobalConfig = {
  slug: 'settings',
  access: {
    read: () => true,
  },
  admin: {
    group: 'Site',
  },
  fields: [
    {
      name: 'siteName',
      type: 'text',
      defaultValue: 'Nexus',
      label: 'Site Name',
      required: true,
      admin: {
        description: 'Shown in the header/footer logo (if no image logo is set) and in browser tab titles.',
      },
    },
    {
      name: 'logo',
      type: 'upload',
      admin: {
        description: 'Optional. If set, this image replaces the text logo in the header and footer.',
      },
      relationTo: 'media',
    },
    {
      name: 'primaryColor',
      type: 'text',
      defaultValue: '#171717',
      label: 'Brand Color',
      required: true,
      admin: {
        description: 'Hex color (e.g. #2563eb) used for buttons, links, and other accents site-wide.',
      },
      validate: (value: string | null | undefined) => {
        if (!value) return 'A brand color is required.'
        return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(value)
          ? true
          : 'Enter a valid hex color, e.g. #2563eb'
      },
    },
  ],
  hooks: {
    afterChange: [revalidateSettings],
  },
}
