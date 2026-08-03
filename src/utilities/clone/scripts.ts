/**
 * Script handling for the cloned shell.
 *
 * The clone is a static shell, not a live proxy. Any script left pointing at
 * the source site either fails outright (its API/bundle isn't served from the
 * new origin) or, worse, silently keeps sending the client's visitors back to
 * the original domain — analytics hits, session recordings, chat sessions.
 *
 * Classification is deliberately conservative in one direction: only scripts
 * we can positively identify as third-party tracking, framework runtime, or
 * source-domain code are removed. Anything else is KEPT and reported, because
 * an unrecognised inline script is as likely to be the mobile nav toggle as it
 * is to be junk — and silently deleting the nav is a worse failure than
 * leaving a dead script in place for a human to judge.
 */

export type ScriptAction = 'flagged' | 'removed'

export type ScriptDecision = {
  action: ScriptAction
  /** Why it was classified this way — surfaced in the admin review UI. */
  reason: string
  /** Truncated preview, enough to recognise the script without dumping a bundle. */
  snippet: string
  src?: string
}

export type StripScriptsResult = {
  /** Kept, but needs a human look before the shell is approved. */
  flagged: ScriptDecision[]
  html: string
  removed: ScriptDecision[]
}

/** Analytics, tag managers, session recording, chat/support widgets, ad pixels. */
const THIRD_PARTY_HOSTS = [
  'google-analytics.com',
  'googletagmanager.com',
  'googleadservices.com',
  'doubleclick.net',
  'connect.facebook.net',
  'facebook.com/tr',
  'hotjar.com',
  'mixpanel.com',
  'segment.com',
  'segment.io',
  'plausible.io',
  'matomo.cloud',
  'clarity.ms',
  'intercom.io',
  'intercomcdn.com',
  'drift.com',
  'crisp.chat',
  'tawk.to',
  'zdassets.com',
  'zendesk.com',
  'hs-scripts.com',
  'hubspot.com',
  'amplitude.com',
  'fullstory.com',
  'logrocket.io',
  'sentry-cdn.com',
  'browser.sentry-cdn.com',
  'newrelic.com',
  'nr-data.net',
  'cloudflareinsights.com',
  'vercel-insights.com',
  'vercel-scripts.com',
  'tiktok.com/i18n/pixel',
  'snap.licdn.com',
  'ads-twitter.com',
  'static.ads-twitter.com',
]

/** Inline snippets that identify a tracker even without an external src. */
const THIRD_PARTY_INLINE = [
  'gtag(',
  'dataLayer',
  'GoogleAnalyticsObject',
  'fbq(',
  '_fbq',
  'hj(',
  'hotjar',
  'mixpanel',
  'analytics.load',
  'clarity(',
  'Intercom(',
  'drift.load',
  '$crisp',
  'Tawk_API',
  '_linkedin_partner_id',
  'ttq.load',
  'snaptr(',
]

/**
 * Framework runtime. Without the original server there's nothing to hydrate
 * against — these throw on load and can blank out server-rendered markup.
 */
const FRAMEWORK_RUNTIME = [
  '/_next/static/',
  '__NEXT_DATA__',
  '__NEXT_LOADED_PAGES__',
  '/_nuxt/',
  '__NUXT__',
  'webpackJsonp',
  'webpackChunk',
  '__turbopack',
  '/@vite/client',
  '/_astro/',
]

/**
 * Hints that an inline script does something the page's layout or interaction
 * actually depends on. Presence means "do not delete without asking".
 */
const STRUCTURAL_HINTS = [
  'addEventListener',
  'classList',
  'querySelector',
  'getElementById',
  'IntersectionObserver',
  'matchMedia',
  'nav',
  'menu',
  'hamburger',
  'drawer',
  'accordion',
  'carousel',
  'slider',
  'modal',
  'dialog',
  'toggle',
  'scroll',
]

const SCRIPT_TAG = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi
const SRC_ATTR = /\bsrc\s*=\s*["']([^"']+)["']/i
const TYPE_ATTR = /\btype\s*=\s*["']([^"']+)["']/i

const snippetOf = (attrs: string, body: string): string => {
  const text = (body.trim() || `<script${attrs}>`).replace(/\s+/g, ' ')

  return text.length > 160 ? `${text.slice(0, 160)}…` : text
}

const matchesAny = (haystack: string, needles: string[]): null | string =>
  needles.find((n) => haystack.toLowerCase().includes(n.toLowerCase())) ?? null

/**
 * Removes scripts that are unsafe or useless in a static clone, and reports
 * the ones a human should decide about.
 *
 * Structured data (`application/ld+json`) is always preserved — it isn't
 * executable and dropping it would needlessly lose the source site's SEO markup.
 */
export const stripScripts = (html: string, sourceUrl: string): StripScriptsResult => {
  const removed: ScriptDecision[] = []
  const flagged: ScriptDecision[] = []

  let sourceHost = ''
  try {
    sourceHost = new URL(sourceUrl).hostname.replace(/^www\./, '')
  } catch {
    sourceHost = ''
  }

  const output = html.replace(SCRIPT_TAG, (full, attrs: string, body: string) => {
    const src = attrs.match(SRC_ATTR)?.[1]
    const type = attrs.match(TYPE_ATTR)?.[1]?.toLowerCase()

    // Non-executable structured data — keep verbatim, don't even report.
    if (type === 'application/ld+json') return full

    // Attributes are part of the framework signal, not just src/body —
    // Next's hydration payload is identified by `id="__NEXT_DATA__"` while its
    // body is ordinary JSON that matches nothing.
    const haystack = `${attrs}\n${src ?? ''}\n${body}`
    const snippet = snippetOf(attrs, body)

    const thirdParty = matchesAny(src ?? '', THIRD_PARTY_HOSTS) || matchesAny(body, THIRD_PARTY_INLINE)
    if (thirdParty) {
      removed.push({
        action: 'removed',
        reason: `Third-party tracking/widget (${thirdParty}) — would keep reporting to the original vendor.`,
        snippet,
        ...(src ? { src } : {}),
      })
      return ''
    }

    const framework = matchesAny(haystack, FRAMEWORK_RUNTIME)
    if (framework) {
      removed.push({
        action: 'removed',
        reason: `Framework runtime (${framework}) — nothing to hydrate against without the original server.`,
        snippet,
        ...(src ? { src } : {}),
      })
      return ''
    }

    // Its own bundles/API calls: dead at the new origin, or quietly routing
    // visitors back to the source site.
    if (src && sourceHost && src.toLowerCase().includes(sourceHost)) {
      removed.push({
        action: 'removed',
        reason: `Points at the source domain (${sourceHost}) — unavailable from the cloned origin.`,
        snippet,
        src,
      })
      return ''
    }

    // Unknown inline script. Keep it and ask, rather than risk deleting the
    // one thing that makes the mobile nav open.
    if (!src && body.trim()) {
      const structural = matchesAny(body, STRUCTURAL_HINTS)

      flagged.push({
        action: 'flagged',
        reason: structural
          ? `Looks structurally important (uses "${structural}") — kept for review.`
          : 'Unrecognised inline script — kept for review.',
        snippet,
      })

      return full
    }

    // Unknown EXTERNAL script from a third domain. Keep + flag: it may be a
    // font loader or a genuinely needed CDN library.
    if (src) {
      flagged.push({
        action: 'flagged',
        reason: 'External script from an unrecognised host — kept for review.',
        snippet,
        src,
      })
    }

    return full
  })

  return { flagged, html: output, removed }
}
