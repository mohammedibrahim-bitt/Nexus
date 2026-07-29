import type { CollectionConfig } from 'payload'

import { isAdminOrTriggeredBy } from '../../access/isAdminOrTriggeredBy'
import { isStaffRole } from '../../access/isStaffRole'

export const SeoResearchRuns: CollectionConfig = {
  slug: 'seo-research-runs',
  access: {
    // Any staff member can trigger a run (gated by them having their own
    // API keys, enforced in the trigger route) — but can only see/manage
    // runs they personally triggered, unless they're an admin. Readers
    // (the public self-signup default) are not staff.
    create: isStaffRole,
    delete: isAdminOrTriggeredBy,
    read: isAdminOrTriggeredBy,
    update: isAdminOrTriggeredBy,
  },
  admin: {
    defaultColumns: ['keyword', 'status', 'triggeredBy', 'generatedPost', 'updatedAt'],
    description:
      'Enter a target keyword and run automatic competitor research: finds top-ranking pages, scores them across SEO/content-quality dimensions, and drafts an original post designed to outperform them. Each user needs their own SerpApi key and an API key for their chosen AI provider, set on their profile.',
    group: 'Site',
    hidden: ({ user }) => user?.role !== 'admin',
    useAsTitle: 'keyword',
  },
  fields: [
    {
      name: 'keyword',
      type: 'text',
      admin: {
        description: 'The target keyword or search phrase to research.',
      },
      required: true,
    },
    {
      name: 'triggeredBy',
      type: 'relationship',
      admin: {
        position: 'sidebar',
        readOnly: true,
      },
      relationTo: 'users',
    },
    {
      name: 'triggeredByRule',
      type: 'relationship',
      admin: {
        condition: (_, siblingData) => Boolean(siblingData?.triggeredByRule),
        description: 'Set when this run was created automatically by a scheduled rule.',
        position: 'sidebar',
        readOnly: true,
      },
      relationTo: 'seo-research-rules',
    },
    {
      name: 'trigger',
      type: 'ui',
      admin: {
        components: {
          Field: '@/collections/SeoResearchRuns/components/RunTrigger#RunTrigger',
        },
        position: 'sidebar',
      },
    },
    {
      name: 'status',
      type: 'select',
      admin: {
        position: 'sidebar',
        readOnly: true,
      },
      defaultValue: 'queued',
      options: [
        { label: 'Queued', value: 'queued' },
        { label: 'Researching', value: 'researching' },
        { label: 'Analyzing competitors', value: 'analyzing' },
        { label: 'Building strategy', value: 'strategizing' },
        { label: 'Writing draft', value: 'writing' },
        { label: 'Completed', value: 'completed' },
        { label: 'Failed', value: 'failed' },
      ],
    },
    {
      name: 'generatedPost',
      type: 'relationship',
      admin: {
        condition: (_, siblingData) => Boolean(siblingData?.generatedPost),
        position: 'sidebar',
        readOnly: true,
      },
      relationTo: 'posts',
    },
    {
      name: 'error',
      type: 'textarea',
      admin: {
        condition: (_, siblingData) => siblingData?.status === 'failed',
        readOnly: true,
      },
    },
    {
      name: 'competitorUrls',
      type: 'array',
      admin: {
        readOnly: true,
      },
      fields: [
        {
          name: 'url',
          type: 'text',
        },
      ],
    },
    {
      name: 'analysis',
      type: 'json',
      admin: {
        description: 'Per-competitor scoring and notes, populated once analysis completes.',
        readOnly: true,
      },
    },
    {
      name: 'strategy',
      type: 'json',
      admin: {
        description:
          'Content gaps, missed questions, recommended outline, FAQ, and link suggestions.',
        readOnly: true,
      },
    },
  ],
}
