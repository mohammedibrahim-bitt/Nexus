export type CompetitorPage = {
  error?: string
  headings: { level: number; text: string }[]
  text: string
  title: string
  url: string
}

const decodeEntities = (value: string): string =>
  value
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&nbsp;/g, ' ')

const stripTags = (html: string): string => decodeEntities(html.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim()

const MAX_TEXT_LENGTH = 6000

/**
 * Fetches a competitor page and extracts readable text + heading structure
 * via lightweight regex parsing — matches the existing regex-based HTML
 * handling already used in this codebase (getBrandData.ts's meta-tag
 * scraper, syncContentSource's htmlToParagraphs) rather than adding a new
 * heavy dependency like Readability.
 */
export async function fetchCompetitorPage(url: string): Promise<CompetitorPage> {
  const empty: CompetitorPage = { headings: [], text: '', title: '', url }

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SeoResearchAgent/1.0)' },
      signal: AbortSignal.timeout(15000),
    })

    if (!res.ok) {
      return { ...empty, error: `Page returned ${res.status}` }
    }

    const html = await res.text()

    const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i)
    const title = titleMatch ? decodeEntities(titleMatch[1]).trim() : url

    const headings: { level: number; text: string }[] = []
    const headingRegex = /<h([1-3])[^>]*>([\s\S]*?)<\/h\1>/gi
    let headingMatch: null | RegExpExecArray
    while ((headingMatch = headingRegex.exec(html))) {
      const text = stripTags(headingMatch[2])
      if (text) headings.push({ level: Number(headingMatch[1]), text })
    }

    const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i)
    const bodyHtml = bodyMatch ? bodyMatch[1] : html

    const cleaned = bodyHtml
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<nav[\s\S]*?<\/nav>/gi, ' ')
      .replace(/<footer[\s\S]*?<\/footer>/gi, ' ')

    const text = stripTags(cleaned).slice(0, MAX_TEXT_LENGTH)

    return { headings, text, title, url }
  } catch (err) {
    return { ...empty, error: err instanceof Error ? err.message : 'Failed to fetch page' }
  }
}
