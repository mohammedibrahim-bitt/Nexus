import 'dotenv/config'
import { getPayload } from 'payload'
import configPromise from '../src/payload.config.ts'

const payload = await getPayload({ config: configPromise })

const heading = (text, tag = 'h2') => ({
  type: 'heading',
  children: [{ type: 'text', detail: 0, format: 0, mode: 'normal', style: '', text, version: 1 }],
  direction: 'ltr',
  format: '',
  indent: 0,
  tag,
  version: 1,
})

const paragraph = (text) => ({
  type: 'paragraph',
  children: [{ type: 'text', detail: 0, format: 0, mode: 'normal', style: '', text, version: 1 }],
  direction: 'ltr',
  format: '',
  indent: 0,
  textFormat: 0,
  version: 1,
})

const doc = (nodes) => ({
  root: {
    type: 'root',
    children: nodes,
    direction: 'ltr',
    format: '',
    indent: 0,
    version: 1,
  },
})

const contentBlock = (nodes) => ({
  blockType: 'content',
  columns: [{ size: 'full', richText: doc(nodes), enableLink: false }],
})

const pagesToCreate = [
  {
    slug: 'about',
    title: 'About',
    metaTitle: 'About',
    metaDescription: 'Who we are and what this site is about.',
    layout: [
      contentBlock([
        heading('About this site', 'h1'),
        paragraph(
          'This is a placeholder About page. Replace this text with your own story: who you are, why you started this blog, and what readers can expect to find here.',
        ),
        heading('What we cover'),
        paragraph(
          'Describe your focus areas here — the topics, beats, or themes that define your content.',
        ),
        heading('Get in touch'),
        paragraph('Have a question or a story idea? Visit the Contact page to reach out.'),
      ]),
    ],
  },
  {
    slug: 'privacy-policy',
    title: 'Privacy Policy',
    metaTitle: 'Privacy Policy',
    metaDescription: 'How we collect, use, and protect your information.',
    layout: [
      contentBlock([
        heading('Privacy Policy', 'h1'),
        paragraph(
          'This is placeholder legal text and not legal advice. Replace it with a privacy policy reviewed by a qualified professional before publishing this site.',
        ),
        heading('Information we collect'),
        paragraph(
          'We may collect information you provide directly, such as your name and email address when you contact us or subscribe to our newsletter.',
        ),
        heading('How we use your information'),
        paragraph(
          'We use the information we collect to respond to inquiries, send newsletter updates you have opted into, and improve our content.',
        ),
        heading('Third-party services'),
        paragraph(
          'We may use third-party services (such as analytics or email delivery providers) that process data on our behalf, subject to their own privacy policies.',
        ),
        heading('Your choices'),
        paragraph(
          'You can unsubscribe from our newsletter at any time. To request removal of your data, contact us using the details on our Contact page.',
        ),
      ]),
    ],
  },
  {
    slug: 'terms-of-service',
    title: 'Terms of Service',
    metaTitle: 'Terms of Service',
    metaDescription: 'The terms that govern your use of this site.',
    layout: [
      contentBlock([
        heading('Terms of Service', 'h1'),
        paragraph(
          'This is placeholder legal text and not legal advice. Replace it with terms of service reviewed by a qualified professional before publishing this site.',
        ),
        heading('Use of this site'),
        paragraph(
          'By using this site, you agree to use it only for lawful purposes and in a way that does not infringe the rights of others.',
        ),
        heading('Content'),
        paragraph(
          'All content on this site is provided for informational purposes only and is not professional advice unless explicitly stated.',
        ),
        heading('Changes to these terms'),
        paragraph(
          'We may update these terms from time to time. Continued use of the site after changes constitutes acceptance of the updated terms.',
        ),
      ]),
    ],
  },
]

for (const { slug, title, metaTitle, metaDescription, layout } of pagesToCreate) {
  const { docs: existing } = await payload.find({
    collection: 'pages',
    where: { slug: { equals: slug } },
  })

  if (existing.length > 0) {
    console.log(`Page "${slug}" already exists, skipping`)
    continue
  }

  await payload.create({
    collection: 'pages',
    context: { disableRevalidate: true },
    data: {
      title,
      slug,
      _status: 'published',
      hero: { type: 'none' },
      layout,
      meta: { title: metaTitle, description: metaDescription },
    },
  })

  console.log(`Created page "${slug}"`)
}

console.log('Done')
process.exit(0)
