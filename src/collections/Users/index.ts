import type { CollectionConfig } from 'payload'

import { anyone } from '../../access/anyone'
import { authenticated } from '../../access/authenticated'
import { isAdmin } from '../../access/isAdmin'
import { isAdminOrSelf } from '../../access/isAdminOrSelf'
import { isAdminOrSelfField } from '../../access/isAdminOrSelfField'
import { decryptSecret, encryptSecret } from '../../utilities/encryption'
import { AI_PROVIDER_OPTIONS } from '../../utilities/seoResearch/aiProviders'
import { assignFirstUserAsAdmin } from './hooks/assignFirstUserAsAdmin'
import { trackLastLogin } from './hooks/trackLastLogin'

export const Users: CollectionConfig = {
  slug: 'users',
  access: {
    // Only admins can open /admin at all — authors/reviewers use the
    // frontend /dashboard instead. This is a real server-side redirect gate
    // (Payload's admin app shell checks it on every /admin/* request), not
    // just a hidden UI element.
    admin: isAdmin,
    // Anyone can register an account, but they always land in the collection
    // as an "author" — see the `role` field's own access control below, and
    // the `assignFirstUserAsAdmin` hook for the one bootstrap exception.
    create: anyone,
    delete: isAdmin,
    read: authenticated,
    update: isAdminOrSelf,
  },
  admin: {
    defaultColumns: ['name', 'email', 'role'],
    // Author/reviewer accounts don't manage other staff — keep this admin-only in the nav.
    hidden: ({ user }) => user?.role !== 'admin',
    useAsTitle: 'name',
  },
  auth: true,
  fields: [
    {
      name: 'name',
      type: 'text',
    },
    {
      name: 'role',
      type: 'select',
      access: {
        // Only an admin can set or change this — self-registration always
        // falls through to the `defaultValue` below since the submitted
        // value is silently dropped for anyone who isn't already an admin.
        create: isAdmin,
        update: isAdmin,
      },
      admin: {
        components: {
          Cell: '@/collections/Users/components/RoleCell#RoleCell',
        },
        description: 'Only an admin can grant this. Admins can also author and review posts.',
        position: 'sidebar',
      },
      defaultValue: 'author',
      options: [
        { label: 'Admin', value: 'admin' },
        { label: 'Author', value: 'author' },
        { label: 'Reviewer', value: 'reviewer' },
      ],
      required: true,
    },
    {
      name: 'avatar',
      type: 'upload',
      label: 'Profile Pic',
      relationTo: 'media',
    },
    {
      name: 'title',
      type: 'text',
      admin: {
        description: 'e.g. "Senior Editor" or "Licensed Real Estate Broker" — shown under their name.',
      },
    },
    {
      name: 'bio',
      type: 'textarea',
      admin: {
        description: 'A sentence or two shown in the "About the editorial team" box at the end of posts.',
      },
    },
    {
      name: 'socialLinks',
      type: 'array',
      admin: {
        description: 'Shown as icon buttons next to this person in the "About the editorial team" box.',
      },
      fields: [
        {
          name: 'platform',
          type: 'select',
          defaultValue: 'linkedin',
          options: [
            { label: 'LinkedIn', value: 'linkedin' },
            { label: 'X (Twitter)', value: 'twitter' },
            { label: 'Instagram', value: 'instagram' },
            { label: 'Facebook', value: 'facebook' },
            { label: 'YouTube', value: 'youtube' },
            { label: 'Website', value: 'website' },
          ],
          required: true,
        },
        {
          name: 'url',
          type: 'text',
          required: true,
        },
      ],
      label: 'Social Links',
    },
    {
      name: 'lastLoginAt',
      type: 'date',
      admin: {
        description: 'Set automatically on each login. Powers the "active users" stat on the admin dashboard.',
        position: 'sidebar',
        readOnly: true,
      },
    },
    {
      name: 'profilePreview',
      type: 'ui',
      admin: {
        components: {
          Field: '@/collections/Users/components/ProfilePreview#ProfilePreview',
        },
        position: 'sidebar',
      },
    },
    {
      type: 'collapsible',
      admin: {
        description:
          'Only visible to you (and admins). Bring your own keys to use the SEO Research Agent — this site does not supply shared keys. Get a SerpApi key at serpapi.com, and an API key from whichever AI provider you choose below.',
        initCollapsed: true,
      },
      fields: [
        {
          name: 'serpApiKey',
          type: 'text',
          access: {
            read: isAdminOrSelfField,
            update: isAdminOrSelfField,
          },
          admin: {
            description: 'Your personal SerpApi key, used only for SEO Research Agent runs you trigger.',
          },
          hooks: {
            afterRead: [({ value }) => decryptSecret(value as string | undefined) || undefined],
            beforeChange: [({ value }) => (value ? encryptSecret(value) : value)],
          },
          label: 'SerpApi Key',
        },
        {
          name: 'aiProvider',
          type: 'select',
          admin: {
            description: 'Which AI provider to use for analyzing competitors and writing the draft.',
          },
          defaultValue: 'anthropic',
          label: 'AI Provider',
          options: AI_PROVIDER_OPTIONS,
        },
        {
          name: 'aiApiKey',
          type: 'text',
          access: {
            read: isAdminOrSelfField,
            update: isAdminOrSelfField,
          },
          admin: {
            description: 'Your personal API key for the AI provider selected above.',
          },
          hooks: {
            afterRead: [({ value }) => decryptSecret(value as string | undefined) || undefined],
            beforeChange: [({ value }) => (value ? encryptSecret(value) : value)],
          },
          label: 'AI API Key',
        },
      ],
      label: 'API Keys',
    },
  ],
  hooks: {
    afterLogin: [trackLastLogin],
    beforeChange: [assignFirstUserAsAdmin],
  },
  timestamps: true,
}
