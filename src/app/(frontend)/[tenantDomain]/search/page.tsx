import type { Metadata } from 'next/types'

import { CollectionArchive } from '@/components/CollectionArchive'
import { getMergedSettings } from '@/utilities/getSettings'
import { requireTenant } from '@/utilities/getTenant'
import { tenantWhere } from '@/utilities/tenantWhere'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import React from 'react'
import { Search } from '@/search/Component'
import PageClient from './page.client'
import { CardPostData } from '@/components/Card'

type Args = {
  params: Promise<{
    tenantDomain: string
  }>
  searchParams: Promise<{
    q: string
  }>
}
export default async function Page({
  params: paramsPromise,
  searchParams: searchParamsPromise,
}: Args) {
  const { tenantDomain } = await paramsPromise
  const { q: query } = await searchParamsPromise
  const tenant = await requireTenant(tenantDomain)
  const payload = await getPayload({ config: configPromise })

  const posts = await payload.find({
    collection: 'search',
    depth: 1,
    limit: 12,
    select: {
      title: true,
      slug: true,
      categories: true,
      meta: true,
      heroImage: true,
    },
    // pagination: false reduces overhead if you don't need totalDocs
    pagination: false,
    // The tenant constraint is unconditional — it used to be that `where` only
    // existed when a query was present, which with an empty search would now
    // return every tenant's indexed posts.
    where: {
      and: [
        tenantWhere(tenant.id),
        ...(query
          ? [
              {
                or: [
                  { title: { like: query } },
                  { 'meta.description': { like: query } },
                  { 'meta.title': { like: query } },
                  { slug: { like: query } },
                ],
              },
            ]
          : []),
      ],
    },
  })

  return (
    <div className="pt-24 pb-24">
      <PageClient />
      <div className="container mb-16">
        <div className="text-center">
          <p className="kicker mb-2">Find a story</p>
          <h1 className="mb-8 font-display text-4xl leading-tight font-semibold md:text-5xl lg:mb-16">
            Search
          </h1>

          <div className="max-w-[50rem] mx-auto">
            <Search />
          </div>
        </div>
      </div>

      {posts.totalDocs > 0 ? (
        <CollectionArchive posts={posts.docs as CardPostData[]} />
      ) : (
        <div className="container">No results found.</div>
      )}
    </div>
  )
}

export async function generateMetadata({ params: paramsPromise }: Args): Promise<Metadata> {
  const { tenantDomain } = await paramsPromise
  const settings = await getMergedSettings(0, tenantDomain)

  return {
    title: `${settings?.siteName || 'Nexus'} Search`,
  }
}
