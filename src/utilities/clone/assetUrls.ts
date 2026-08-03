import { unwrapNextImageDeep } from './nextImage'

/**
 * Extraction + rewriting of asset references in scraped HTML/CSS.
 *
 * These are pure string transforms: they take markup plus the source origin
 * and return the set of assets to fetch, or markup with references swapped for
 * their stored equivalents. The headless browser only supplies the input
 * string, so none of this depends on it.
 *
 * NOTE ON APPROACH: this rewrites via targeted regex over specific attributes
 * and CSS `url()` tokens rather than parsing a full DOM. That's the same
 * approach wget/httrack take for link conversion, and it's appropriate here
 * because the input is browser-rendered (so well-formed) and we only touch a
 * closed set of attributes. It will not catch a URL assembled at runtime by
 * JavaScript — nothing short of executing that JS would.
 */

/** A discovered asset: where it really lives, and how it was referenced. */
export type DiscoveredAsset = {
  /** Absolute URL to fetch. */
  absoluteUrl: string
  /** The exact string as it appeared in the source, for precise replacement. */
  originalRef: string
}

const ABSOLUTE_SCHEME = /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i

/** Refs that are never fetchable assets. */
const isNonFetchable = (ref: string): boolean =>
  !ref ||
  ref.startsWith('#') ||
  ref.startsWith('data:') ||
  ref.startsWith('blob:') ||
  ref.startsWith('javascript:') ||
  ref.startsWith('mailto:') ||
  ref.startsWith('tel:')

/**
 * Resolves a reference against the SOURCE origin.
 *
 * This is the subtle one. `next/font` emits `/_next/static/media/x.woff2`, and
 * plenty of sites reference `/logo.svg` — both look "internal". If the rewrite
 * logic only treated domain-qualified URLs as external, these would silently
 * resolve against the *new* subdomain at serve time and 404, because nothing
 * copied them. Every relative ref must be resolved against the source origin
 * and pulled in, regardless of how internal it looks.
 */
export const resolveAgainstSource = (ref: string, sourceUrl: string): null | string => {
  if (isNonFetchable(ref)) return null

  try {
    // `new URL` handles absolute, protocol-relative, root-relative and
    // path-relative refs uniformly once given the source as base.
    const resolved = new URL(ref, sourceUrl)

    if (resolved.protocol !== 'http:' && resolved.protocol !== 'https:') return null

    return unwrapNextImageDeep(resolved.toString(), sourceUrl)
  } catch {
    return null
  }
}

/** `srcset` is a comma-separated list of `url [descriptor]` pairs. */
export const parseSrcset = (value: string): string[] =>
  value
    .split(',')
    .map((entry) => entry.trim().split(/\s+/)[0])
    .filter(Boolean)

// Attributes worth following. `href` is deliberately limited to <link> so we
// don't drag in every anchor on the page.
const SRC_ATTR = /\b(src|poster)\s*=\s*["']([^"']+)["']/gi
const SRCSET_ATTR = /\bsrcset\s*=\s*["']([^"']+)["']/gi
const LINK_HREF = /<link\b[^>]*?\bhref\s*=\s*["']([^"']+)["'][^>]*>/gi
const CSS_URL = /url\(\s*(['"]?)([^'")]+)\1\s*\)/gi
// Captures the delimiter, then anything that isn't THAT delimiter — so a
// double-quoted attribute containing single quotes (the very common
// `style="background-image:url('/a.png')"`) is captured whole rather than
// truncated at the first inner quote.
const INLINE_STYLE = /\bstyle\s*=\s*(["'])((?:(?!\1)[\s\S])*)\1/gi

/**
 * Every asset referenced by the HTML: images, video posters, srcset
 * candidates, stylesheets, icons, preloaded fonts, and inline-style
 * backgrounds.
 */
export const extractHtmlAssets = (html: string, sourceUrl: string): DiscoveredAsset[] => {
  const found = new Map<string, DiscoveredAsset>()

  const add = (originalRef: string) => {
    const absoluteUrl = resolveAgainstSource(originalRef, sourceUrl)
    if (absoluteUrl && !found.has(originalRef)) found.set(originalRef, { absoluteUrl, originalRef })
  }

  for (const m of html.matchAll(SRC_ATTR)) add(m[2])
  for (const m of html.matchAll(SRCSET_ATTR)) parseSrcset(m[1]).forEach(add)
  for (const m of html.matchAll(LINK_HREF)) add(m[1])
  for (const m of html.matchAll(INLINE_STYLE)) {
    for (const u of m[2].matchAll(CSS_URL)) add(u[2])
  }

  return [...found.values()]
}

/**
 * Every asset referenced by a stylesheet — `url()` covers background images,
 * `@font-face src`, mask images, cursors and the rest.
 *
 * `cssUrl` is the stylesheet's own URL, not the page's: a rule inside
 * `/assets/css/main.css` saying `url(../fonts/x.woff2)` resolves relative to
 * that file, so using the page URL as base would silently point at the wrong
 * path.
 */
export const extractCssAssets = (css: string, cssUrl: string): DiscoveredAsset[] => {
  const found = new Map<string, DiscoveredAsset>()

  for (const m of css.matchAll(CSS_URL)) {
    const originalRef = m[2]
    const absoluteUrl = resolveAgainstSource(originalRef, cssUrl)
    if (absoluteUrl && !found.has(originalRef)) found.set(originalRef, { absoluteUrl, originalRef })
  }

  return [...found.values()]
}

/** Escapes a string for safe use inside a RegExp. */
const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/**
 * Swaps every original reference for its stored URL.
 *
 * Keyed by the ORIGINAL ref text (not the resolved absolute URL) so the exact
 * substring in the markup is what gets replaced — the same asset may appear as
 * `/logo.svg` in one place and `https://site.com/logo.svg` in another, and
 * each occurrence has to be matched as written.
 *
 * Longest-first prevents a short ref from clobbering part of a longer one that
 * contains it (`/img/a.png` inside `/img/a.png?v=2`).
 */
export const rewriteRefs = (content: string, refToStoredUrl: Map<string, string>): string => {
  const refs = [...refToStoredUrl.keys()].sort((a, b) => b.length - a.length)

  let output = content

  for (const ref of refs) {
    const storedUrl = refToStoredUrl.get(ref)
    if (!storedUrl) continue

    // Bounded by quote/paren/whitespace/comma so a ref can't match mid-token.
    output = output.replace(
      new RegExp(`(?<=["'(\\s,])${escapeRegExp(ref)}(?=["')\\s,])`, 'g'),
      storedUrl,
    )
  }

  return output
}

/**
 * Any surviving reference to the source domain after rewriting — the clone is
 * meant to be self-contained, so a non-empty result means assets would still
 * be loaded from (or leak traffic to) the original site.
 */
export const findResidualSourceRefs = (content: string, sourceUrl: string): string[] => {
  let host: string
  try {
    host = new URL(sourceUrl).hostname
  } catch {
    return []
  }

  const bare = host.replace(/^www\./, '')
  const pattern = new RegExp(`https?://(?:www\\.)?${escapeRegExp(bare)}[^"'\\s)]*`, 'gi')

  return [...new Set(content.match(pattern) ?? [])]
}
