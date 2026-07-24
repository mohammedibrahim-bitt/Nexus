import type { BasePayload } from 'payload'

import type { AiProvider } from './aiClient'

import { analyzeCompetitor } from './analyzeCompetitor'
import { articleToLexical } from './articleToLexical'
import { fetchCompetitorPage } from './fetchPage'
import { fetchTopRankingPages } from './serp'
import { synthesizeStrategy } from './synthesizeStrategy'
import { writeArticle } from './writeArticle'

const MAX_COMPETITORS = 5

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

  const serp = await fetchTopRankingPages(keyword, serpApiKey, MAX_COMPETITORS)
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

  const analyses = []
  for (const url of serp.urls) {
    const page = await fetchCompetitorPage(url)
    if (page.error || !page.text) {
      payload.logger.warn(`[seoResearch] skipping ${url}: ${page.error || 'no text extracted'}`)
      continue
    }

    try {
      analyses.push(await analyzeCompetitor(keyword, page, aiApiKey, aiProvider))
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

  // Phase 3: synthesize strategy
  await payload.update({
    id: runId,
    collection: 'seo-research-runs',
    context: { disableRevalidate: true },
    data: { status: 'strategizing' },
  })

  let strategy
  try {
    strategy = await synthesizeStrategy(keyword, analyses, aiApiKey, aiProvider)
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

  let article
  try {
    article = await writeArticle(keyword, strategy, analyses, aiApiKey, aiProvider)
  } catch (err) {
    await fail(payload, runId, err instanceof Error ? err.message : 'Failed to write article.')
    return
  }

  const slug = await uniqueSlug(payload, slugify(article.title).slice(0, 80) || 'seo-research-post')

  const post = await payload.create({
    collection: 'posts',
    context: { disableRevalidate: true },
    data: {
      title: article.title,
      slug,
      _status: 'draft',
      authors: [authorId],
      content: articleToLexical(article),
      meta: {
        description: article.metaDescription,
        title: article.title,
      },
    },
  })

  await payload.update({
    id: runId,
    collection: 'seo-research-runs',
    context: { disableRevalidate: true },
    data: { generatedPost: post.id, status: 'completed' },
  })
}
