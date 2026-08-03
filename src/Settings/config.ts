import type { CollectionConfig } from 'payload'

import { isAdmin } from '../access/isAdmin'
import { revalidateSettings } from './hooks/revalidateSettings'
import { DEFAULT_DISPLAY_FONT, DISPLAY_FONT_OPTIONS } from '../utilities/displayFonts'

const hexColorValidate = (value: string | null | undefined) => {
  if (!value) return 'A brand color is required.'
  return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(value) ? true : 'Enter a valid hex color, e.g. #2563eb'
}

const optionalHexColorValidate = (value: string | null | undefined) => {
  if (!value) return true
  return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(value) ? true : 'Enter a valid hex color, e.g. #f59e0b'
}

// Restricted to characters valid in a GA4 Measurement ID or a bare domain —
// this value is interpolated into an inline analytics <script>, so it must
// never contain quotes, angle brackets, or other characters that could
// break out of that context.
const analyticsIdValidate = (value: string | null | undefined) => {
  if (!value) return true
  return /^[a-zA-Z0-9.\-_]+$/.test(value)
    ? true
    : 'Only letters, numbers, dots, dashes, and underscores are allowed.'
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

// A per-tenant "global": registered with the multi-tenant plugin as
// `isGlobal: true`, so Payload treats it as a singleton *per tenant* rather
// than a list. It was a true Payload Global before multi-tenancy; Globals
// can't be tenant-scoped, which is why it's a collection now.
export const Settings: CollectionConfig = {
  slug: 'settings',
  access: {
    // Branding is read on every public page render, so reads stay open.
    read: () => true,
    // Previously this was a Global, where Payload's default update access is
    // merely "is authenticated" — which would have let any self-registered
    // reader rewrite site branding. Restricted to admins now.
    create: isAdmin,
    delete: isAdmin,
    update: isAdmin,
  },
  admin: {
    group: 'Site',
    useAsTitle: 'siteName',
  },
  labels: {
    plural: 'Settings',
    singular: 'Settings',
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
              defaultValue: '#dc2626',
              label: 'Brand Color',
              required: true,
              admin: {
                description: 'Hex color (e.g. #2563eb) used for buttons, links, and other accents site-wide.',
              },
              validate: hexColorValidate,
            },
            {
              name: 'secondaryColor',
              type: 'text',
              label: 'Secondary / Accent Color',
              admin: {
                description:
                  'Optional. Hex color (e.g. #f59e0b) used for a second tint — badges, secondary buttons, and subtle highlights. Leave blank to use a neutral gray.',
              },
              validate: optionalHexColorValidate,
            },
          ],
        },
        {
          label: 'Appearance',
          fields: [
            {
              name: 'cornerRadius',
              type: 'number',
              defaultValue: 12,
              label: 'Corner Radius (px)',
              max: 28,
              min: 0,
              admin: {
                description:
                  'Controls roundedness of cards, buttons, and inputs site-wide, from 0 (sharp) to 28 (very rounded).',
                step: 1,
              },
            },
            {
              name: 'fontScale',
              type: 'number',
              defaultValue: 1,
              label: 'Font Scale',
              max: 1.15,
              min: 0.9,
              admin: {
                description: 'Global text-size multiplier applied to the whole site, from 90% to 115%.',
                step: 0.01,
              },
            },
            {
              name: 'density',
              type: 'select',
              defaultValue: 'comfortable',
              label: 'Layout Density',
              options: [
                { label: 'Comfortable', value: 'comfortable' },
                { label: 'Compact', value: 'compact' },
              ],
              admin: {
                description: 'Compact reduces internal padding on cards and content blocks for a denser layout.',
              },
            },
            {
              name: 'enableAnimations',
              type: 'checkbox',
              defaultValue: true,
              label: 'Enable Animations',
              admin: {
                description:
                  'Turns on subtle hover/transition animations (cards, nav pills) across the site. Disable for a fully static, no-motion experience.',
              },
            },
            {
              name: 'fontFamily',
              type: 'select',
              defaultValue: DEFAULT_DISPLAY_FONT,
              label: 'Heading Font',
              options: DISPLAY_FONT_OPTIONS.map(({ label, value }) => ({ label, value })),
              admin: {
                description: 'Used for headings and the text logo site-wide. Body text stays on the readable base font.',
              },
            },
            {
              name: 'headerLayout',
              type: 'select',
              defaultValue: 'left',
              label: 'Header Layout',
              options: [
                { label: 'Logo left, nav right', value: 'left' },
                { label: 'Centered logo, nav below', value: 'centered' },
              ],
              admin: {
                description: 'Controls how the logo and navigation are arranged in the site header.',
              },
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
          label: 'Analytics',
          fields: [
            {
              name: 'analyticsProvider',
              type: 'select',
              defaultValue: 'none',
              label: 'Analytics Provider',
              options: [
                { label: 'None', value: 'none' },
                { label: 'Google Analytics (GA4)', value: 'ga4' },
                { label: 'Plausible', value: 'plausible' },
              ],
              admin: {
                description: 'Injects the tracking snippet site-wide when a provider and ID are set.',
              },
            },
            {
              name: 'analyticsId',
              type: 'text',
              label: 'Analytics ID',
              admin: {
                condition: (_, { analyticsProvider } = {}) => analyticsProvider !== 'none',
                description:
                  'For GA4: your Measurement ID, e.g. G-XXXXXXXXXX. For Plausible: your site domain, e.g. example.com.',
              },
              validate: analyticsIdValidate,
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
