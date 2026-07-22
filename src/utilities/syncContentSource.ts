import type { BasePayload } from 'payload'

import type { ContentSource } from '@/payload-types'

import { slugify } from './richTextHeadings'
import { htmlToParagraphs, parseFeed } from './rssParser'

const paragraphsToLexical = (paragraphs: string[]) => ({
  root: {
    type: 'root',
    children: paragraphs.map((text) => ({
      type: 'paragraph',
      children: [{ type: 'text', detail: 0, format: 0, mode: 'normal', style: '', text, version: 1 }],
      direction: 'ltr' as const,
      format: '',
      indent: 0,
      textFormat: 0,
      version: 1,
    })),
    direction: 'ltr' as const,
    format: '',
    indent: 0,
    version: 1,
  },
})

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

export type SyncResult = {
  errors: string[]
  imported: number
  skipped: number
}

export async function syncContentSource(
  payload: BasePayload,
  source: ContentSource,
): Promise<SyncResult> {
  const result: SyncResult = { errors: [], imported: 0, skipped: 0 }

  let items: ReturnType<typeof parseFeed> = []

  try {
    const res = await fetch(source.feedUrl, { signal: AbortSignal.timeout(15000) })
    if (!res.ok) throw new Error(`Feed returned ${res.status}`)
    const xml = await res.text()
    items = parseFeed(xml)
  } catch (err) {
    result.errors.push(err instanceof Error ? err.message : 'Could not fetch feed')
    return result
  }

  const isPublishable = Boolean(source.autoPublish && source.defaultReviewer)

  for (const item of items) {
    if (!item.title || !item.link) {
      result.skipped++
      continue
    }

    try {
      const { totalDocs } = await payload.count({
        collection: 'posts',
        where: { sourceUrl: { equals: item.link } },
      })

      if (totalDocs > 0) {
        result.skipped++
        continue
      }

      const paragraphs = item.contentHtml
        ? htmlToParagraphs(item.contentHtml)
        : item.description
          ? htmlToParagraphs(item.description)
          : []

      const slug = await uniqueSlug(payload, slugify(item.title).slice(0, 80) || 'imported-post')

      const reviewerId =
        typeof source.defaultReviewer === 'object' ? source.defaultReviewer?.id : source.defaultReviewer

      await payload.create({
        collection: 'posts',
        context: { disableRevalidate: true },
        data: {
          title: item.title,
          slug,
          _status: isPublishable ? 'published' : 'draft',
          authors: source.defaultAuthor
            ? [typeof source.defaultAuthor === 'object' ? source.defaultAuthor.id : source.defaultAuthor]
            : undefined,
          categories: source.defaultCategory
            ? [
                typeof source.defaultCategory === 'object'
                  ? source.defaultCategory.id
                  : source.defaultCategory,
              ]
            : undefined,
          content: paragraphsToLexical(
            paragraphs.length > 0 ? paragraphs : [item.description || item.title],
          ),
          meta: {
            description: item.description ? htmlToParagraphs(item.description)[0]?.slice(0, 160) : undefined,
            title: item.title,
          },
          publishedAt: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
          reviewedBy: isPublishable ? reviewerId : undefined,
          sourceUrl: item.link,
          syncSource: source.id,
        },
      })

      result.imported++
    } catch (err) {
      result.errors.push(
        `"${item.title}": ${err instanceof Error ? err.message : 'Failed to import'}`,
      )
    }
  }

  return result
}
