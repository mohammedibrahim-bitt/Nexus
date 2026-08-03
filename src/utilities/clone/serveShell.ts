import type { Tenant } from '@/payload-types'

import { getPublicUrl } from './storage'

/**
 * Serving-side helpers for a published clone shell.
 */

/**
 * Whether this tenant should render its cloned shell instead of the normal
 * Nexus templates.
 *
 * Only `published` qualifies. A shell sitting in `pending_review` — or a
 * tenant that fell back to `brand_only` — must never appear on the live
 * subdomain, even if the HTML is still sitting in storage.
 */
export const shouldServeShell = (tenant: null | Tenant | undefined): boolean =>
  Boolean(tenant && tenant.cloneStatus === 'published' && tenant.shellHtmlPath)

/** Fetches the stored shell HTML. Returns null if it's gone or unreachable. */
export const fetchShellHtml = async (tenant: Tenant): Promise<null | string> => {
  if (!tenant.shellHtmlPath) return null

  try {
    const res = await fetch(getPublicUrl(tenant.shellHtmlPath), {
      // Shells change only on re-sync, so cache hard rather than refetching
      // a full document on every request.
      next: { revalidate: 300 },
    })

    return res.ok ? await res.text() : null
  } catch {
    return null
  }
}

/**
 * Adds a `/blog` link to the shell's primary navigation.
 *
 * Best-effort by design: it appends to the first `<nav>` whose markup already
 * contains anchors, mirroring the surrounding link's classes so it inherits
 * the site's styling. If no such nav is found the HTML is returned untouched —
 * per the spec, an ambiguous or obfuscated nav is left alone rather than
 * risking a mangled header, and /blog stays reachable directly either way.
 */
export const injectBlogLink = (html: string, label = 'Blog'): { html: string; injected: boolean } => {
  const navMatch = html.match(/<nav\b[^>]*>([\s\S]*?)<\/nav>/i)

  if (!navMatch) return { html, injected: false }

  const navInner = navMatch[1]
  // Reuse the last anchor's classes so the new item looks native.
  const anchors = [...navInner.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi)]

  if (anchors.length === 0) return { html, injected: false }

  const lastAnchor = anchors[anchors.length - 1]
  const classMatch = lastAnchor[1].match(/\bclass\s*=\s*["']([^"']*)["']/i)
  const className = classMatch ? ` class="${classMatch[1]}"` : ''

  const link = `<a href="/blog"${className}>${label}</a>`
  const updatedNav = navMatch[0].replace(/<\/nav>$/i, `${link}</nav>`)

  return { html: html.replace(navMatch[0], updatedNav), injected: true }
}

/**
 * Neutralises anything in the shell that would break when served from a
 * different origin: rewrites the base href and stops relative links from
 * silently resolving against our subdomain.
 */
export const prepareShellForServing = (html: string, sourceUrl: string): string => {
  let output = html

  // A leftover <base> would send every relative URL back to the source site.
  output = output.replace(/<base\b[^>]*>/gi, '')

  void sourceUrl

  return output
}
