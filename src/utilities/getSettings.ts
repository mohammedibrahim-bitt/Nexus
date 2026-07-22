import type { Setting } from '@/payload-types'

import { unstable_cache } from 'next/cache.js'

import { getCachedGlobal } from './getGlobals'

const normalizeRemoteUrl = (url: string) => {
  const trimmed = url.trim()
  if (!trimmed) return ''

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed
  }

  return `https://${trimmed}`
}

const extractMetaContent = (
  html: string,
  attr: 'name' | 'property',
  value: string,
): string | undefined => {
  const regex = new RegExp(
    `<meta[^>]+${attr}=["']${value}["'][^>]+content=["']([^"']+)["'][^>]*>`,
    'i',
  )
  const match = html.match(regex)
  return match?.[1]?.trim()
}

const extractTitle = (html: string) => {
  const match = html.match(/<title>([^<]+)<\/title>/i)
  return match?.[1]?.trim()
}

const normalizeHexColor = (value: string | undefined | null) => {
  if (!value) return undefined
  const trimmed = value.trim()

  const hexMatch = trimmed.match(/#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})/i)
  if (hexMatch) return hexMatch[0].toLowerCase()

  const rgbMatch = trimmed.match(/rgba?\s*\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})/i)
  if (rgbMatch) {
    const [_, r, g, b] = rgbMatch
    const toHex = (value: string) => {
      const n = Number(value)
      if (Number.isNaN(n) || n < 0) return '00'
      return Math.min(255, n).toString(16).padStart(2, '0')
    }

    return `#${toHex(r)}${toHex(g)}${toHex(b)}`
  }

  return undefined
}

export type RemoteSiteDesign = {
  siteName?: string
  primaryColor?: string
}

export const fetchRemoteSiteDesign = async (siteUrl: string): Promise<RemoteSiteDesign | null> => {
  const normalizedUrl = normalizeRemoteUrl(siteUrl)
  if (!normalizedUrl) return null

  try {
    const response = await fetch(normalizedUrl, {
      method: 'GET',
      headers: {
        accept: 'text/html',
      },
    })

    if (!response.ok) return null

    const html = await response.text()

    const siteName =
      extractMetaContent(html, 'property', 'og:site_name') ||
      extractMetaContent(html, 'name', 'application-name') ||
      extractTitle(html)

    const primaryColor =
      normalizeHexColor(extractMetaContent(html, 'name', 'theme-color')) ||
      normalizeHexColor(extractMetaContent(html, 'name', 'msapplication-TileColor'))

    return {
      siteName: siteName || undefined,
      primaryColor: primaryColor || undefined,
    }
  } catch {
    return null
  }
}

export const getCachedRemoteSiteDesign = (siteUrl: string) =>
  unstable_cache(async () => fetchRemoteSiteDesign(siteUrl), [siteUrl], {
    tags: [`remote_site_design:${siteUrl}`],
  })

export const getMergedSettings = async (
  depth = 0,
): Promise<
  Setting | (Setting & { connectedSiteUrl?: string; useConnectedSiteDesign?: boolean }) | null
> => {
  const settings = await getCachedGlobal('settings', depth)()
  if (!settings) return null

  const settingsWithConnection = settings as Setting & {
    connectedSiteUrl?: string
    useConnectedSiteDesign?: boolean
  }

  if (
    !settingsWithConnection.connectedSiteUrl ||
    settingsWithConnection.useConnectedSiteDesign === false
  ) {
    return settingsWithConnection
  }

  const remoteDesign = await getCachedRemoteSiteDesign(settingsWithConnection.connectedSiteUrl)()
  if (!remoteDesign) return settingsWithConnection

  return {
    ...settingsWithConnection,
    siteName: remoteDesign.siteName || settingsWithConnection.siteName,
    primaryColor: remoteDesign.primaryColor || settingsWithConnection.primaryColor,
  }
}
