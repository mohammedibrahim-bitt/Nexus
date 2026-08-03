import type { CollectionConfig } from 'payload'

import { isAdmin } from '../../access/isAdmin'

export const SeoResearchRules: CollectionConfig = {
  slug: 'seo-research-rules',
  access: {
    create: isAdmin,
    delete: isAdmin,
    read: isAdmin,
    update: isAdmin,
  },
  admin: {
    defaultColumns: ['keyword', 'active', 'runAsUser', 'intervalDays', 'lastRunAt', 'lastRunStatus'],
    description:
      'Keywords the SEO Research Agent researches and drafts on its own, on a schedule — no one has to trigger it by hand. Every run still only ever produces a draft post; nothing is ever auto-published.',
    group: 'Site',
    hidden: ({ user }) => user?.role !== 'admin',
    useAsTitle: 'keyword',
  },
  fields: [
    {
      name: 'keyword',
      type: 'text',
      admin: {
        description:
          'The target keyword or search phrase to research. Can be a reusable template with bracketed instructions resolved fresh each time it runs — e.g. "best AI agents in [month] [year]", "[current quarter] SaaS pricing trends", or open-ended ones like "[trending AI model this week]". Leave it as a plain phrase with no brackets to search that exact keyword every time.',
      },
      required: true,
    },
    {
      name: 'active',
      type: 'checkbox',
      admin: {
        description: 'Only active rules are considered when the scheduler checks for due work.',
      },
      defaultValue: true,
    },
    {
      name: 'runAsUser',
      type: 'relationship',
      admin: {
        description:
          "Whose SerpApi key and AI provider key to use — this person must have both saved on their profile. Automated runs are credited to them as the post author, same as if they'd triggered it manually.",
      },
      filterOptions: {
        role: { in: ['admin', 'author', 'reviewer'] },
      },
      relationTo: 'users',
      required: true,
    },
    {
      name: 'intervalDays',
      type: 'number',
      admin: {
        description: 'Run this keyword again this many days after its last run.',
        step: 1,
      },
      defaultValue: 7,
      min: 1,
      required: true,
    },
    {
      name: 'lastRun',
      type: 'relationship',
      admin: {
        position: 'sidebar',
        readOnly: true,
      },
      relationTo: 'seo-research-runs',
    },
    {
      name: 'lastRunAt',
      type: 'date',
      admin: {
        position: 'sidebar',
        readOnly: true,
      },
    },
    {
      name: 'lastRunStatus',
      type: 'text',
      admin: {
        position: 'sidebar',
        readOnly: true,
      },
    },
  ],
  timestamps: true,
}
