import 'dotenv/config'
import { getPayload } from 'payload'
import configPromise from '../src/payload.config.ts'

const payload = await getPayload({ config: configPromise })

const header = await payload.findGlobal({ slug: 'header' })
const headerNavItems = header.navItems || []
const headerHasAbout = headerNavItems.some((i) => i.link?.label === 'About')

if (!headerHasAbout) {
  await payload.updateGlobal({
    slug: 'header',
    context: { disableRevalidate: true },
    data: {
      navItems: [
        ...headerNavItems,
        {
          link: { type: 'reference', label: 'About', newTab: false, reference: { relationTo: 'pages', value: null } },
          icon: 'info',
        },
      ],
    },
  })
  console.log('Added About to header — will fix reference next')
}

// Re-fetch and set the reference value properly (Payload needs the actual page id)
const { docs: aboutPages } = await payload.find({ collection: 'pages', where: { slug: { equals: 'about' } } })
const aboutId = aboutPages[0]?.id

if (aboutId) {
  const headerNow = await payload.findGlobal({ slug: 'header' })
  const items = (headerNow.navItems || []).map((item) =>
    item.link?.label === 'About'
      ? { ...item, link: { ...item.link, reference: { relationTo: 'pages', value: aboutId } } }
      : item,
  )
  await payload.updateGlobal({
    slug: 'header',
    context: { disableRevalidate: true },
    data: { navItems: items },
  })
  console.log('Linked About nav item to page id', aboutId)
}

const footer = await payload.findGlobal({ slug: 'footer' })
const footerNavItems = footer.navItems || []

const footerLinksToAdd = [
  { label: 'Categories', url: '/categories' },
  { label: 'Tags', url: '/tags' },
  { label: 'Archive', url: '/archive' },
  { label: 'RSS', url: '/feed.xml' },
  { label: 'Privacy Policy', url: '/privacy-policy' },
  { label: 'Terms', url: '/terms-of-service' },
]

const additions = footerLinksToAdd
  .filter((l) => !footerNavItems.some((i) => i.link?.label === l.label))
  .map((l) => ({ link: { type: 'custom', label: l.label, url: l.url, newTab: false } }))

if (additions.length > 0) {
  await payload.updateGlobal({
    slug: 'footer',
    context: { disableRevalidate: true },
    data: { navItems: [...footerNavItems, ...additions] },
  })
  console.log(
    'Added footer links:',
    additions.map((a) => a.link.label).join(', '),
  )
} else {
  console.log('Footer already has all links')
}

console.log('Done')
process.exit(0)
