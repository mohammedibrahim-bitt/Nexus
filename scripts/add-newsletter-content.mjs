import 'dotenv/config'
import { getPayload } from 'payload'
import configPromise from '../src/payload.config.ts'

const payload = await getPayload({ config: configPromise })

const confirmationMessage = {
  root: {
    type: 'root',
    children: [
      {
        type: 'heading',
        children: [
          { type: 'text', detail: 0, format: 0, mode: 'normal', style: '', text: "You're subscribed!", version: 1 },
        ],
        direction: 'ltr',
        format: '',
        indent: 0,
        tag: 'h3',
        version: 1,
      },
    ],
    direction: 'ltr',
    format: '',
    indent: 0,
    version: 1,
  },
}

const { docs: existingForms } = await payload.find({
  collection: 'forms',
  where: { title: { equals: 'Newsletter Signup' } },
})

let newsletterForm = existingForms[0]

if (!newsletterForm) {
  newsletterForm = await payload.create({
    collection: 'forms',
    data: {
      confirmationMessage,
      confirmationType: 'message',
      fields: [
        {
          name: 'email',
          blockName: 'email',
          blockType: 'email',
          label: 'Email',
          required: true,
          width: 100,
        },
      ],
      submitButtonLabel: 'Subscribe',
      title: 'Newsletter Signup',
    },
  })
  console.log('Created Newsletter Signup form')
} else {
  console.log('Newsletter Signup form already exists')
}

const introContent = {
  root: {
    type: 'root',
    children: [
      {
        type: 'heading',
        children: [{ type: 'text', detail: 0, format: 0, mode: 'normal', style: '', text: 'Subscribe to our newsletter', version: 1 }],
        direction: 'ltr',
        format: '',
        indent: 0,
        tag: 'h2',
        version: 1,
      },
      {
        type: 'paragraph',
        children: [{ type: 'text', detail: 0, format: 0, mode: 'normal', style: '', text: 'Get new posts delivered to your inbox.', version: 1 }],
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

const { docs: pages } = await payload.find({
  collection: 'pages',
  where: { slug: { equals: 'home' } },
})

const homePage = pages[0]

if (!homePage) {
  console.log('Home page not found')
  process.exit(1)
}

const layout = homePage.layout || []
const alreadyHasNewsletterBlock = layout.some(
  (block) => block.blockType === 'formBlock' && block.blockName === 'newsletter',
)

if (!alreadyHasNewsletterBlock) {
  await payload.update({
    id: homePage.id,
    collection: 'pages',
    context: { disableRevalidate: true },
    data: {
      layout: [
        ...layout,
        {
          blockName: 'newsletter',
          blockType: 'formBlock',
          enableIntro: true,
          form: newsletterForm.id,
          introContent,
        },
      ],
    },
  })
  console.log('Added newsletter form block to home page')
} else {
  console.log('Home page already has newsletter block')
}

const hero = homePage.hero || {}
const heroLinks = hero.links || []
const alreadyHasSubscribeButton = heroLinks.some((l) => l.link?.label === 'Subscribe')

if (!alreadyHasSubscribeButton) {
  await payload.update({
    id: homePage.id,
    collection: 'pages',
    context: { disableRevalidate: true },
    data: {
      hero: {
        ...hero,
        links: [
          ...heroLinks,
          {
            link: {
              type: 'custom',
              url: '/#newsletter',
              label: 'Subscribe',
              newTab: false,
              appearance: 'outline',
            },
          },
        ],
      },
    },
  })
  console.log('Added Subscribe button to homepage hero')
} else {
  console.log('Hero already has Subscribe button')
}

const header = await payload.findGlobal({ slug: 'header' })
const headerNavItems = header.navItems || []
const headerHasNewsletter = headerNavItems.some((i) => i.link?.label === 'Newsletter')

if (!headerHasNewsletter) {
  await payload.updateGlobal({
    slug: 'header',
    context: { disableRevalidate: true },
    data: {
      navItems: [
        ...headerNavItems,
        {
          link: { type: 'custom', url: '/#newsletter', label: 'Newsletter', newTab: false },
          icon: 'mail',
        },
      ],
    },
  })
  console.log('Added Newsletter link to header nav')
} else {
  console.log('Header nav already has Newsletter link')
}

const footer = await payload.findGlobal({ slug: 'footer' })
const footerNavItems = footer.navItems || []
const footerHasNewsletter = footerNavItems.some((i) => i.link?.label === 'Newsletter')
const footerHasAllPosts = footerNavItems.some((i) => i.link?.label === 'All Posts')

const footerAdditions = []
if (!footerHasAllPosts) {
  footerAdditions.push({ link: { type: 'custom', url: '/posts', label: 'All Posts', newTab: false } })
}
if (!footerHasNewsletter) {
  footerAdditions.push({
    link: { type: 'custom', url: '/#newsletter', label: 'Newsletter', newTab: false },
  })
}

if (footerAdditions.length > 0) {
  await payload.updateGlobal({
    slug: 'footer',
    context: { disableRevalidate: true },
    data: { navItems: [...footerNavItems, ...footerAdditions] },
  })
  console.log('Added link(s) to footer nav')
} else {
  console.log('Footer nav already up to date')
}

console.log('Done')
process.exit(0)
