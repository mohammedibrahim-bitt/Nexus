import type { AiProvider } from './aiClient'
import type { CompetitorPage } from './fetchPage'

import { callWithTool } from './aiClient'

export type CategoryScore = {
  justification: string
  score: number
}

export type CompetitorAnalysis = {
  categoryScores: {
    contentDepth: CategoryScore
    eeat: CategoryScore
    faqCoverage: CategoryScore
    internalLinkingOpportunities: CategoryScore
    originality: CategoryScore
    overallSeoQuality: CategoryScore
    readability: CategoryScore
    searchIntentCoverage: CategoryScore
    semanticKeywordCoverage: CategoryScore
  }
  searchIntentSatisfied: string
  sectionRationale: string
  toneAndStyle: string
  url: string
}

const categorySchema = {
  properties: {
    justification: { type: 'string' },
    score: { description: '0-10', type: 'number' },
  },
  required: ['score', 'justification'],
  type: 'object',
} as const

export async function analyzeCompetitor(
  keyword: string,
  page: CompetitorPage,
  apiKey: string,
  provider: AiProvider,
): Promise<CompetitorAnalysis> {
  const headingOutline = page.headings.map((h) => `${'#'.repeat(h.level)} ${h.text}`).join('\n')

  const analysis = await callWithTool<Omit<CompetitorAnalysis, 'url'>>({
    apiKey,
    provider,
    prompt: `Target keyword: "${keyword}"

Competitor page: ${page.url}
Page title: ${page.title}

Heading structure:
${headingOutline || '(no headings found)'}

Page text (may be truncated):
${page.text || '(no text extracted)'}`,
    systemPrompt: `You are an expert SEO and content strategist. Analyze the given competitor article for the target keyword. Score each category 0-10 with a one-sentence justification. Also explain in 2-3 sentences: what search intent this page satisfies, why its sections/structure exist (what job each is doing), and its overall tone/writing style. Be specific and critical — do not give uniformly high scores.`,
    tool: {
      description: 'Submit the structured competitor analysis.',
      inputSchema: {
        properties: {
          categoryScores: {
            properties: {
              contentDepth: categorySchema,
              eeat: categorySchema,
              faqCoverage: categorySchema,
              internalLinkingOpportunities: categorySchema,
              originality: categorySchema,
              overallSeoQuality: categorySchema,
              readability: categorySchema,
              searchIntentCoverage: categorySchema,
              semanticKeywordCoverage: categorySchema,
            },
            required: [
              'searchIntentCoverage',
              'contentDepth',
              'originality',
              'readability',
              'eeat',
              'semanticKeywordCoverage',
              'faqCoverage',
              'internalLinkingOpportunities',
              'overallSeoQuality',
            ],
            type: 'object',
          },
          searchIntentSatisfied: { type: 'string' },
          sectionRationale: { type: 'string' },
          toneAndStyle: { type: 'string' },
        },
        required: ['categoryScores', 'searchIntentSatisfied', 'sectionRationale', 'toneAndStyle'],
        type: 'object',
      },
      name: 'submit_analysis',
    },
  })

  return { ...analysis, url: page.url }
}
