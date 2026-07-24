import type { AiProvider } from './aiClient'
import type { CompetitorAnalysis } from './analyzeCompetitor'
import type { ContentStrategy } from './synthesizeStrategy'

import { callWithTool } from './aiClient'

export type GeneratedArticle = {
  faq: { answer: string; question: string }[]
  metaDescription: string
  sections: { heading: string; level: 2 | 3; paragraphs: string[] }[]
  title: string
}

export async function writeArticle(
  keyword: string,
  strategy: ContentStrategy,
  analyses: CompetitorAnalysis[],
  apiKey: string,
  provider: AiProvider,
): Promise<GeneratedArticle> {
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

Competitor count analyzed: ${analyses.length}`,
    systemPrompt: `You are an expert blog writer. Write a completely original, SEO-optimized article for the target keyword, following the approved outline. Combine the strengths of what top competitors do well while genuinely filling the identified gaps and answering the missed high-intent questions in the body text — don't just copy competitor structure. Write in clear, engaging prose with concrete specifics (not generic filler). Each section should have 1-3 substantial paragraphs. Do not fabricate statistics, studies, or quotes you cannot verify — write authoritatively without inventing false citations. Produce a compelling title, a meta description under 160 characters, the body sections, and a FAQ section.`,
    tool: {
      description: 'Submit the finished article.',
      inputSchema: {
        properties: {
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
                paragraphs: { items: { type: 'string' }, type: 'array' },
              },
              required: ['heading', 'level', 'paragraphs'],
              type: 'object',
            },
            type: 'array',
          },
          title: { type: 'string' },
        },
        required: ['title', 'metaDescription', 'sections', 'faq'],
        type: 'object',
      },
      name: 'submit_article',
    },
  })
}
