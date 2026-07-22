import type { GlobalConfig } from 'payload'

import { revalidateSettings } from './hooks/revalidateSettings'

const hexColorValidate = (value: string | null | undefined) => {
  if (!value) return 'A brand color is required.'
  return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(value) ? true : 'Enter a valid hex color, e.g. #2563eb'
}

const urlValidate = (value: string | null | undefined) => {
  if (!value) return true
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:' ? true : 'URL must use http or https.'
  } catch {
    return 'Enter a valid URL, e.g. https://example.com'
  }
}

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
      type: 'tabs',
      tabs: [
        {
          label: 'Branding',
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
              name: 'favicon',
              type: 'upload',
              admin: {
                description: 'Optional. Replaces the browser tab icon. Square image recommended (e.g. 512×512 PNG or SVG).',
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
              validate: hexColorValidate,
            },
          ],
        },
        {
          label: 'Brand Sync',
          fields: [
            {
              name: 'brandSyncUrl',
              type: 'text',
              label: 'Brand Sync URL',
              admin: {
                description:
                  'Optional. If this blog is a subdomain of a main website, point this at either (a) a JSON file on that site, e.g. https://example.com/brand.json, with { "siteName": "...", "primaryColor": "#...", "logoUrl": "..." }, or (b) just that site\'s homepage URL — if no JSON is found, we\'ll auto-detect the name, color, and logo from its standard meta tags and favicon. Any field found overrides the values in the Branding tab. Checked roughly every 5 minutes.',
              },
              validate: urlValidate,
            },
          ],
        },
        {
          label: 'Footer',
          fields: [
            {
              name: 'footerTagline',
              type: 'textarea',
              admin: {
                description: 'Optional short line shown next to the logo in the footer, e.g. a mission statement.',
              },
              label: 'Footer Tagline',
            },
            {
              name: 'copyrightText',
              type: 'text',
              admin: {
                description:
                  'Optional. Use {year} for the current year and {siteName} for the site name, e.g. "© {year} {siteName}. All rights reserved."',
              },
              label: 'Copyright Text',
            },
          ],
        },
        {
          label: 'Social',
          fields: [
            {
              name: 'socialLinks',
              type: 'array',
              admin: {
                description: 'Shown as icon links in the footer.',
              },
              fields: [
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'platform',
                      type: 'select',
                      admin: { width: '40%' },
                      defaultValue: 'other',
                      options: [
                        { label: 'X / Twitter', value: 'twitter' },
                        { label: 'Instagram', value: 'instagram' },
                        { label: 'LinkedIn', value: 'linkedin' },
                        { label: 'Facebook', value: 'facebook' },
                        { label: 'YouTube', value: 'youtube' },
                        { label: 'GitHub', value: 'github' },
                        { label: 'TikTok', value: 'tiktok' },
                        { label: 'Other', value: 'other' },
                      ],
                      required: true,
                    },
                    {
                      name: 'url',
                      type: 'text',
                      admin: { width: '60%' },
                      required: true,
                      validate: urlValidate,
                    },
                  ],
                },
              ],
              label: 'Social Links',
              maxRows: 8,
            },
          ],
        },
        {
          label: 'SEO',
          fields: [
            {
              name: 'defaultMetaDescription',
              type: 'textarea',
              admin: {
                description: 'Used for pages/posts that don\'t set their own SEO description.',
              },
              label: 'Default Meta Description',
            },
            {
              name: 'defaultOgImage',
              type: 'upload',
              admin: {
                description: 'Used as the social-share preview image for pages/posts that don\'t set their own. Recommended 1200×630.',
              },
              label: 'Default Social Share Image',
              relationTo: 'media',
            },
          ],
        },
      ],
    },
  ],
  hooks: {
    afterChange: [revalidateSettings],
  },
}
