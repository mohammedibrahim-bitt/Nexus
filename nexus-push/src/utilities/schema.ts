import type { Post } from '@/payload-types'
import type { BrandData } from './getBrandData'

import { getServerSideURL } from './getURL'

const absoluteImageUrl = (image: Post['heroImage'] | Post['meta'], serverUrl: string): string | undefined => {
  if (image && typeof image === 'object' && 'url' in image && image.url) {
    return `${serverUrl}${image.url}`
  }
  return undefined
}

/** schema.org WebSite — emitted site-wide from the root layout. */
export const websiteSchema = (brand: BrandData) => {
  const serverUrl = getServerSideURL()

  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: brand.siteName,
    potentialAction: {
      '@type': 'SearchAction',
      query_input: 'required name=search_term_string',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${serverUrl}/search?q={search_term_string}`,
      },
    },
    url: serverUrl,
  }
}

/** schema.org Article + author/publisher — emitted on post detail pages. */
export const articleSchema = (post: Post, brand: BrandData) => {
  const serverUrl = getServerSideURL()
  const url = `${serverUrl}/posts/${post.slug}`

  const image =
    absoluteImageUrl(post.meta?.image as Post['heroImage'], serverUrl) ||
    absoluteImageUrl(post.heroImage, serverUrl)

  const authors = (post.populatedAuthors || [])
    .filter((author) => author?.name)
    .map((author) => ({
      '@type': 'Person',
      name: author.name,
      url: `${serverUrl}/authors/${author.id}`,
    }))

  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    ...(authors.length > 0 && { author: authors }),
    ...(post.publishedAt && { datePublished: post.publishedAt }),
    ...(post.updatedAt && { dateModified: post.updatedAt }),
    ...(post.meta?.description && { description: post.meta.description }),
    headline: post.title,
    ...(image && { image: [image] }),
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': url,
    },
    publisher: {
      '@type': 'Organization',
      name: brand.siteName,
      url: serverUrl,
    },
    url,
  }
}

/** schema.org BreadcrumbList — emitted on post detail pages. */
export const breadcrumbSchema = (post: Post, brand: BrandData) => {
  const serverUrl = getServerSideURL()

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        item: serverUrl,
        name: brand.siteName,
        position: 1,
      },
      {
        '@type': 'ListItem',
        item: `${serverUrl}/posts`,
        name: 'Posts',
        position: 2,
      },
      {
        '@type': 'ListItem',
        item: `${serverUrl}/posts/${post.slug}`,
        name: post.title,
        position: 3,
      },
    ],
  }
}

/** schema.org ProfilePage + Person — emitted on author bio pages. */
export const authorSchema = (
  author: { avatarUrl?: string; bio?: string; id: number | string; name: string; title?: string },
  brand: BrandData,
) => {
  const serverUrl = getServerSideURL()

  return {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    mainEntity: {
      '@type': 'Person',
      ...(author.bio && { description: author.bio }),
      ...(author.avatarUrl && { image: `${serverUrl}${author.avatarUrl}` }),
      ...(author.title && { jobTitle: author.title }),
      name: author.name,
      url: `${serverUrl}/authors/${author.id}`,
      worksFor: {
        '@type': 'Organization',
        name: brand.siteName,
        url: serverUrl,
      },
    },
  }
}
