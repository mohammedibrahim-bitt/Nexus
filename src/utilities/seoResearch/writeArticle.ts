import type { AiProvider } from './aiClient'
import type { CompetitorAnalysis } from './analyzeCompetitor'
import type { ContentStrategy } from './synthesizeStrategy'

import { callWithTool } from './aiClient'

export type GeneratedArticle = {
  categorySlug?: string
  comparisonTable?: { headers: string[]; rows: string[][] }
  faq: { answer: string; question: string }[]
  metaDescription: string
  sections: { heading: string; level: 2 | 3; paragraphs: string[] }[]
  tagNames: string[]
  title: string
}

export type LinkTarget = { slug: string; title: string }
export type PreviousArticle = { summary: string; title: string }

export async function writeArticle(
  keyword: string,
  strategy: ContentStrategy,
  analyses: CompetitorAnalysis[],
  apiKey: string,
  provider: AiProvider,
  options: {
    availableCategories?: { slug: string; title: string }[]
    linkTargets?: LinkTarget[]
    previousArticle?: null | PreviousArticle
  } = {},
): Promise<GeneratedArticle> {
  const { availableCategories = [], linkTargets = [], previousArticle } = options

  return callWithTool<GeneratedArticle>({
    apiKey,
    provider,
    maxTokens: 8192,
    prompt: `Target keyword: "${keyword}"

Approved outline:
${strategy.outline.map((o) => `${'#'.repeat(o.level)} ${o.heading} — ${o.rationale}`).join('\n')}

Content gaps to fill:
${strategy.contentGaps.join('\n')}

High-intent questions competitors missed (make sure these are genuinely answered in the body, not just the FAQ):
${strategy.missedHighIntentQuestions.join('\n')}

FAQ to include:
${strategy.faq.map((f) => `Q: ${f.question}`).join('\n')}

Competitor count analyzed: ${analyses.length}

${
  availableCategories.length > 0
    ? `Available categories (pick the single best fit by slug, or omit if none genuinely fit):\n${availableCategories.map((c) => `- ${c.slug}: ${c.title}`).join('\n')}`
    : 'No categories are available to assign.'
}

${
  linkTargets.length > 0
    ? `Existing posts you may link to naturally within the body, using markdown link syntax [anchor text](/posts/the-slug) — ONLY use slugs from this exact list, only where genuinely relevant to the surrounding sentence, at most 2-4 links total across the whole article, never force one in:\n${linkTargets.map((p) => `- /posts/${p.slug}: ${p.title}`).join('\n')}`
    : 'No existing posts are available to link to — write the article with no internal links.'
}

${
  previousArticle
    ? `IMPORTANT — this keyword was already covered before, in an earlier article titled "${previousArticle.title}":\n${previousArticle.summary}\n\nDo not rewrite that article. Take a genuinely different, updated angle — new developments, corrections, expanded scope, or a different framing — so this reads as a fresh, non-redundant piece rather than a near-duplicate.`
    : ''
}

If — and only if — this keyword is genuinely a comparison between two or more distinct named things (products, tools, services, places, options a reader is choosing between — e.g. "X vs Y", "best X for Y" roundups comparing named options, "X alternatives"), include a comparisonTable: one row per thing being compared, with consistent columns across all rows (e.g. Price, Best For, Key Feature, Rating — pick columns that actually matter for this comparison). Omit comparisonTable entirely for any article that isn't genuinely comparing distinct named things — never invent a table for a plain how-to or informational article.`,
    systemPrompt: `You are an expert blog writer. Write a completely original, SEO-optimized article for the target keyword, following the approved outline. Combine the strengths of what top competitors do well while genuinely filling the identified gaps and answering the missed high-intent questions in the body text — don't just copy competitor structure. Write in clear, engaging prose with concrete specifics (not generic filler). Each section should have 1-3 substantial paragraphs. Do not fabricate statistics, studies, or quotes you cannot verify — write authoritatively without inventing false citations. Produce a compelling title, a meta description under 160 characters, the body sections, a FAQ section, a best-fit category (if any were provided), 2-5 relevant tag names, natural internal links (only using the exact provided slugs, if any were provided), and — only for genuine comparison content — a comparison table.`,
    tool: {
      description: 'Submit the finished article.',
      inputSchema: {
        properties: {
          categorySlug: {
            description:
              'The slug of the single best-fit category from the provided list. Omit this field entirely if none genuinely fit.',
            type: 'string',
          },
          comparisonTable: {
            description:
              'Only for genuine comparisons between distinct named things. Omit entirely otherwise.',
            properties: {
              headers: {
                description: 'Column headers. First column is typically the name of the thing being compared.',
                items: { type: 'string' },
                type: 'array',
              },
              rows: {
                description: 'One row per thing compared, values in the same order as headers.',
                items: { items: { type: 'string' }, type: 'array' },
                type: 'array',
              },
            },
            required: ['headers', 'rows'],
            type: 'object',
          },
          faq: {
            items: {
              properties: {
                answer: { type: 'string' },
                question: { type: 'string' },
              },
              required: ['question', 'answer'],
              type: 'object',
            },
            type: 'array',
          },
          metaDescription: { type: 'string' },
          sections: {
            items: {
              properties: {
                heading: { type: 'string' },
                level: { enum: [2, 3], type: 'number' },
                paragraphs: {
                  description:
                    'Plain prose paragraphs. May include inline markdown links [text](/posts/slug) using only the provided slugs.',
                  items: { type: 'string' },
                  type: 'array',
                },
              },
              required: ['heading', 'level', 'paragraphs'],
              type: 'object',
            },
            type: 'array',
          },
          tagNames: {
            description: '2-5 short, relevant tag names for this article.',
            items: { type: 'string' },
            type: 'array',
          },
          title: { type: 'string' },
        },
        required: ['title', 'metaDescription', 'sections', 'faq', 'tagNames'],
        type: 'object',
      },
      name: 'submit_article',
    },
  })
}
