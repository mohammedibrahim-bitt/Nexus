import type { CollectionConfig } from 'payload'

import { isAdmin } from '../../access/isAdmin'
import { isAdminOrReviewer } from '../../access/isAdminOrReviewer'
import { canCreateNexusPost } from './access/canCreateNexusPost'
import { canReadNexusPost } from './access/canReadNexusPost'
import { canUpdateNexusPost } from './access/canUpdateNexusPost'
import { setAuthorOnCreate } from './hooks/setAuthorOnCreate'
import { translatePost } from './hooks/translatePost'

// Nexus is a standalone AI-drafted / human-approved blog: an author (or the
// AI writer) drafts a post, an admin approves or rejects it, and approved
// posts publish immediately. Kept as its own collection rather than reusing
// the main site's `posts` so Nexus content never mixes with it.
export const NexusPosts: CollectionConfig = {
  slug: 'nexus-posts',
  access: {
    create: canCreateNexusPost,
    delete: isAdmin,
    read: canReadNexusPost,
    update: canUpdateNexusPost,
  },
  admin: {
    defaultColumns: ['titleEn', 'status', 'author', 'updatedAt'],
    useAsTitle: 'titleEn',
  },
  fields: [
    {
      name: 'slug',
      type: 'text',
      label: 'Slug',
      index: true,
    },
    {
      name: 'titleEn',
      type: 'text',
      label: 'Title (English)',
      required: true,
    },
    {
      name: 'titleAr',
      type: 'text',
      label: 'Title (Arabic)',
    },
    {
      name: 'descriptionEn',
      type: 'textarea',
      label: 'Description (English)',
      required: true,
    },
    {
      name: 'descriptionAr',
      type: 'textarea',
      label: 'Description (Arabic)',
    },
    {
      name: 'contentEn',
      type: 'textarea',
      label: 'Content (English)',
      admin: {
        description: 'Separate paragraphs with a blank line.',
      },
      required: true,
    },
    {
      name: 'contentAr',
      type: 'textarea',
      label: 'Content (Arabic)',
      admin: {
        description: 'Separate paragraphs with a blank line.',
      },
    },
    {
      name: 'tagEn',
      type: 'text',
      label: 'Topic tag (English)',
    },
    {
      name: 'tagAr',
      type: 'text',
      label: 'Topic tag (Arabic)',
    },
    {
      name: 'coverImageUrl',
      type: 'text',
      label: 'Top background photo URL',
      admin: {
        description: 'Optional image URL used as the article hero background.',
      },
    },
    {
      name: 'references',
      type: 'array',
      fields: [
        {
          name: 'value',
          type: 'text',
          required: true,
        },
      ],
    },
    {
      name: 'status',
      type: 'select',
      access: {
        // Admins and reviewers can approve/reject pending posts.
        // Authors submitting or editing their own draft can never move this themselves.
        create: isAdmin,
        update: isAdminOrReviewer,
      },
      defaultValue: 'pending',
      options: [
        { label: 'Pending review', value: 'pending' },
        { label: 'Approved', value: 'approved' },
        { label: 'Rejected', value: 'rejected' },
      ],
      required: true,
    },
    {
      name: 'author',
      type: 'relationship',
      admin: {
        description: 'Set automatically to whoever submitted this post.',
        readOnly: true,
      },
      relationTo: 'users',
    },
    {
      name: 'aiModel',
      type: 'text',
      admin: {
        description: 'Name of the AI writer/model, for AI-drafted posts without a human author.',
      },
      label: 'AI model',
    },
    {
      name: 'readMinutes',
      type: 'number',
      defaultValue: 1,
      min: 1,
    },
  ],
  hooks: {
    beforeValidate: [translatePost],
    beforeChange: [setAuthorOnCreate],
  },
  timestamps: true,
}
