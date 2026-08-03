import { formBuilderPlugin } from '@payloadcms/plugin-form-builder'
import { isAdmin } from '@/access/isAdmin'
import { multiTenantPlugin } from '@payloadcms/plugin-multi-tenant'
import { nestedDocsPlugin } from '@payloadcms/plugin-nested-docs'
import { redirectsPlugin } from '@payloadcms/plugin-redirects'
import { seoPlugin } from '@payloadcms/plugin-seo'
import { searchPlugin } from '@payloadcms/plugin-search'
import { Plugin } from 'payload'
import { revalidateRedirects } from '@/hooks/revalidateRedirects'
import { GenerateTitle, GenerateURL } from '@payloadcms/plugin-seo/types'
import { FixedToolbarFeature, HeadingFeature, lexicalEditor } from '@payloadcms/richtext-lexical'
import { searchFields } from '@/search/fieldOverrides'
import { beforeSyncWithSearch } from '@/search/beforeSync'

import { Config, Page, Post } from '@/payload-types'
import { getServerSideURL } from '@/utilities/getURL'

const generateTitle: GenerateTitle<Post | Page> = ({ doc }) => {
  return doc?.title ? `${doc.title} | Nexus` : 'Nexus'
}

const generateURL: GenerateURL<Post | Page> = ({ doc }) => {
  const url = getServerSideURL()

  return doc?.slug ? `${url}/${doc.slug}` : url
}

export const plugins: Plugin[] = [
  redirectsPlugin({
    collections: ['pages', 'posts'],
    overrides: {
      // @ts-expect-error - This is a valid override, mapped fields don't resolve to the same type
      fields: ({ defaultFields }) => {
        return defaultFields.map((field) => {
          if ('name' in field && field.name === 'from') {
            return {
              ...field,
              admin: {
                description: 'You will need to rebuild the website when changing this field.',
              },
            }
          }
          return field
        })
      },
      hooks: {
        afterChange: [revalidateRedirects],
      },
    },
  }),
  nestedDocsPlugin({
    collections: ['categories'],
    generateURL: (docs) => docs.reduce((url, doc) => `${url}/${doc.slug}`, ''),
  }),
  seoPlugin({
    generateTitle,
    generateURL,
  }),
  formBuilderPlugin({
    fields: {
      payment: false,
    },
    formSubmissionOverrides: {
      access: {
        // Contact-form messages and newsletter emails are PII/leads — the
        // plugin's default (`read: !!user`) would let any self-registered
        // author read them. Anyone can still submit (create stays open).
        read: isAdmin,
      },
      admin: {
        defaultColumns: ['form', 'createdAt'],
        useAsTitle: 'createdAt',
      },
      fields: ({ defaultFields }) => {
        return defaultFields.map((field) => {
          if ('name' in field && field.name === 'form') {
            return {
              ...field,
              admin: {
                ...field.admin,
                components: {
                  ...field.admin?.components,
                  Cell: '@/components/admin/FormSubmissionFormCell#FormSubmissionFormCell',
                },
              },
            }
          }
          return field
        })
      },
      hooks: {
        // Anonymous visitors submit this collection directly (no admin
        // session, no tenant cookie), so the multi-tenant plugin's own
        // tenant-field default can't resolve one — derive it from the
        // referenced form instead, the same way Reviews derives its tenant
        // from the referenced Post.
        beforeChange: [
          async ({ data, req }) => {
            if (data?.form) {
              const formId = typeof data.form === 'object' ? data.form.id : data.form
              const form = await req.payload.findByID({
                collection: 'forms',
                id: formId,
                depth: 0,
                overrideAccess: true,
              })
              const tenantId = form?.tenant
              if (tenantId) {
                return { ...data, tenant: typeof tenantId === 'object' ? tenantId.id : tenantId }
              }
            }
            return data
          },
        ],
      },
    },
    formOverrides: {
      fields: ({ defaultFields }) => {
        return defaultFields.map((field) => {
          if ('name' in field && field.name === 'confirmationMessage') {
            return {
              ...field,
              editor: lexicalEditor({
                features: ({ rootFeatures }) => {
                  return [
                    ...rootFeatures,
                    FixedToolbarFeature(),
                    HeadingFeature({ enabledHeadingSizes: ['h1', 'h2', 'h3', 'h4'] }),
                  ]
                },
              }),
            }
          }
          return field
        })
      },
    },
  }),
  searchPlugin({
    collections: ['posts'],
    beforeSync: beforeSyncWithSearch,
    searchOverrides: {
      fields: ({ defaultFields }) => {
        return [...defaultFields, ...searchFields]
      },
    },
  }),
  /*
   * Multi-tenancy. Must be registered LAST: it decorates collections that the
   * plugins above generate (notably `search`, created by searchPlugin), so
   * those collections have to exist in the config before this runs.
   *
   * `search` is scoped deliberately — searchPlugin mirrors every post's title
   * and excerpt into it, so leaving it unscoped would leak one tenant's
   * content into another tenant's site search.
   */
  multiTenantPlugin<Config>({
    collections: {
      posts: {},
      pages: {},
      media: {},
      categories: {},
      tags: {},
      reviews: {},
      'content-sources': {},
      'seo-research-runs': {},
      'seo-research-rules': {},
      search: {},
      forms: {},
      'form-submissions': {},
      // One row per tenant, surfaced in the admin as a singleton rather than
      // a list — these were Payload Globals before multi-tenancy.
      settings: { isGlobal: true },
      header: { isGlobal: true },
      footer: { isGlobal: true },
    },
    tenantsSlug: 'tenants',
    userHasAccessToAllTenants: (user) => user?.role === 'admin',
  }),
]
