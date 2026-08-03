import type { Metadata } from 'next/types'

import { CollectionArchive } from '@/components/CollectionArchive'
import { PageRange } from '@/components/PageRange'
import { Pagination } from '@/components/Pagination'
import { getMergedSettings } from '@/utilities/getSettings'
import { requireTenant } from '@/utilities/getTenant'
import { tenantWhere } from '@/utilities/tenantWhere'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import React, { Suspense } from 'react'
import PageClient from './page.client'
import { PostsFilterBar } from './PostsFilterBar'

export const dynamic = 'force-dynamic'

type Args = {
  params: Promise<{ tenantDomain: string }>
  searchParams: Promise<{ q?: string; category?: string; page?: string }>
}

export default async function Page({ params: paramsPromise, searchParams }: Args) {
  const { tenantDomain } = await paramsPromise
  const { q, category, page: pageParam } = await searchParams
  const tenant = await requireTenant(tenantDomain)
  const currentPage = Number(pageParam) || 1

  const payload = await getPayload({ config: configPromise })

  // Fetch categories for the filter bar
  const categoriesResult = await payload.find({
    collection: 'categories',
    limit: 100,
    depth: 0,
    where: tenantWhere(tenant.id),
  })

  const categories = categoriesResult.docs.map((cat: any) => ({
    slug: cat.slug as string,
    title: cat.title as string,
  }))

  // Build the query — always published only, regardless of the viewer's
  // own access level (staff previewing drafts belongs in the dashboard/
  // live-preview, not mixed into the public listing).
  const where: Record<string, any> = {
    ...tenantWhere(tenant.id),
    _status: { equals: 'published' },
  }

  if (q) {
    where.title = { like: q }
  }

  if (category) {
    where['categories.slug'] = { equals: category }
  }

  const posts = await payload.find({
    collection: 'posts',
    depth: 1,
    limit: 12,
    page: currentPage,
    overrideAccess: false,
    where,
    select: {
      title: true,
      slug: true,
      categories: true,
      meta: true,
      heroImage: true,
    },
  })

  return (
    <div className="pt-24 pb-24">
      <PageClient />
      <div className="container mb-10">
        <p className="kicker mb-2">All coverage</p>
        <h1 className="font-display text-4xl leading-tight font-semibold md:text-5xl">Posts</h1>
        <div aria-hidden className="editorial-rule mt-5" />
      </div>

      {/* Search & Filter Bar */}
      <div className="container mb-8">
        <Suspense fallback={null}>
          <PostsFilterBar categories={categories} />
        </Suspense>
      </div>

      <div className="container mb-8 mt-4">
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

export async function generateMetadata({ params: paramsPromise }: Args): Promise<Metadata> {
  const { tenantDomain } = await paramsPromise
  const settings = await getMergedSettings(0, tenantDomain)

  return {
    title: `${settings?.siteName || 'Nexus'} Posts`,
  }
}
