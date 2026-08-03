// Imports the committed content-seed/data.json bundle (pages, published posts,
// categories, forms, header/footer nav, and their media) into the database.
// Safe to run on a freshly migrated (empty) database, and safe to re-run: every
// doc is upserted by its natural key (slug/filename/title), and header/footer
// nav is only written if currently empty, so it never overwrites content
// someone has already customized.
//
// Run with: npm run seed:content
import 'dotenv/config'
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { getPayload } from 'payload'
import configPromise from '../../src/payload.config.ts'

const dirname = path.dirname(fileURLToPath(import.meta.url))
const dataDir = path.resolve(dirname, '../../content-seed')
const bundle = JSON.parse(fs.readFileSync(path.join(dataDir, 'data.json'), 'utf-8'))

const payload = await getPayload({ config: configPromise })

// ── Placeholder author (no real account is ever exported/imported) ──
const AUTHOR_EMAIL = 'content-author@example.local'
let author = (
  await payload.find({
    collection: 'users',
    where: { email: { equals: AUTHOR_EMAIL } },
    limit: 1,
  })
).docs[0]

if (!author) {
  author = await payload.create({
    collection: 'users',
    data: {
      name: 'Site Editor',
      email: AUTHOR_EMAIL,
      password: crypto.randomBytes(24).toString('hex'),
      role: 'author',
      _verified: true,
    },
    disableVerificationEmail: true,
  })
  console.log(`Created placeholder author "${AUTHOR_EMAIL}"`)
}

// ── Media ──
const mediaKeyToId = new Map()
for (const m of bundle.media) {
  const existing = (
    await payload.find({
      collection: 'media',
      where: { filename: { equals: m.filename } },
      limit: 1,
    })
  ).docs[0]
  if (existing) {
    mediaKeyToId.set(m.key, existing.id)
    continue
  }
  const filePath = path.join(dataDir, 'media', m.filename)
  if (!fs.existsSync(filePath)) {
    console.warn(`Missing bundled media file "${m.filename}", skipping`)
    continue
  }
  const doc = await payload.create({
    collection: 'media',
    data: { alt: m.alt, caption: m.caption, focalX: m.focalX, focalY: m.focalY },
    filePath,
  })
  mediaKeyToId.set(m.key, doc.id)
}
const resolveMedia = (key) => (key ? (mediaKeyToId.get(key) ?? null) : null)

// ── Categories ──
const categoryKeyToId = new Map()
for (const c of bundle.categories) {
  const existing = (
    await payload.find({ collection: 'categories', where: { slug: { equals: c.slug } }, limit: 1 })
  ).docs[0]
  const doc = existing ?? (await payload.create({ collection: 'categories', data: { title: c.title, slug: c.slug } }))
  categoryKeyToId.set(c.key, doc.id)
}
const resolveCategories = (keys) => (keys || []).map((k) => categoryKeyToId.get(k)).filter(Boolean)

// ── Forms ──
const formKeyToId = new Map()
for (const f of bundle.forms) {
  const existing = (
    await payload.find({ collection: 'forms', where: { title: { equals: f.title } }, limit: 1 })
  ).docs[0]
  const doc =
    existing ??
    (await payload.create({
      collection: 'forms',
      data: {
        title: f.title,
        fields: f.fields,
        submitButtonLabel: f.submitButtonLabel,
        confirmationType: f.confirmationType,
        confirmationMessage: f.confirmationMessage,
        redirect: f.redirect,
        emails: f.emails,
      },
    }))
  formKeyToId.set(f.key, doc.id)
}

const resolveLink = (link) => {
  if (!link || link.type !== 'reference' || !link.reference) return link
  const { relationTo, key } = link.reference
  const value =
    relationTo === 'pages' ? pageKeyToId.get(key) : relationTo === 'posts' ? postKeyToId.get(key) : null
  if (!value) return { ...link, type: 'custom', url: '/', reference: undefined }
  return { ...link, reference: { relationTo, value } }
}

const resolveLayoutBlock = (block) => {
  const out = { ...block }
  if (out.blockType === 'archive') {
    out.categories = resolveCategories(out.categories)
    out.selectedDocs = (out.selectedDocs || [])
      .map((ref) => {
        const id = ref.relationTo === 'pages' ? pageKeyToId.get(ref.key) : postKeyToId.get(ref.key)
        return id ? { relationTo: ref.relationTo, value: id } : null
      })
      .filter(Boolean)
  }
  if (out.blockType === 'mediaBlock') out.media = resolveMedia(out.media)
  if (out.blockType === 'formBlock') out.form = formKeyToId.get(out.form) ?? null
  if (Array.isArray(out.links)) out.links = out.links.map((l) => ({ ...l, link: resolveLink(l.link) }))
  return out
}

// ── Pages (first pass: create/find, no cross-page refs resolved yet) ──
const pageKeyToId = new Map()
for (const p of bundle.pages) {
  const existing = (
    await payload.find({ collection: 'pages', where: { slug: { equals: p.slug } }, limit: 1 })
  ).docs[0]
  if (existing) {
    pageKeyToId.set(p.key, existing.id)
    continue
  }
  const doc = await payload.create({
    collection: 'pages',
    context: { disableRevalidate: true },
    data: {
      title: p.title,
      slug: p.slug,
      generateSlug: false,
      _status: p._status,
      hero: p.hero
        ? {
            ...p.hero,
            media: resolveMedia(p.hero.media),
            links: (p.hero.links || []).map((l) => ({ ...l, link: resolveLink(l.link) })),
          }
        : undefined,
      layout: [],
      meta: p.meta ? { ...p.meta, image: resolveMedia(p.meta.image) } : undefined,
    },
  })
  pageKeyToId.set(p.key, doc.id)
}

// ── Posts ──
const postKeyToId = new Map()
for (const p of bundle.posts) {
  const existing = (
    await payload.find({ collection: 'posts', where: { slug: { equals: p.slug } }, limit: 1 })
  ).docs[0]
  if (existing) {
    postKeyToId.set(p.key, existing.id)
    continue
  }
  const doc = await payload.create({
    collection: 'posts',
    depth: 0,
    context: { disableRevalidate: true },
    data: {
      title: p.title,
      slug: p.slug,
      generateSlug: false,
      _status: p._status,
      publishedAt: p.publishedAt,
      expertVerified: p.expertVerified,
      heroImage: resolveMedia(p.heroImage),
      categories: resolveCategories(p.categories),
      content: p.content,
      comparisonTable: p.comparisonTable,
      sourceUrl: p.sourceUrl,
      meta: p.meta ? { ...p.meta, image: resolveMedia(p.meta.image) } : undefined,
      authors: [author.id],
      reviewedBy: author.id,
    },
  })
  postKeyToId.set(p.key, doc.id)
}

// ── Second pass: layout blocks + relatedPosts that may reference pages/posts ──
for (const p of bundle.pages) {
  if (!p.layout?.length) continue
  const id = pageKeyToId.get(p.key)
  await payload.update({
    collection: 'pages',
    id,
    context: { disableRevalidate: true },
    data: { layout: p.layout.map(resolveLayoutBlock) },
  })
}

for (const p of bundle.posts) {
  const related = (p.relatedPosts || []).map((k) => postKeyToId.get(k)).filter(Boolean)
  if (related.length) {
    await payload.update({
      collection: 'posts',
      id: postKeyToId.get(p.key),
      context: { disableRevalidate: true },
      data: { relatedPosts: related },
    })
  }
}

// ── Header / footer nav — only if currently empty, so we never clobber edits ──
for (const slug of ['header', 'footer']) {
  const current = await payload.findGlobal({ slug, depth: 0 })
  if (current?.navItems?.length) {
    console.log(`Skipping ${slug} nav — already has ${current.navItems.length} item(s)`)
    continue
  }
  const navItems = bundle[slug].navItems.map((item) => ({ ...item, link: resolveLink(item.link) }))
  await payload.updateGlobal({
    slug,
    context: { disableRevalidate: true },
    data: { navItems },
  })
}

console.log(
  `Imported ${bundle.pages.length} pages, ${bundle.posts.length} posts, ${bundle.categories.length} categories, ${bundle.forms.length} forms, ${mediaKeyToId.size} media files.`,
)

process.exit(0)
