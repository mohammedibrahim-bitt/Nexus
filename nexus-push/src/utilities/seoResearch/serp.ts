export type SerpResult = {
  error?: string
  urls: string[]
}

/**
 * Looks up the top organic results for a keyword via SerpApi. `apiKey` is
 * the triggering user's own personal SerpApi key — this feature has no
 * shared/site-wide fallback key. Returns an error string instead of
 * throwing so the caller can write a clear status back to the
 * research-run doc rather than crashing the whole pipeline.
 */
export async function fetchTopRankingPages(
  keyword: string,
  apiKey: string,
  count = 5,
): Promise<SerpResult> {
  try {
    const params = new URLSearchParams({
      api_key: apiKey,
      engine: 'google',
      num: String(count),
      q: keyword,
    })

    const res = await fetch(`https://serpapi.com/search.json?${params.toString()}`, {
      signal: AbortSignal.timeout(25000),
    })

    if (!res.ok) {
      return { error: `SerpApi returned ${res.status}`, urls: [] }
    }

    const data = await res.json()
    const organic = Array.isArray(data?.organic_results) ? data.organic_results : []

    const urls = organic
      .map((result: { link?: string }) => result?.link)
      .filter((link: unknown): link is string => typeof link === 'string' && link.startsWith('http'))
      .slice(0, count)

    if (urls.length === 0) {
      return { error: 'SerpApi returned no organic results for this keyword.', urls: [] }
    }

    return { urls }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Failed to query SerpApi', urls: [] }
  }
}
