import 'dotenv/config'
import { getPayload } from 'payload'
import configPromise from '../src/payload.config.ts'

const payload = await getPayload({ config: configPromise })

const { docs: pages } = await payload.find({
  collection: 'pages',
  where: { slug: { equals: 'home' } },
})

const homePage = pages[0]

if (!homePage) {
  console.log('Home page not found')
  process.exit(1)
}

const heroRichText = {
  root: {
    type: 'root',
    children: [
      {
        type: 'heading',
        children: [
          { type: 'text', detail: 0, format: 0, mode: 'normal', style: '', text: 'Nexus', version: 1 },
        ],
        direction: 'ltr',
        format: '',
        indent: 0,
        tag: 'h1',
        version: 1,
      },
      {
        type: 'paragraph',
        children: [
          {
            type: 'link',
            children: [
              { type: 'text', detail: 0, format: 0, mode: 'normal', style: '', text: 'Visit the admin dashboard', version: 1 },
            ],
            direction: 'ltr',
            fields: { linkType: 'custom', newTab: false, url: '/admin' },
            format: '',
            indent: 0,
            version: 3,
          },
          {
            type: 'text',
            detail: 0,
            format: 0,
            mode: 'normal',
            style: '',
            text: ' to begin managing this site’s content.',
            version: 1,
          },
        ],
        direction: 'ltr',
        format: '',
        indent: 0,
        textFormat: 0,
        version: 1,
      },
    ],
    direction: 'ltr',
    format: '',
    indent: 0,
    version: 1,
  },
}

await payload.update({
  id: homePage.id,
  collection: 'pages',
  context: { disableRevalidate: true },
  data: {
    hero: {
      ...homePage.hero,
      richText: heroRichText,
    },
    meta: {
      ...homePage.meta,
      title: 'Nexus',
      description: 'Nexus — a blog built with Payload and Next.js.',
    },
  },
})

console.log('Updated home page hero text to Nexus')
process.exit(0)
