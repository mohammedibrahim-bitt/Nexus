import type { Metadata } from 'next/types'

import { CollectionArchive } from '@/components/CollectionArchive'
import { PageRange } from '@/components/PageRange'
import { Pagination } from '@/components/Pagination'
import { getBrandData } from '@/utilities/getBrandData'
import configPromise from '@payload-config'
import { getPayload, type Where } from 'payload'
import Link from 'next/link'
import React from 'react'
import PageClient from './page.client'
import { PostsFilterBar } from './PostsFilterBar'

export const revalidate = 600

type Args = {
  searchParams: Promise<{ category?: string; q?: string; tag?: string }>
}

export default async function Page({ searchParams: searchParamsPromise }: Args) {
  const { category, q, tag } = await searchParamsPromise
  const payload = await getPayload({ config: configPromise })

  const filters: Where[] = []
  if (tag) filters.push({ 'tags.slug': { equals: tag } })
  if (category) filters.push({ 'categories.slug': { equals: category } })
  if (q) {
    filters.push({
      or: [
        { title: { like: q } },
        { 'meta.description': { like: q } },
      ],
    })
  }
  const where: Where = filters.length > 0 ? { and: filters } : {}

  const [posts, { docs: categories }] = await Promise.all([
    payload.find({
      collection: 'posts',
      depth: 1,
      limit: 12,
      overrideAccess: false,
      where,
      select: {
        title: true,
        slug: true,
        categories: true,
        meta: true,
      },
    }),
    payload.find({
      collection: 'categories',
      limit: 100,
      sort: 'title',
      select: { title: true, slug: true },
    }),
  ])

  const hasFilter = Boolean(tag || category || q)

  return (
    <div className="pt-24 pb-24">
      <PageClient />
      <div className="container mb-8">
        <div className="prose dark:prose-invert max-w-none">
          <h1>Posts</h1>
        </div>
      </div>

      <div className="container mb-8">
        <PostsFilterBar
          categories={categories.map((c) => ({ slug: c.slug || '', title: c.title }))}
        />

        {hasFilter && (
          <p className="mt-4 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            {q && (
              <span>
                Searching: <span className="font-semibold text-foreground">&ldquo;{q}&rdquo;</span>
              </span>
            )}
            {tag && (
              <span>
                Filtering by tag: <span className="font-semibold text-foreground">#{tag}</span>
              </span>
            )}
            {category && (
              <span>
                Filtering by category:{' '}
                <span className="font-semibold text-foreground">{category}</span>
              </span>
            )}
            <Link className="underline" href="/posts">
              Clear all
            </Link>
          </p>
        )}
      </div>

      <div className="container mb-8">
        <PageRange
          collection="posts"
          currentPage={posts.page}
          limit={12}
          totalDocs={posts.totalDocs}
        />
      </div>

      <CollectionArchive posts={posts.docs} />

      <div className="container">
        {posts.totalPages > 1 && posts.page && (
          <Pagination page={posts.page} totalPages={posts.totalPages} />
        )}
      </div>
    </div>
  )
}

export async function generateMetadata(): Promise<Metadata> {
  const brand = await getBrandData()

  return {
    title: `${brand.siteName} Posts`,
  }
}
