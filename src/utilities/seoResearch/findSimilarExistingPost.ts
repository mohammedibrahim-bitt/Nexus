import type { BasePayload } from 'payload'

import type { AiProvider } from './aiClient'

import { callWithTool } from './aiClient'

export type SimilarPost = { summary: string; title: string }

const MAX_CANDIDATES = 150

/**
 * Site-wide duplicate/cannibalization check — scans every existing post
 * (regardless of who or what wrote it: manual, a different rule, or this
 * same rule's own past runs) and asks the AI whether any already covers
 * substantially the same topic as the target keyword. If so, that post's
 * title/summary is returned so the strategy/writing steps can deliberately
 * differentiate instead of producing a near-duplicate. Best-effort: any
 * failure here must never block the actual research run.
 */
export async function findSimilarExistingPost(
  payload: BasePayload,
  keyword: string,
  aiApiKey: string,
  aiProvider: AiProvider,
): Promise<null | SimilarPost> {
  try {
    const { docs } = await payload.find({
      collection: 'posts',
      // This is an internal duplicate check, not a user-facing query — it
      // needs to see every post regardless of status (including drafts,
      // including other rules' in-progress work), so it deliberately does
      // NOT restrict to published-only the way public-facing queries do.
      draft: true,
      limit: MAX_CANDIDATES,
      overrideAccess: true,
      select: { title: true, meta: true },
      sort: '-updatedAt',
    })

    const candidates = docs.filter((d) => d.title)
    if (candidates.length === 0) return null

    const result = await callWithTool<{ matchIndex: number }>({
      apiKey: aiApiKey,
      provider: aiProvider,
      maxTokens: 512,
      prompt: `Target keyword/topic: "${keyword}"\n\nExisting post titles (0-indexed):\n${candidates.map((c, i) => `${i}: ${c.title}`).join('\n')}`,
      systemPrompt:
        'Determine whether any existing post already covers substantially the same topic as the target keyword — not just loosely related, but one a reader would consider redundant if both existed. Return the 0-based index of the single closest match, or -1 if none are a genuine topical duplicate.',
      tool: {
        description: 'Report whether a duplicate/near-duplicate topic exists among the listed posts.',
        inputSchema: {
          properties: {
            matchIndex: {
              description: '0-based index of the matching post, or -1 if none genuinely match.',
              type: 'number',
            },
          },
          required: ['matchIndex'],
          type: 'object',
        },
        name: 'report_match',
      },
    })

    if (
      typeof result.matchIndex !== 'number' ||
      result.matchIndex < 0 ||
      result.matchIndex >= candidates.length
    ) {
      return null
    }

    const match = candidates[result.matchIndex]
    return { summary: match.meta?.description || match.title, title: match.title }
  } catch (err) {
    payload.logger.warn(`[seoResearch] duplicate-topic check failed, continuing without it: ${err}`)
    return null
  }
}
