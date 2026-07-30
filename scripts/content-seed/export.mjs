// One-off export: pulls the site's real, non-sensitive content (pages, published
// posts, categories, forms, header/footer nav, and the media they reference) out
// of the live database into content-seed/data.json + content-seed/media/, so it
// can be committed to git and re-imported by anyone who clones the repo.
//
// Deliberately excludes: the users collection (accounts, password hashes,
// per-user aiApiKey/serpApiKey), draft posts, reviews, form submissions, and
// SEO agent run history.
//
// Run with: node --import tsx/esm scripts/content-seed/export.mjs
import 'dotenv/config'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { getPayload } from 'payload'
import configPromise from '../../src/payload.config.ts'

const dirname = path.dirname(fileURLToPath(import.meta.url))
const outDir = path.resolve(dirname, '../../content-seed')
const mediaOutDir = path.join(outDir, 'media')
const publicMediaDir = path.resolve(dirname, '../../public/media')

fs.mkdirSync(mediaOutDir, { recursive: true })

const payload = await getPayload({ config: configPromise })

const usedMediaIds = new Set()

const mediaDocs = await payload.find({ collection: 'media', depth: 0, limit: 1000 })
const mediaById = new Map(mediaDocs.docs.map((m) => [m.id, m]))

const categoryDocs = await payload.find({ collection: 'categories', depth: 0, limit: 1000 })
const categoryById = new Map(categoryDocs.docs.map((c) => [c.id, c]))

const tagDocs = await payload
  .find({ collection: 'tags', depth: 0, limit: 1000 })
  .catch(() => ({ docs: [] }))
const tagById = new Map(tagDocs.docs.map((t) => [t.id, t]))

const pageDocs = await payload.find({ collection: 'pages', depth: 0, limit: 1000 })
const pageById = new Map(pageDocs.docs.map((p) => [p.id, p]))

const postDocs = await payload.find({
  collection: 'posts',
  depth: 0,
  limit: 1000,
  where: { _status: { equals: 'published' } },
})
const postById = new Map(postDocs.docs.map((p) => [p.id, p]))

const formDocs = await payload.find({ collection: 'forms', depth: 0, limit: 1000 })
const formById = new Map(formDocs.docs.map((f) => [f.id, f]))

const mediaKey = (id) => {
  if (!id) return null
  const doc = mediaById.get(id)
  if (!doc) return null
  usedMediaIds.add(id)
  return doc.filename
}
const categoryKey = (id) => categoryById.get(id)?.slug ?? null
const tagKey = (id) => tagById.get(id)?.slug ?? null
const pageKey = (id) => pageById.get(id)?.slug ?? null
const postKey = (id) => postById.get(id)?.slug ?? null
const formKey = (id) => formById.get(id)?.title ?? null

// Resolves any {relationTo, value} polymorphic reference wrapper (used by nav
// links and archive-block selectedDocs) to a portable {relationTo, key}.
const resolveRelation = (ref) => {
  if (!ref || typeof ref !== 'object') return ref
  const { relationTo, value } = ref
  if (!relationTo || value === undefined) return ref
  const id = typeof value === 'object' ? value?.id : value
  let key = null
  if (relationTo === 'pages') key = pageKey(id)
  else if (relationTo === 'posts') key = postKey(id)
  else if (relationTo === 'media') key = mediaKey(id)
  else if (relationTo === 'categories') key = categoryKey(id)
  else return null // e.g. users — never export
  return key ? { relationTo, key } : null
}

const resolveLink = (link) => {
  if (!link) return link
  const out = { ...link }
  if (link.type === 'reference' && link.reference) {
    out.reference = resolveRelation(link.reference)
  }
  return out
}

const resolveLayoutBlock = (block) => {
  const out = { ...block }
  if (out.blockType === 'archive') {
    out.categories = (out.categories || []).map(categoryKey).filter(Boolean)
    out.selectedDocs = (out.selectedDocs || []).map(resolveRelation).filter(Boolean)
  }
  if (out.blockType === 'mediaBlock' && out.media) {
    out.media = mediaKey(out.media)
  }
  if (out.blockType === 'formBlock' && out.form) {
    out.form = formKey(out.form)
  }
  if (Array.isArray(out.links)) {
    out.links = out.links.map((l) => ({ ...l, link: resolveLink(l.link) }))
  }
  return out
}

const exportedPages = pageDocs.docs.map((p) => ({
  key: p.slug,
  slug: p.slug,
  title: p.title,
  _status: p._status,
  hero: p.hero
    ? {
        ...p.hero,
        media: mediaKey(p.hero.media),
        links: (p.hero.links || []).map((l) => ({ ...l, link: resolveLink(l.link) })),
      }
    : undefined,
  layout: (p.layout || []).map(resolveLayoutBlock),
  meta: p.meta ? { ...p.meta, image: mediaKey(p.meta.image) } : undefined,
}))

const exportedPosts = postDocs.docs.map((p) => ({
  key: p.slug,
  slug: p.slug,
  title: p.title,
  _status: p._status,
  publishedAt: p.publishedAt,
  expertVerified: p.expertVerified,
  heroImage: mediaKey(p.heroImage),
  categories: (p.categories || []).map(categoryKey).filter(Boolean),
  tags: (p.tags || []).map(tagKey).filter(Boolean),
  relatedPosts: (p.relatedPosts || []).map(postKey).filter(Boolean),
  content: p.content,
  comparisonTable: p.comparisonTable ?? undefined,
  sourceUrl: p.sourceUrl ?? undefined,
  meta: p.meta ? { ...p.meta, image: mediaKey(p.meta.image) } : undefined,
}))

const exportGlobalNav = (navItems) =>
  (navItems || []).map((item) => ({
    ...item,
    id: undefined,
    link: resolveLink(item.link),
  }))

const header = await payload.findGlobal({ slug: 'header', depth: 0 })
const footer = await payload.findGlobal({ slug: 'footer', depth: 0 })

const exportedMedia = [...usedMediaIds].map((id) => {
  const m = mediaById.get(id)
  return {
    key: m.filename,
    filename: m.filename,
    alt: m.alt ?? null,
    caption: m.caption ?? null,
    focalX: m.focalX,
    focalY: m.focalY,
  }
})

for (const m of exportedMedia) {
  const src = path.join(publicMediaDir, m.filename)
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, path.join(mediaOutDir, m.filename))
  } else {
    console.warn(`Missing source file for media "${m.filename}", skipping copy`)
  }
}

const exportedCategories = categoryDocs.docs.map((c) => ({
  key: c.slug,
  slug: c.slug,
  title: c.title,
}))

const exportedForms = formDocs.docs.map((f) => ({
  key: f.title,
  title: f.title,
  fields: f.fields,
  submitButtonLabel: f.submitButtonLabel,
  confirmationType: f.confirmationType,
  confirmationMessage: f.confirmationMessage,
  redirect: f.redirect,
  emails: f.emails,
}))

const bundle = {
  media: exportedMedia,
  categories: exportedCategories,
  forms: exportedForms,
  pages: exportedPages,
  posts: exportedPosts,
  header: { navItems: exportGlobalNav(header?.navItems) },
  footer: { navItems: exportGlobalNav(footer?.navItems) },
}

fs.writeFileSync(path.join(outDir, 'data.json'), JSON.stringify(bundle, null, 2))

console.log(
  `Exported ${exportedPages.length} pages, ${exportedPosts.length} posts, ${exportedCategories.length} categories, ${exportedForms.length} forms, ${exportedMedia.length} media files.`,
)

process.exit(0)
