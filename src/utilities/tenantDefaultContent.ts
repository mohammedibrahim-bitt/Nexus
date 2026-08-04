import type { Payload, RequiredDataFromCollectionSlug } from 'payload'
import type { FormBlock, Header, Page } from '@/payload-types'

/**
 * About/Contact copy is intentionally generic (no site name baked in) so it
 * reads correctly for any tenant without per-tenant templating — the page
 * itself already renders the tenant's own logo/name/color via the shared
 * layout, so the body text just needs to avoid claiming a specific brand.
 */
const aboutLayout: Page['layout'] = [
  {
    blockType: 'content' as const,
    columns: [
      {
        size: 'full' as const,
        richText: {
          root: {
            type: 'root',
            format: '',
            indent: 0,
            version: 1,
            direction: 'ltr' as const,
            children: [
              {
                tag: 'h1',
                type: 'heading',
                format: '',
                indent: 0,
                version: 1,
                direction: 'ltr',
                children: [
                  { mode: 'normal', text: 'About this site', type: 'text', style: '', detail: 0, format: 0, version: 1 },
                ],
              },
              {
                type: 'paragraph',
                format: '',
                indent: 0,
                version: 1,
                direction: 'ltr',
                textFormat: 0,
                children: [
                  {
                    mode: 'normal',
                    text: 'This is a placeholder About page. Replace this text with your own story: who you are, why you started this blog, and what readers can expect to find here.',
                    type: 'text',
                    style: '',
                    detail: 0,
                    format: 0,
                    version: 1,
                  },
                ],
              },
              {
                tag: 'h2',
                type: 'heading',
                format: '',
                indent: 0,
                version: 1,
                direction: 'ltr',
                children: [
                  { mode: 'normal', text: 'What we cover', type: 'text', style: '', detail: 0, format: 0, version: 1 },
                ],
              },
              {
                type: 'paragraph',
                format: '',
                indent: 0,
                version: 1,
                direction: 'ltr',
                textFormat: 0,
                children: [
                  {
                    mode: 'normal',
                    text: 'Describe your focus areas here — the topics, beats, or themes that define your content.',
                    type: 'text',
                    style: '',
                    detail: 0,
                    format: 0,
                    version: 1,
                  },
                ],
              },
              {
                tag: 'h2',
                type: 'heading',
                format: '',
                indent: 0,
                version: 1,
                direction: 'ltr',
                children: [
                  { mode: 'normal', text: 'Get in touch', type: 'text', style: '', detail: 0, format: 0, version: 1 },
                ],
              },
              {
                type: 'paragraph',
                format: '',
                indent: 0,
                version: 1,
                direction: 'ltr',
                textFormat: 0,
                children: [
                  {
                    mode: 'normal',
                    text: 'Have a question or a story idea? Visit the Contact page to reach out.',
                    type: 'text',
                    style: '',
                    detail: 0,
                    format: 0,
                    version: 1,
                  },
                ],
              },
            ],
          },
        },
        enableLink: false,
      },
    ],
  },
]

const contactIntroContent: NonNullable<FormBlock['introContent']> = {
  root: {
    type: 'root',
    format: '',
    indent: 0,
    version: 1,
    direction: 'ltr' as const,
    children: [
      {
        tag: 'h3',
        type: 'heading',
        format: '',
        indent: 0,
        version: 1,
        direction: 'ltr',
        children: [
          { mode: 'normal', text: 'Example contact form:', type: 'text', style: '', detail: 0, format: 0, version: 1 },
        ],
      },
    ],
  },
}

const DEFAULT_HEADER_NAV_TEMPLATE: NonNullable<Header['navItems']> = [
  {
    icon: 'file-plus',
    staffOnly: true,
    link: { type: 'custom' as const, url: '/dashboard/posts/new', label: 'New Post' },
  },
  {
    icon: 'file-text',
    staffOnly: false,
    link: { type: 'custom' as const, url: '/posts', label: 'Posts' },
  },
  {
    icon: 'message-square-text',
    staffOnly: false,
    link: { type: 'custom' as const, url: '/#newsletter', label: 'Newsletter' },
  },
]

async function findOrCreateContactForm(payload: Payload, tenantId: number): Promise<number> {
  const { docs } = await payload.find({
    collection: 'forms',
    depth: 0,
    limit: 1,
    where: { and: [{ tenant: { equals: tenantId } }, { title: { equals: 'Contact Form' } }] },
  })

  if (docs[0]) return docs[0].id as number

  const created = await payload.create({
    collection: 'forms',
    depth: 0,
    data: {
      tenant: tenantId,
      title: 'Contact Form',
      fields: [
        { name: 'name', blockType: 'text', label: 'Name', required: true, width: 100 },
        { name: 'email', blockType: 'email', label: 'Email', required: true, width: 100 },
        { name: 'message', blockType: 'textarea', label: 'Message', required: true, width: 100 },
      ],
      submitButtonLabel: 'Send',
      confirmationType: 'message',
      confirmationMessage: {
        root: {
          type: 'root',
          format: '',
          indent: 0,
          version: 1,
          direction: 'ltr',
          children: [
            {
              type: 'paragraph',
              format: '',
              indent: 0,
              version: 1,
              direction: 'ltr',
              children: [
                { mode: 'normal', text: 'Thanks — we got your message.', type: 'text', style: '', detail: 0, format: 0, version: 1 },
              ],
            },
          ],
        },
      },
    },
  })

  return created.id as number
}

async function findOrCreatePage(
  payload: Payload,
  tenantId: number,
  slug: 'about' | 'contact',
  data: Omit<RequiredDataFromCollectionSlug<'pages'>, 'slug' | 'tenant'>,
): Promise<number> {
  const { docs } = await payload.find({
    collection: 'pages',
    depth: 0,
    limit: 1,
    where: { and: [{ tenant: { equals: tenantId } }, { slug: { equals: slug } }] },
  })

  if (docs[0]) return docs[0].id as number

  const created = await payload.create({
    collection: 'pages',
    depth: 0,
    draft: false,
    context: { disableRevalidate: true },
    data: { ...data, tenant: tenantId, slug, _status: 'published' },
  })

  return created.id as number
}

/**
 * Ensures a tenant has About/Contact pages and a header nav matching the
 * standard set (New Post, Posts, Newsletter, About, Contact). Safe to call
 * repeatedly — pages are looked up by slug before creating, and the header's
 * navItems are only replaced with the standard set if it doesn't already
 * carry an About/Contact link (so custom links added later aren't clobbered).
 */
export async function ensureDefaultTenantContent(payload: Payload, tenantId: number): Promise<void> {
  const contactFormId = await findOrCreateContactForm(payload, tenantId)

  const [aboutPageId, contactPageId] = await Promise.all([
    findOrCreatePage(payload, tenantId, 'about', {
      title: 'About',
      hero: { type: 'none' },
      layout: aboutLayout,
      meta: { title: 'About', description: 'Who we are and what this site is about.' },
    }),
    findOrCreatePage(payload, tenantId, 'contact', {
      title: 'Contact',
      hero: { type: 'none' },
      layout: [
        {
          blockType: 'formBlock',
          enableIntro: true,
          form: contactFormId,
          introContent: contactIntroContent,
        },
      ],
      meta: { title: 'Contact', description: 'Get in touch.' },
    }),
  ])

  const { docs: headerDocs } = await payload.find({
    collection: 'header',
    depth: 0,
    limit: 1,
    where: { tenant: { equals: tenantId } },
  })

  const existingHeader = headerDocs[0]
  const existingNavItems = (existingHeader?.navItems || []) as Array<{ link?: { label?: string } }>

  const hasAbout = existingNavItems.some((item) => item.link?.label === 'About')
  const hasContact = existingNavItems.some((item) => item.link?.label === 'Contact')

  if (hasAbout && hasContact) return

  const navItems: NonNullable<Header['navItems']> = [
    ...(existingNavItems.length > 0
      ? (existingHeader?.navItems ?? [])
      : DEFAULT_HEADER_NAV_TEMPLATE),
    ...(hasAbout
      ? []
      : [
          {
            icon: 'info' as const,
            staffOnly: false,
            link: {
              type: 'reference' as const,
              label: 'About',
              reference: { relationTo: 'pages' as const, value: aboutPageId },
            },
          },
        ]),
    ...(hasContact
      ? []
      : [
          {
            icon: 'mail' as const,
            staffOnly: false,
            link: {
              type: 'reference' as const,
              label: 'Contact',
              reference: { relationTo: 'pages' as const, value: contactPageId },
            },
          },
        ]),
  ]

  if (existingHeader) {
    await payload.update({
      collection: 'header',
      id: existingHeader.id,
      depth: 0,
      context: { disableRevalidate: true },
      data: { navItems },
    })
  } else {
    await payload.create({
      collection: 'header',
      depth: 0,
      context: { disableRevalidate: true },
      data: { tenant: tenantId, navItems },
    })
  }
}
