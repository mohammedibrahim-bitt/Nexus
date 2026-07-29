import type { BasePayload } from 'payload'

import type { AiProvider } from './aiClient'
import type { CompetitorAnalysis } from './analyzeCompetitor'

import { analyzeCompetitor } from './analyzeCompetitor'
import { articleToLexical } from './articleToLexical'
import { fetchCompetitorPage } from './fetchPage'
import { findSimilarExistingPost } from './findSimilarExistingPost'
import { generateHeroImage } from './generateHeroImage'
import { fetchTopRankingPages } from './serp'
import { synthesizeStrategy } from './synthesizeStrategy'
import { withRetry } from './withRetry'
import { writeArticle } from './writeArticle'

const MAX_COMPETITORS = 5
const MAX_LINK_TARGETS = 30

const slugify = (text: string): string =>
  text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')

const uniqueSlug = async (payload: BasePayload, base: string): Promise<string> => {
  let candidate = base
  let suffix = 1

  while (true) {
    const { totalDocs } = await payload.count({
      collection: 'posts',
      where: { slug: { equals: candidate } },
    })

    if (totalDocs === 0) return candidate

    suffix += 1
    candidate = `${base}-${suffix}`
  }
}

const fail = async (payload: BasePayload, runId: number | string, message: string) => {
  payload.logger.error(`[seoResearch] run ${runId} failed: ${message}`)
  await payload.update({
    id: runId,
    collection: 'seo-research-runs',
    context: { disableRevalidate: true },
    data: { error: message, status: 'failed' },
  })
}

export async function runSeoResearch(
  payload: BasePayload,
  runId: number | string,
  keys: { aiApiKey: string; aiProvider: AiProvider; authorId: number; serpApiKey: string },
): Promise<void> {
  const run = await payload.findByID({ id: runId, collection: 'seo-research-runs' })
  const keyword = run.keyword
  const { aiApiKey, aiProvider, authorId, serpApiKey } = keys

  if (!keyword || !keyword.trim()) {
    await fail(payload, runId, 'No keyword was provided.')
    return
  }

  // Phase 1: find top-ranking pages
  await payload.update({
    id: runId,
    collection: 'seo-research-runs',
    context: { disableRevalidate: true },
    data: { status: 'researching' },
  })

  let serp
  try {
    serp = await withRetry(() => fetchTopRankingPages(keyword, serpApiKey, MAX_COMPETITORS), {
      onRetry: (attempt, err) =>
        payload.logger.warn(`[seoResearch] SerpApi attempt ${attempt} failed, retrying: ${err}`),
    })
  } catch (err) {
    await fail(payload, runId, err instanceof Error ? err.message : 'SerpApi request failed.')
    return
  }

  if (serp.error || serp.urls.length === 0) {
    await fail(payload, runId, serp.error || 'No competitor pages found.')
    return
  }

  await payload.update({
    id: runId,
    collection: 'seo-research-runs',
    context: { disableRevalidate: true },
    data: { competitorUrls: serp.urls.map((url) => ({ url })) },
  })

  // Phase 2: fetch + analyze each competitor
  await payload.update({
    id: runId,
    collection: 'seo-research-runs',
    context: { disableRevalidate: true },
    data: { status: 'analyzing' },
  })

  const analyses: CompetitorAnalysis[] = []
  for (const url of serp.urls) {
    const page = await fetchCompetitorPage(url)
    if (page.error || !page.text) {
      payload.logger.warn(`[seoResearch] skipping ${url}: ${page.error || 'no text extracted'}`)
      continue
    }

    try {
      const analysis = await withRetry(() => analyzeCompetitor(keyword, page, aiApiKey, aiProvider))
      analyses.push(analysis)
    } catch (err) {
      payload.logger.warn(
        `[seoResearch] analysis failed for ${url}: ${err instanceof Error ? err.message : err}`,
      )
    }
  }

  if (analyses.length === 0) {
    await fail(payload, runId, 'Could not fetch or analyze any competitor page.')
    return
  }

  await payload.update({
    id: runId,
    collection: 'seo-research-runs',
    context: { disableRevalidate: true },
    data: { analysis: analyses },
  })

  // Site-wide duplicate/cannibalization guard: if ANY existing post — from
  // this rule's own past runs, a different rule, or something written by
  // hand — already covers substantially the same topic, feed it in so the
  // strategy/writing steps deliberately take a different angle instead of
  // producing a near-duplicate.
  const previousArticle = await findSimilarExistingPost(payload, keyword, aiApiKey, aiProvider)

  // Phase 3: synthesize strategy
  await payload.update({
    id: runId,
    collection: 'seo-research-runs',
    context: { disableRevalidate: true },
    data: { status: 'strategizing' },
  })

  let strategy
  try {
    strategy = await withRetry(() =>
      synthesizeStrategy(keyword, analyses, aiApiKey, aiProvider, previousArticle),
    )
  } catch (err) {
    await fail(payload, runId, err instanceof Error ? err.message : 'Failed to build strategy.')
    return
  }

  await payload.update({
    id: runId,
    collection: 'seo-research-runs',
    context: { disableRevalidate: true },
    data: { strategy },
  })

  // Phase 4: write the article
  await payload.update({
    id: runId,
    collection: 'seo-research-runs',
    context: { disableRevalidate: true },
    data: { status: 'writing' },
  })

  const { docs: categoryDocs } = await payload.find({
    collection: 'categories',
    limit: 100,
    overrideAccess: false,
  })
  const availableCategories = categoryDocs.map((c) => ({ slug: c.slug || '', title: c.title }))

  const { docs: linkTargetDocs } = await payload.find({
    collection: 'posts',
    limit: MAX_LINK_TARGETS,
    overrideAccess: false,
    select: { slug: true, title: true },
    sort: '-publishedAt',
    where: { _status: { equals: 'published' } },
  })
  const linkTargets = linkTargetDocs
    .filter((p) => p.slug)
    .map((p) => ({ slug: p.slug as string, title: p.title }))

  let article
  try {
    article = await withRetry(() =>
      writeArticle(keyword, strategy, analyses, aiApiKey, aiProvider, {
        availableCategories,
        linkTargets,
        previousArticle,
      }),
    )
  } catch (err) {
    await fail(payload, runId, err instanceof Error ? err.message : 'Failed to write article.')
    return
  }

  const slug = await uniqueSlug(payload, slugify(article.title).slice(0, 80) || 'seo-research-post')

  // Resolve the AI's suggested category (if any) against the real list —
  // never trust an AI-invented slug that doesn't actually exist.
  const matchedCategory = article.categorySlug
    ? categoryDocs.find((c) => c.slug === article.categorySlug)
    : undefined

  // Find-or-create tags for each suggested name.
  const tagIds: number[] = []
  for (const rawName of article.tagNames || []) {
    const name = rawName.trim()
    if (!name) continue

    const tagSlug = slugify(name)
    const { docs: existing } = await payload.find({
      collection: 'tags',
      limit: 1,
      overrideAccess: false,
      where: { slug: { equals: tagSlug } },
    })

    if (existing[0]) {
      tagIds.push(Number(existing[0].id))
      continue
    }

    try {
      const created = await payload.create({
        collection: 'tags',
        context: { disableRevalidate: true },
        data: { title: name, slug: tagSlug },
      })
      tagIds.push(Number(created.id))
    } catch (err) {
      payload.logger.warn(`[seoResearch] could not create tag "${name}": ${err}`)
    }
  }

  // Best-effort hero image — never let a failure here fail the whole run.
  let heroImageId: null | number = null
  try {
    const buffer = await generateHeroImage(
      `A professional, editorial blog header image for an article about: ${article.title}. Photorealistic, no text overlay.`,
      aiApiKey,
      aiProvider,
    )
    if (buffer) {
      const media = await payload.create({
        collection: 'media',
        context: { disableRevalidate: true },
        data: { alt: article.title },
        file: {
          data: buffer,
          mimetype: 'image/png',
          name: `${slug}-hero.png`,
          size: buffer.length,
        },
      })
      heroImageId = Number(media.id)
    }
  } catch (err) {
    payload.logger.warn(`[seoResearch] hero image generation failed, continuing without one: ${err}`)
  }

  const post = await payload.create({
    collection: 'posts',
    context: { disableRevalidate: true },
    data: {
      title: article.title,
      slug,
      _status: 'draft',
      authors: [authorId],
      categories: matchedCategory ? [Number(matchedCategory.id)] : undefined,
      content: articleToLexical(article),
      heroImage: heroImageId ?? undefined,
      meta: {
        description: article.metaDescription,
        title: article.title,
      },
      tags: tagIds.length > 0 ? tagIds : undefined,
    },
  })

  await payload.update({
    id: runId,
    collection: 'seo-research-runs',
    context: { disableRevalidate: true },
    data: { generatedPost: post.id, status: 'completed' },
  })
}
