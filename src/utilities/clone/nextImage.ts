/**
 * Next.js serves optimized images through its own proxy:
 *   /_next/image?url=<url-encoded real source>&w=1920&q=75
 *
 * That proxy path only exists on the original site's own Next.js server. Copy
 * it verbatim into a cloned shell and every image 404s, because nothing is
 * running Next's image optimizer at the new origin. So before downloading
 * anything, unwrap the proxy back to the real underlying image URL.
 *
 * The `url` param may itself be relative (`/images/hero.png`) — hence the
 * caller-supplied base for resolution.
 */
export const unwrapNextImageUrl = (rawUrl: string, base: string): string => {
  let parsed: URL

  try {
    parsed = new URL(rawUrl, base)
  } catch {
    return rawUrl
  }

  // Match the optimizer path on any origin, including a bare relative ref.
  if (!parsed.pathname.endsWith('/_next/image') && parsed.pathname !== '/_next/image') {
    return rawUrl
  }

  const inner = parsed.searchParams.get('url')
  if (!inner) return rawUrl

  try {
    // Resolve the decoded target against the proxy's own origin — a relative
    // `url=` param belongs to the source site, not to us.
    return new URL(inner, parsed.origin).toString()
  } catch {
    return rawUrl
  }
}

/**
 * Some sites nest the optimizer (rare, but it happens with proxied CDNs).
 * Unwrap repeatedly, with a hard cap so a self-referential URL can't spin.
 */
export const unwrapNextImageDeep = (rawUrl: string, base: string, maxDepth = 3): string => {
  let current = rawUrl

  for (let i = 0; i < maxDepth; i++) {
    const next = unwrapNextImageUrl(current, base)
    if (next === current) break
    current = next
  }

  return current
}
