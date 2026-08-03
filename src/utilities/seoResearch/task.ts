import type { TaskConfig } from 'payload'

import type { AiProvider } from './aiClient'

import { runSeoResearch } from './runSeoResearch'

export const runSeoResearchTask: TaskConfig<{
  input: {
    aiApiKey: string
    aiProvider: AiProvider
    authorId: string
    runId: string
    serpApiKey: string
    tenantId: string
  }
  output: object
}> = {
  slug: 'run-seo-research',
  handler: async ({ input, req }) => {
    await runSeoResearch(req.payload, input.runId, {
      aiApiKey: input.aiApiKey,
      aiProvider: input.aiProvider,
      authorId: Number(input.authorId),
      serpApiKey: input.serpApiKey,
      // Job inputs are text fields on the queue, so widen back to the numeric
      // id the collections actually store.
      tenantId: Number(input.tenantId),
    })
    return { output: {} }
  },
  inputSchema: [
    { name: 'runId', type: 'text', required: true },
    { name: 'serpApiKey', type: 'text', required: true },
    { name: 'aiApiKey', type: 'text', required: true },
    { name: 'aiProvider', type: 'text', required: true },
    { name: 'authorId', type: 'text', required: true },
    { name: 'tenantId', type: 'text', required: true },
  ],
  label: 'Run SEO Research',
}
