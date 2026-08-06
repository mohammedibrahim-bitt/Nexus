import type { CollectionConfig } from 'payload'

import { anyone } from '../../access/anyone'
import { isTenantManager } from '../../access/isTenantManager'
import { isAdminOrSelf } from '../../access/isAdminOrSelf'
import { isAdminOrSelfField } from '../../access/isAdminOrSelfField'
import { isStaffOrSelf } from '../../access/isStaffOrSelf'
import { isSuperAdminOrTenantAdmin } from '../../access/isSuperAdminOrTenantAdmin'
import { isTenantManagerRole } from '../../access/permissions'
import { brandedEmailHTML, getBrandEmailData } from '../../utilities/brandedEmail'
import { decryptSecret, encryptSecret } from '../../utilities/encryption'
import { AI_PROVIDER_OPTIONS } from '../../utilities/seoResearch/aiProviders'
import { getServerSideURL } from '../../utilities/getURL'
import { assignFirstUserAsAdmin } from './hooks/assignFirstUserAsAdmin'
import { assignSignupTenant } from './hooks/assignSignupTenant'
import { autoVerifyInDev } from './hooks/autoVerifyInDev'
import { enforceTenantAdminBoundaries } from './hooks/enforceTenantAdminBoundaries'
import { trackLastLogin } from './hooks/trackLastLogin'

export const Users: CollectionConfig = {
  slug: 'users',
  access: {
    // super_admin and the tenant-scoped admin can open /admin — authors/
    // reviewers use the frontend /dashboard instead. This is a real
    // server-side redirect gate (Payload's admin app shell checks it on
    // every /admin/* request), not just a hidden UI element. A tenant-admin
    // who opens /admin only ever sees their own tenant's data, everywhere
    // else in this collection map — see `plugins/index.ts`'s
    // `userHasAccessToAllTenants`.
    admin: isTenantManager,
    // Anyone can register an account, but they always land in the collection
    // as a "reader" — see the `role` field's own access control below, and
    // the `assignFirstUserAsAdmin` hook for the one bootstrap exception.
    // Only a super_admin/tenant-admin can grant author/reviewer/admin (and a
    // tenant-admin is further restricted by `enforceTenantAdminBoundaries`
    // from ever granting super_admin or reaching outside their own tenant).
    create: anyone,
    delete: isSuperAdminOrTenantAdmin,
    read: isStaffOrSelf,
    update: isAdminOrSelf,
  },
  admin: {
    defaultColumns: ['name', 'email', 'role'],
    // Author/reviewer accounts don't manage other staff — keep this
    // restricted to super_admin/tenant-admin in the nav.
    hidden: ({ user }) => !isTenantManagerRole(user),
    useAsTitle: 'name',
  },
  auth: {
    // Both links point at frontend pages (there is no Payload admin-panel
    // verify/reset UI for non-admins to land on), matching the unified
    // sign-in flow used across the whole site.
    forgotPassword: {
      generateEmailHTML: async (args) => {
        const token = args?.token ?? ''
        const user = args?.user
        const brand = await getBrandEmailData(args?.req)
        const url = `${getServerSideURL()}/reset-password?token=${token}`
        return brandedEmailHTML({
          brand,
          bodyHtml: `<p>Hi ${user?.name || ''},</p><p>Click the button below to reset your ${brand.siteName} password.</p><p>If you didn't request this, you can safely ignore this email.</p>`,
          buttonLabel: 'Reset password',
          url,
        })
      },
      generateEmailSubject: async (args) => {
        const brand = await getBrandEmailData(args?.req)
        return `Reset your ${brand.siteName} password`
      },
    },
    verify: {
      generateEmailHTML: async (args) => {
        const token = args?.token ?? ''
        const user = args?.user
        const brand = await getBrandEmailData(args?.req)
        const url = `${getServerSideURL()}/verify?token=${token}`
        return brandedEmailHTML({
          brand,
          bodyHtml: `<p>Hi ${user?.name || ''},</p><p>Click the button below to verify your ${brand.siteName} account.</p>`,
          buttonLabel: 'Verify account',
          url,
        })
      },
      generateEmailSubject: async (args) => {
        const brand = await getBrandEmailData(args?.req)
        return `Verify your ${brand.siteName} account`
      },
    },
  },
  fields: [
    {
      name: 'name',
      type: 'text',
    },
    {
      name: 'role',
      type: 'select',
      access: {
        // Only a super_admin/tenant-admin can set or change this —
        // self-registration always falls through to the `defaultValue`
        // below since the submitted value is silently dropped for anyone
        // who isn't already one of those two. A tenant-admin's own choices
        // here are further restricted (never Super Admin, never their own
        // role, never a tenant outside their own) by
        // `enforceTenantAdminBoundaries`, since that's a cross-field
        // invariant this field-level access can't express.
        create: isTenantManager,
        update: isTenantManager,
      },
      admin: {
        components: {
          Cell: '@/collections/Users/components/RoleCell#RoleCell',
        },
        description:
          'Self-registered accounts always start as Reader. A tenant admin can grant Admin, Author, or Reviewer within their own tenant; only a Super Admin can grant Super Admin.',
        position: 'sidebar',
      },
      defaultValue: 'reader',
      options: [
        { label: 'Super Admin', value: 'super_admin' },
        { label: 'Admin', value: 'admin' },
        { label: 'Author', value: 'author' },
        { label: 'Reviewer', value: 'reviewer' },
        { label: 'Reader', value: 'reader' },
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
    beforeChange: [assignFirstUserAsAdmin, assignSignupTenant, autoVerifyInDev, enforceTenantAdminBoundaries],
  },
  timestamps: true,
}
