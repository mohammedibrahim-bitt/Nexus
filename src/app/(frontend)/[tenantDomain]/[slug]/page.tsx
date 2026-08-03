import type { Metadata } from 'next'

import { PayloadRedirects } from '@/components/PayloadRedirects'
import configPromise from '@payload-config'
import { getPayload, type RequiredDataFromCollectionSlug } from 'payload'
import { draftMode } from 'next/headers'
import React, { cache } from 'react'
import { homeStatic } from '@/endpoints/seed/home-static'

import { RenderBlocks } from '@/blocks/RenderBlocks'
import { RenderHero } from '@/heros/RenderHero'
import { generateMeta } from '@/utilities/generateMeta'
import { requireTenant } from '@/utilities/getTenant'
import { tenantWhere } from '@/utilities/tenantWhere'
import PageClient from './page.client'
import { LivePreviewListener } from '@/components/LivePreviewListener'

export async function generateStaticParams() {
  const payload = await getPayload({ config: configPromise })
  // Pages are pre-rendered per tenant, so each param pair is (tenant, slug) —
  // two tenants can legitimately both own an "about" page.
  const pages = await payload.find({
    collection: 'pages',
    draft: false,
    depth: 1,
    limit: 1000,
    overrideAccess: false,
    pagination: false,
    select: {
      slug: true,
      tenant: true,
    },
  })

  const params = pages.docs
    ?.filter((doc) => doc.slug !== 'home' && doc.tenant && typeof doc.tenant === 'object')
    .map(({ slug, tenant }) => ({
      slug,
      tenantDomain: (tenant as { slug: string }).slug,
    }))

  return params
}

type Args = {
  params: Promise<{
    slug?: string
    tenantDomain: string
  }>
}

export default async function Page({ params: paramsPromise }: Args) {
  const { isEnabled: draft } = await draftMode()
  const { slug = 'home', tenantDomain } = await paramsPromise
  // Decode to support slugs with special characters
  const decodedSlug = decodeURIComponent(slug)
  const url = '/' + decodedSlug
  let page: RequiredDataFromCollectionSlug<'pages'> | null

  page = await queryPageBySlug({
    slug: decodedSlug,
    tenantDomain,
  })

  // Remove this code once your website is seeded
  if (!page && slug === 'home') {
    page = homeStatic
  }

  if (!page) {
    return <PayloadRedirects url={url} />
  }

  const { hero, layout } = page

  return (
    <article className="pt-16 pb-24">
      <PageClient />
      {/* Allows redirects for valid pages too */}
      <PayloadRedirects disableNotFound url={url} />

      {draft && <LivePreviewListener />}

      <RenderHero {...hero} />
      <RenderBlocks blocks={layout} tenantDomain={tenantDomain} />
    </article>
  )
}

export async function generateMetadata({ params: paramsPromise }: Args): Promise<Metadata> {
  const { slug = 'home', tenantDomain } = await paramsPromise
  // Decode to support slugs with special characters
  const decodedSlug = decodeURIComponent(slug)
  const page = await queryPageBySlug({
    slug: decodedSlug,
    tenantDomain,
  })

  return generateMeta({ doc: page, tenantDomain })
}

const queryPageBySlug = cache(async ({ slug, tenantDomain }: { slug: string; tenantDomain: string }) => {
  const { isEnabled: draft } = await draftMode()
  const tenant = await requireTenant(tenantDomain)

  const payload = await getPayload({ config: configPromise })

  const result = await payload.find({
    collection: 'pages',
    draft,
    limit: 1,
    pagination: false,
    overrideAccess: draft,
    where: {
      and: [tenantWhere(tenant.id), { slug: { equals: slug } }],
    },
  })

  return result.docs?.[0] || null
})
