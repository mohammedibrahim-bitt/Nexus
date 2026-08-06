import type { CollectionConfig } from 'payload'

import crypto from 'crypto'

import { isSuperAdmin } from '../../access/isSuperAdmin'
import { isStaffRole } from '../../access/isStaffRole'

/**
 * The DNS label a tenant must create a TXT record under, and the prefix of the
 * value stored in it. Kept here so the collection, the verify route, and the
 * admin instructions panel can't drift apart.
 */
export const DNS_VERIFY_SUBDOMAIN = '_nexus-verify'
export const DNS_VERIFY_PREFIX = 'nexus-verify'

/** `nexus-verify=<32 hex chars>` */
export const generateDnsToken = (): string =>
  `${DNS_VERIFY_PREFIX}=${crypto.randomBytes(16).toString('hex')}`

/** Bare hostname of a URL, lowercased and stripped of `www.` */
export const hostnameFromUrl = (value: string): null | string => {
  try {
    return new URL(value).hostname.toLowerCase().replace(/^www\./, '')
  } catch {
    return null
  }
}

/**
 * Flattens what `dns.resolveTxt` returns into comparable strings.
 *
 * Node hands back `string[][]` because a single TXT record longer than 255
 * bytes is transmitted as multiple chunks that must be concatenated — compare
 * the chunks individually and a long token would never match.
 */
export const flattenTxtRecords = (records: string[][]): string[] =>
  records.map((chunks) => chunks.join('').trim())

/**
 * Whether any TXT record at the checked name exactly equals the tenant's
 * token. Exact match, not substring: a substring test would let an unrelated
 * record that merely contains the token satisfy the check.
 */
export const txtRecordsMatchToken = (records: string[][], token: string): boolean =>
  flattenTxtRecords(records).includes(token.trim())

const subdomainValidate = (value: string | null | undefined) => {
  if (!value) return 'A subdomain is required.'
  // DNS label rules: lowercase alphanumerics and hyphens, no leading/trailing
  // hyphen. Kept strict because this value is interpolated into a hostname.
  if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/.test(value)) {
    return 'Use lowercase letters, numbers, and hyphens only (no leading or trailing hyphen), e.g. "acme".'
  }
  if (value.length > 63) return 'A subdomain label cannot exceed 63 characters.'
  // Reserved because these resolve to first-party surfaces, not tenants.
  if (['www', 'admin', 'api', 'app', 'static', 'assets'].includes(value)) {
    return `"${value}" is reserved and can't be used as a tenant subdomain.`
  }
  return true
}

const hostnameValidate = (value: string | null | undefined) => {
  if (!value) return true
  if (/^https?:\/\//i.test(value)) return 'Enter a bare hostname without http:// or https://'
  if (value.includes('/')) return 'Enter a hostname only, with no path.'
  return /^[a-z0-9.-]+$/i.test(value) ? true : 'Enter a valid hostname, e.g. acme.example.com'
}

const urlValidate = (value: string | null | undefined) => {
  if (!value) return true
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
      ? true
      : 'URL must use http or https.'
  } catch {
    return 'Enter a valid URL, e.g. https://example.com'
  }
}

export const Tenants: CollectionConfig = {
  slug: 'tenants',
  access: {
    // Tenant creation/deletion/modification is a super-admin-only, platform
    // -wide operation — a tenant-scoped `admin` must never create, delete, or
    // modify a tenant (including their own). See also the server-side
    // re-check in the create-from-url route, since hiding UI is not a
    // security boundary.
    create: isSuperAdmin,
    delete: isSuperAdmin,
    update: isSuperAdmin,
    // Staff read the tenants they're assigned to; the multi-tenant plugin
    // narrows this further via useTenantsCollectionAccess. Public page
    // rendering does NOT depend on this: host->tenant resolution runs through
    // the Local API with default overrideAccess, so the REST surface can stay
    // locked down without breaking anonymous visitors.
    read: isStaffRole,
  },
  admin: {
    components: {
      // "Create from URL" panel above the list. It renders only for admins,
      // and the route it posts to re-checks the role server-side.
      beforeList: ['@/collections/Tenants/components/CreateFromURL#CreateTenantFromURL'],
    },
    defaultColumns: ['name', 'slug', 'domain'],
    description:
      'Each tenant is an independent site on its own subdomain, with fully isolated content, media, and branding.',
    group: 'Site',
    // Platform-only surface: a tenant-scoped `admin` never sees Tenants in
    // the sidebar at all, only super_admin does.
    hidden: ({ user }) => user?.role !== 'super_admin',
    useAsTitle: 'name',
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      admin: {
        description: 'Display name for this tenant, e.g. "Acme Insights".',
      },
      required: true,
    },
    {
      name: 'slug',
      type: 'text',
      admin: {
        description:
          'The subdomain label this tenant is served from — "acme" serves acme.yourdomain.com.',
      },
      index: true,
      required: true,
      unique: true,
      validate: subdomainValidate,
    },
    {
      name: 'domain',
      type: 'text',
      admin: {
        description:
          'Optional. A full custom hostname for this tenant (e.g. news.acme.com). Takes precedence over the subdomain when matching an incoming request.',
      },
      index: true,
      unique: true,
      validate: hostnameValidate,
    },
    {
      name: 'sourceUrl',
      type: 'text',
      admin: {
        description:
          "The tenant's main website. Used to sync branding (name, colors, logo) — either a brand.json or the homepage, whose meta tags and favicon are read automatically. Also the site cloned by the full-site clone pipeline, once its domain is DNS-verified.",
      },
      label: 'Brand Source URL',
      validate: urlValidate,
    },
    {
      type: 'collapsible',
      admin: {
        description:
          'Proves the client actually controls the source site before we clone it. Nothing in the clone pipeline runs until this is verified.',
        initCollapsed: false,
      },
      label: 'Domain Verification',
      fields: [
        {
          name: 'sourceDomain',
          type: 'text',
          admin: {
            description:
              'Derived automatically from the Brand Source URL — the bare hostname the TXT record must live under.',
            readOnly: true,
          },
          index: true,
          label: 'Source Domain',
        },
        {
          name: 'dnsVerificationToken',
          type: 'text',
          admin: {
            description:
              'Generated once per tenant. The client puts this exact value in their DNS TXT record.',
            readOnly: true,
          },
          label: 'Verification Token',
        },
        {
          name: 'dnsVerified',
          type: 'checkbox',
          access: {
            // Verification status is only ever set by the server-side DNS
            // lookup — never hand-editable, or the whole check is theatre.
            create: () => false,
            update: () => false,
          },
          admin: {
            description: 'Set only by a successful DNS lookup. Cannot be toggled by hand.',
            readOnly: true,
          },
          defaultValue: false,
          label: 'DNS Verified',
        },
        {
          name: 'dnsVerifiedAt',
          type: 'date',
          admin: {
            description: 'When the TXT record was last confirmed.',
            readOnly: true,
          },
          label: 'Verified At',
        },
        {
          name: 'dnsVerificationPanel',
          type: 'ui',
          admin: {
            components: {
              Field: '@/collections/Tenants/components/DnsVerification#DnsVerificationPanel',
            },
          },
          label: 'Verification Instructions',
        },
      ],
    },
    {
      type: 'collapsible',
      admin: {
        description:
          'One-time clone of the source site, used as this tenant’s shell. Nothing goes live until an admin approves it.',
        initCollapsed: false,
      },
      label: 'Site Clone',
      fields: [
        {
          name: 'cloneStatus',
          type: 'select',
          access: {
            // Status transitions happen through the clone/approve routes, which
            // enforce the gate (never published straight out of a scrape).
            create: () => false,
            update: () => false,
          },
          admin: {
            description:
              'none → pending_review (scraped, awaiting approval) → published (live). brand_only means the clone was discarded in favour of brand sync.',
            readOnly: true,
          },
          defaultValue: 'none',
          label: 'Clone Status',
          options: [
            { label: 'Not cloned', value: 'none' },
            { label: 'Scraping…', value: 'scraping' },
            { label: 'Pending review', value: 'pending_review' },
            { label: 'Published', value: 'published' },
            { label: 'Brand-only fallback', value: 'brand_only' },
            { label: 'Failed', value: 'failed' },
          ],
        },
        {
          name: 'cloneMode',
          type: 'select',
          admin: {
            description: 'Which rendering mode this tenant ended up in, and it is logged why.',
            readOnly: true,
          },
          defaultValue: 'brand_only',
          label: 'Mode',
          options: [
            { label: 'Full clone', value: 'full_clone' },
            { label: 'Brand only', value: 'brand_only' },
          ],
        },
        {
          name: 'qaScore',
          type: 'number',
          admin: {
            description:
              'Pixel similarity (0–100) between the rendered shell and the live source, from the last scrape.',
            readOnly: true,
          },
          label: 'QA Similarity Score',
        },
        {
          name: 'qaThreshold',
          type: 'number',
          admin: {
            description:
              'Below this score the admin UI recommends falling back to brand-only. Configurable per tenant — some sites clone worse than others.',
            step: 1,
          },
          defaultValue: 85,
          label: 'QA Threshold',
          max: 100,
          min: 0,
        },
        {
          name: 'shellHtmlPath',
          type: 'text',
          admin: { readOnly: true },
          label: 'Shell HTML (storage path)',
        },
        {
          name: 'sourceScreenshotPath',
          type: 'text',
          admin: { readOnly: true },
          label: 'Source Screenshot (storage path)',
        },
        {
          name: 'shellScreenshotPath',
          type: 'text',
          admin: { readOnly: true },
          label: 'Shell Screenshot (storage path)',
        },
        {
          name: 'diffScreenshotPath',
          type: 'text',
          admin: { readOnly: true },
          label: 'Diff Image (storage path)',
        },
        {
          name: 'lastClonedAt',
          type: 'date',
          admin: { readOnly: true },
          label: 'Last Successful Clone',
        },
        {
          name: 'cloneLog',
          type: 'textarea',
          admin: {
            description:
              'Why this tenant ended up in its current mode, plus any scripts held back for review.',
            readOnly: true,
          },
          label: 'Clone Log',
        },
        {
          name: 'flaggedScripts',
          type: 'json',
          admin: {
            description:
              'Scripts kept rather than deleted because they may be structurally important. Review before publishing.',
            readOnly: true,
          },
          label: 'Flagged Scripts',
        },
        {
          name: 'clonePanel',
          type: 'ui',
          admin: {
            components: {
              Field: '@/collections/Tenants/components/ClonePanel#ClonePanel',
            },
          },
          label: 'Clone Controls',
        },
      ],
    },
  ],
  hooks: {
    beforeChange: [
      ({ data, operation, originalDoc }) => {
        // Issue the token once and never rotate it — the client may already
        // have published the TXT record by the time they edit anything else,
        // and rotating would silently invalidate it. Also covers tenants that
        // predate this field, which would otherwise never get a token at all
        // (the field is read-only, so there's no way to add one by hand).
        if (!data.dnsVerificationToken && !originalDoc?.dnsVerificationToken) {
          data.dnsVerificationToken = generateDnsToken()
        }

        // Keep sourceDomain in lockstep with sourceUrl.
        if (data.sourceUrl) {
          const host = hostnameFromUrl(data.sourceUrl)
          if (host) data.sourceDomain = host
        } else if (data.sourceUrl === null || data.sourceUrl === '') {
          data.sourceDomain = null
        }

        // Changing which site we point at invalidates any prior proof of
        // ownership — the old TXT record was for a different domain.
        const previousDomain = originalDoc?.sourceDomain
        if (operation === 'update' && previousDomain && data.sourceDomain !== previousDomain) {
          data.dnsVerified = false
          data.dnsVerifiedAt = null
        }

        return data
      },
    ],
  },
  labels: {
    plural: 'Tenants',
    singular: 'Tenant',
  },
}
