import type { AiProvider } from './aiClient'
import type { CompetitorAnalysis } from './analyzeCompetitor'

import { callWithTool } from './aiClient'

export type ContentStrategy = {
  contentGaps: string[]
  faq: { question: string; whyItMatters: string }[]
  internalLinkSuggestions: string[]
  missedHighIntentQuestions: string[]
  outline: { heading: string; level: number; rationale: string }[]
}

export async function synthesizeStrategy(
  keyword: string,
  analyses: CompetitorAnalysis[],
  apiKey: string,
  provider: AiProvider,
): Promise<ContentStrategy> {
  const summary = analyses
    .map(
      (a, i) =>
        `Competitor ${i + 1} (${a.url}):\n- Search intent satisfied: ${a.searchIntentSatisfied}\n- Section rationale: ${a.sectionRationale}\n- Tone/style: ${a.toneAndStyle}\n- Scores: ${Object.entries(
          a.categoryScores,
        )
          .map(([k, v]) => `${k}=${v.score}`)
          .join(', ')}`,
    )
    .join('\n\n')

  return callWithTool<ContentStrategy>({
    apiKey,
    provider,
    maxTokens: 4096,
    prompt: `Target keyword: "${keyword}"

Competitor analyses:
${summary}`,
    systemPrompt: `You are an expert content strategist. Based on these competitor analyses, identify what's missing across all of them combined — content gaps, and specifically the most personalized, high-intent questions real users ask that none of the competitors answered well. Then propose a heading outline (H2/H3) for an article that would outperform all of them by filling those gaps, a set of FAQ questions with why each matters, and internal linking opportunities (topics/anchor text ideas, not literal URLs since this is a new site). Do not just combine what competitors already do — prioritize genuinely missing angles.`,
    tool: {
      description: 'Submit the content strategy.',
      inputSchema: {
        properties: {
          contentGaps: { items: { type: 'string' }, type: 'array' },
          faq: {
            items: {
              properties: {
                question: { type: 'string' },
                whyItMatters: { type: 'string' },
              },
              required: ['question', 'whyItMatters'],
              type: 'object',
            },
            type: 'array',
          },
          internalLinkSuggestions: { items: { type: 'string' }, type: 'array' },
          missedHighIntentQuestions: { items: { type: 'string' }, type: 'array' },
          outline: {
            items: {
              properties: {
                heading: { type: 'string' },
                level: { enum: [2, 3], type: 'number' },
                rationale: { type: 'string' },
              },
              required: ['heading', 'level', 'rationale'],
              type: 'object',
            },
            type: 'array',
          },
        },
        required: [
          'contentGaps',
          'missedHighIntentQuestions',
          'outline',
          'faq',
          'internalLinkSuggestions',
        ],
        type: 'object',
      },
      name: 'submit_strategy',
    },
  })
}
