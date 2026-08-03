import type { Media as MediaType } from '@/payload-types'

import { getCachedTenantDoc } from './getTenantDoc'
import { resolveTenant } from './getTenant'
import { DEFAULT_DISPLAY_FONT } from './displayFonts'

export type BrandLogo = { type: 'media'; media: MediaType } | { type: 'remote'; url: string } | null

export type SocialLink = {
  platform: string
  url: string
}

export type BrandData = {
  analyticsId: string | null
  analyticsProvider: 'ga4' | 'none' | 'plausible'
  copyrightText: string | null
  cornerRadius: number
  defaultMetaDescription: string | null
  defaultOgImage: MediaType | null
  density: 'comfortable' | 'compact'
  enableAnimations: boolean
  favicon: MediaType | null
  fontFamily: string
  fontScale: number
  footerTagline: string | null
  headerLayout: 'centered' | 'left'
  logo: BrandLogo
  primaryColor: string
  secondaryColor: string | null
  siteName: string
  socialLinks: SocialLink[]
}

const hexColorRegex = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/

type RemoteBrand = {
  logoUrl?: string
  primaryColor?: string
  siteName?: string
}

const getAttr = (tag: string, attr: string): string | null => {
  const match = tag.match(new RegExp(`${attr}\\s*=\\s*["']([^"']*)["']`, 'i'))
  return match ? match[1] : null
}

/**
 * Best-effort fallback for sites that don't publish a dedicated brand.json:
 * pulls name/color/logo out of standard meta tags and favicon links.
 */
const parseBrandFromHtml = (html: string, pageUrl: string): RemoteBrand => {
  const result: RemoteBrand = {}
  const truncated = html.slice(0, 200_000)

  const metaTags = truncated.match(/<meta[^>]*>/gi) || []
  for (const tag of metaTags) {
    const name = getAttr(tag, 'name') || getAttr(tag, 'property')
    const content = getAttr(tag, 'content')
    if (!name || !content) continue

    if (/^og:site_name$/i.test(name) && !result.siteName) result.siteName = content
    if (/^theme-color$/i.test(name) && !result.primaryColor) result.primaryColor = content
  }

  if (!result.siteName) {
    const titleMatch = truncated.match(/<title[^>]*>([^<]*)<\/title>/i)
    if (titleMatch) result.siteName = titleMatch[1].trim()
  }

  const linkTags = truncated.match(/<link[^>]*>/gi) || []
  let iconHref: string | null = null
  let appleIconHref: string | null = null
  for (const tag of linkTags) {
    const rel = getAttr(tag, 'rel')
    const href = getAttr(tag, 'href')
    if (!rel || !href) continue

    if (/apple-touch-icon/i.test(rel)) appleIconHref = href
    else if (/^(shortcut )?icon$/i.test(rel)) iconHref = href
  }

  const logoHref = appleIconHref || iconHref
  if (logoHref) {
    try {
      result.logoUrl = new URL(logoHref, pageUrl).toString()
    } catch {
      // ignore malformed href
    }
  }

  return result
}

/**
 * Confirms a candidate logo URL actually resolves to an image before we ever
 * ship it to the client — avoids broken-image icons when a link is dead or
 * resolves to an HTML/JSON page instead of an image.
 */
async function isImageUrl(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, {
      method: 'HEAD',
      next: { revalidate: 300 },
      signal: AbortSignal.timeout(4000),
    })

    if (res.ok && (res.headers.get('content-type') || '').startsWith('image/')) return true
    if (res.status !== 405 && res.status !== 501) return false
  } catch {
    // HEAD not supported or failed — fall through and try GET below
  }

  try {
    const res = await fetch(url, {
      next: { revalidate: 300 },
      signal: AbortSignal.timeout(4000),
    })

    return res.ok && (res.headers.get('content-type') || '').startsWith('image/')
  } catch {
    return false
  }
}

/**
 * Resolves a tenant's brand source: JSON first, falling back to scraping the
 * page's meta tags and favicon. Exported so tenant creation can run it
 * immediately rather than waiting for the 5-minute revalidate window.
 */
export async function fetchRemoteBrand(url: string): Promise<RemoteBrand | null> {
  try {
    const res = await fetch(url, {
      next: { revalidate: 300 },
      signal: AbortSignal.timeout(5000),
    })

    if (!res.ok) return null

    const contentType = res.headers.get('content-type') || ''
    const text = await res.text()

    if (contentType.includes('application/json')) {
      const data = JSON.parse(text)
      return data && typeof data === 'object' ? (data as RemoteBrand) : null
    }

    // Not declared as JSON — try parsing it as JSON anyway, then fall back to HTML scraping
    try {
      const data = JSON.parse(text)
      if (data && typeof data === 'object') return data as RemoteBrand
    } catch {
      // not JSON, fall through to HTML parsing
    }

    return parseBrandFromHtml(text, url)
  } catch (err) {
    console.warn('[getBrandData] brand sync fetch failed, using local settings', err)
    return null
  }
}

/**
 * @param tenantHostOrSlug The request's hostname (or a bare tenant slug).
 * Omitted callers fall back to the default tenant — see resolveTenant.
 */
export async function getBrandData(tenantHostOrSlug?: null | string): Promise<BrandData> {
  const tenant = await resolveTenant(tenantHostOrSlug)
  const settings = tenant ? await getCachedTenantDoc('settings', tenant.id, 1)() : null

  const brand: BrandData = {
    analyticsId: settings?.analyticsId || null,
    analyticsProvider:
      settings?.analyticsProvider === 'ga4' || settings?.analyticsProvider === 'plausible'
        ? settings.analyticsProvider
        : 'none',
    copyrightText: settings?.copyrightText || null,
    cornerRadius: typeof settings?.cornerRadius === 'number' ? settings.cornerRadius : 12,
    defaultMetaDescription: settings?.defaultMetaDescription || null,
    defaultOgImage: typeof settings?.defaultOgImage === 'object' ? settings?.defaultOgImage || null : null,
    density: settings?.density === 'compact' ? 'compact' : 'comfortable',
    enableAnimations: settings?.enableAnimations ?? true,
    favicon: typeof settings?.favicon === 'object' ? settings?.favicon || null : null,
    fontFamily: settings?.fontFamily || DEFAULT_DISPLAY_FONT,
    fontScale: typeof settings?.fontScale === 'number' ? settings.fontScale : 1,
    footerTagline: settings?.footerTagline || null,
    headerLayout: settings?.headerLayout === 'centered' ? 'centered' : 'left',
    logo: typeof settings?.logo === 'object' && settings?.logo ? { type: 'media', media: settings.logo } : null,
    primaryColor: settings?.primaryColor || '#dc2626',
    secondaryColor: settings?.secondaryColor || null,
    siteName: settings?.siteName || 'Nexus',
    socialLinks: (settings?.socialLinks || [])
      .filter((link): link is { platform: string; url: string } => Boolean(link?.url))
      .map((link) => ({ platform: link.platform || 'other', url: link.url })),
  }

  // The tenant's own sourceUrl is the fallback when this tenant's Settings doc
  // carries no explicit override, so a tenant created from a URL is branded
  // even before anyone opens its Settings.
  const brandSyncUrl = settings?.brandSyncUrl || tenant?.sourceUrl

  if (brandSyncUrl) {
    const remote = await fetchRemoteBrand(brandSyncUrl)

    if (remote) {
      if (typeof remote.siteName === 'string' && remote.siteName.trim()) {
        brand.siteName = remote.siteName.trim()
      }

      if (typeof remote.primaryColor === 'string' && hexColorRegex.test(remote.primaryColor)) {
        brand.primaryColor = remote.primaryColor
      }

      if (typeof remote.logoUrl === 'string' && /^https?:\/\//.test(remote.logoUrl)) {
        if (await isImageUrl(remote.logoUrl)) {
          brand.logo = { type: 'remote', url: remote.logoUrl }
        }
      }
    }
  }

  return brand
}
