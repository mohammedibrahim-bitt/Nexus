import type { Metadata } from 'next/types'

import { CollectionArchive } from '@/components/CollectionArchive'
import { PageRange } from '@/components/PageRange'
import { Pagination } from '@/components/Pagination'
import { getMergedSettings } from '@/utilities/getSettings'
import { requireTenant } from '@/utilities/getTenant'
import { tenantWhere } from '@/utilities/tenantWhere'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import React from 'react'
import PageClient from './page.client'
import { notFound } from 'next/navigation'

export const revalidate = 600

type Args = {
  params: Promise<{
    pageNumber: string
    tenantDomain: string
  }>
}

export default async function Page({ params: paramsPromise }: Args) {
  const { pageNumber, tenantDomain } = await paramsPromise
  const tenant = await requireTenant(tenantDomain)
  const payload = await getPayload({ config: configPromise })

  const sanitizedPageNumber = Number(pageNumber)

  if (!Number.isInteger(sanitizedPageNumber)) notFound()

  const posts = await payload.find({
    collection: 'posts',
    depth: 1,
    limit: 12,
    overrideAccess: false,
    page: sanitizedPageNumber,
    where: { and: [tenantWhere(tenant.id), { _status: { equals: 'published' } }] },
  })

  return (
    <div className="pt-24 pb-24">
      <PageClient />
      <div className="container mb-16">
        <p className="kicker mb-2">All coverage</p>
        <h1 className="font-display text-4xl leading-tight font-semibold md:text-5xl">Posts</h1>
        <div aria-hidden className="editorial-rule mt-5" />
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
        {posts?.page && posts?.totalPages > 1 && (
          <Pagination page={posts.page} totalPages={posts.totalPages} />
        )}
      </div>
    </div>
  )
}

export async function generateMetadata({ params: paramsPromise }: Args): Promise<Metadata> {
  const { pageNumber, tenantDomain } = await paramsPromise
  const settings = await getMergedSettings(0, tenantDomain)

  return {
    title: `${settings?.siteName || 'Nexus'} Posts Page ${pageNumber || ''}`,
  }
}

export async function generateStaticParams() {
  const payload = await getPayload({ config: configPromise })

  // Page count is per tenant, so enumerate tenants and paginate within each.
  const { docs: tenants } = await payload.find({
    collection: 'tenants',
    depth: 0,
    limit: 1000,
    pagination: false,
    select: { slug: true },
  })

  const pages: { pageNumber: string; tenantDomain: string }[] = []

  for (const tenant of tenants) {
    const { totalDocs } = await payload.count({
      collection: 'posts',
      overrideAccess: false,
      where: { and: [tenantWhere(tenant.id), { _status: { equals: 'published' } }] },
    })

    const totalPages = Math.ceil(totalDocs / 10)

    for (let i = 1; i <= totalPages; i++) {
      pages.push({ pageNumber: String(i), tenantDomain: tenant.slug })
    }
  }

  return pages
}
