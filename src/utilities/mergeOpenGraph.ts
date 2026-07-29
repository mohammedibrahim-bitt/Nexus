import type { Metadata } from 'next'
import { getServerSideURL } from './getURL'

const buildDefaultOpenGraph = (siteName?: string | null): Metadata['openGraph'] => {
  const name = siteName || 'Nexus'

  return {
    type: 'website',
    description: `${name} — a blog built with Payload and Next.js.`,
    images: [
      {
        url: `${getServerSideURL()}/website-template-OG.webp`,
      },
    ],
    siteName: name,
    title: name,
  }
}

export const mergeOpenGraph = (
  og?: Metadata['openGraph'],
  siteName?: string | null,
): Metadata['openGraph'] => {
  const defaultOpenGraph = buildDefaultOpenGraph(siteName)

  return {
    ...defaultOpenGraph,
    ...og,
    images: og?.images ? og.images : defaultOpenGraph?.images,
  }
}
