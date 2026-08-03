import type { Metadata } from 'next'

import type { Media, Page, Post, Config } from '../payload-types'

import { mergeOpenGraph } from './mergeOpenGraph'
import { getServerSideURL } from './getURL'
import { getBrandData } from './getBrandData'

const getImageURL = (
  image: Media | Config['db']['defaultIDType'] | null | undefined,
  fallback: Media | null | undefined,
  generatedFallbackTitle: string,
) => {
  const serverUrl = getServerSideURL()

  const source = image && typeof image === 'object' && 'url' in image ? image : fallback

  if (source) {
    const ogUrl = source.sizes?.og?.url
    return ogUrl ? serverUrl + ogUrl : serverUrl + source.url
  }

  // No uploaded image anywhere — fall back to the dynamically generated,
  // brand-colored share card (see /og route).
  return `${serverUrl}/og?title=${encodeURIComponent(generatedFallbackTitle)}`
}

export const generateMeta = async (args: {
  doc: Partial<Page> | Partial<Post> | null
}): Promise<Metadata> => {
  const { doc } = args

  const brand = await getBrandData()
  const siteName = brand.siteName

  const ogImage = getImageURL(
    doc?.meta?.image,
    brand.defaultOgImage,
    doc?.meta?.title || doc?.title || siteName,
  )
  const description = doc?.meta?.description || brand.defaultMetaDescription || undefined

  const title = doc?.meta?.title ? doc?.meta?.title + ' | ' + siteName : siteName

  return {
    description,
    openGraph: mergeOpenGraph(
      {
        description: description || '',
        images: ogImage
          ? [
              {
                url: ogImage,
              },
            ]
          : undefined,
        title,
        url: Array.isArray(doc?.slug) ? doc?.slug.join('/') : '/',
      },
      siteName,
    ),
    title,
  }
}
