import type { AiProvider } from './aiClient'

import { callWithTool } from './aiClient'

const HAS_PLACEHOLDER = /\[[^\]]+\]/

const WEEKDAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

const resolveKeywordSchema = {
  properties: {
    resolvedKeyword: {
      description:
        'The final, literal search keyword/phrase — no brackets, no placeholders, ready to type into a search engine.',
      type: 'string',
    },
  },
  required: ['resolvedKeyword'],
  type: 'object',
} as const

/**
 * A rule's keyword can be a reusable template with bracketed instructions —
 * not just `[month]`/`[year]`, but anything: "[current quarter]", "[the
 * trending AI model this week]", "[most recent iPhone model]", etc. Rather
 * than hardcoding a fixed placeholder list, an AI call resolves the whole
 * template into one concrete, literal search keyword each time the rule
 * runs, using today's date as grounding context. Templates with no bracketed
 * instructions at all skip the AI call entirely and are used as-is.
 */
export async function resolveKeywordTemplate(
  template: string,
  aiApiKey: string,
  aiProvider: AiProvider,
  date: Date = new Date(),
): Promise<string> {
  if (!HAS_PLACEHOLDER.test(template)) return template

  const todayContext = {
    dayOfMonth: date.getDate(),
    isoDate: date.toISOString().slice(0, 10),
    month: MONTH_NAMES[date.getMonth()],
    quarter: `Q${Math.floor(date.getMonth() / 3) + 1}`,
    weekday: WEEKDAY_NAMES[date.getDay()],
    year: date.getFullYear(),
  }

  const result = await callWithTool<{ resolvedKeyword: string }>({
    apiKey: aiApiKey,
    // Some providers/models (e.g. gemini-flash-latest) spend output tokens on
    // internal reasoning before emitting the actual tool call, so this needs
    // real headroom even though the final answer is just a short phrase.
    maxTokens: 1024,
    prompt: `Template: "${template}"\n\nToday's date context (JSON): ${JSON.stringify(todayContext)}`,
    provider: aiProvider,
    systemPrompt:
      "You resolve keyword templates for an SEO research tool into a single concrete, literal search query. The template may contain bracketed instructions like [month], [year], [current quarter], or open-ended ones like [trending AI model] or [most recent flagship phone] — use your own knowledge plus the provided date context to fill each one in with the single most accurate, current, specific value. Keep every other word of the template exactly as written; only replace the bracketed parts. Return only the final resolved phrase.",
    tool: {
      description: 'Report the resolved, literal search keyword.',
      inputSchema: resolveKeywordSchema,
      name: 'resolve_keyword',
    },
  })

  return result.resolvedKeyword?.trim() || template
}
