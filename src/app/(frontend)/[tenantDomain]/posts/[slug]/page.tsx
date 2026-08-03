import type { Metadata } from 'next'

import { RelatedPosts } from '@/blocks/RelatedPosts/Component'
import { ArticleByline } from '@/components/ArticleByline'
import { EditorialTeam } from '@/components/EditorialTeam'
import { PayloadRedirects } from '@/components/PayloadRedirects'
import { PostReviews } from '@/components/PostReviews'
import { ShareButtons } from '@/components/ShareButtons'
import { TableOfContents } from '@/components/TableOfContents'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { draftMode } from 'next/headers'
import React, { cache } from 'react'
import RichText from '@/components/RichText'

import type { Post } from '@/payload-types'

import { PostHero } from '@/heros/PostHero'
import { generateMeta } from '@/utilities/generateMeta'
import { getServerSideURL } from '@/utilities/getURL'
import { requireTenant } from '@/utilities/getTenant'
import { tenantWhere } from '@/utilities/tenantWhere'
import { extractHeadings, estimateReadingTime } from '@/utilities/richTextHeadings'
import PageClient from './page.client'
import { LivePreviewListener } from '@/components/LivePreviewListener'

export async function generateStaticParams() {
  const payload = await getPayload({ config: configPromise })
  // Pre-rendered per tenant — the same slug can exist under several tenants.
  const posts = await payload.find({
    collection: 'posts',
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

  const params = posts.docs
    .filter((doc) => doc.tenant && typeof doc.tenant === 'object')
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

export default async function Post({ params: paramsPromise }: Args) {
  const { isEnabled: draft } = await draftMode()
  const { slug = '', tenantDomain } = await paramsPromise
  // Decode to support slugs with special characters
  const decodedSlug = decodeURIComponent(slug)
  const url = '/posts/' + decodedSlug
  const post = await queryPostBySlug({ slug: decodedSlug, tenantDomain })

  if (!post) return <PayloadRedirects url={url} />

  const headings = extractHeadings(post.content)
  const readingTimeMinutes = estimateReadingTime(post.content)

  return (
    <article className="pt-16 pb-16">
      <PageClient />

      {/* Allows redirects for valid pages too */}
      <PayloadRedirects disableNotFound url={url} />

      {draft && <LivePreviewListener />}

      <PostHero post={post} />

      <div className="pt-8">
        <div className="container">
          <div className="max-w-[48rem] mx-auto mb-8">
            <ArticleByline
              author={post.populatedAuthors?.[0]}
              expertVerified={post.expertVerified ?? undefined}
              readingTimeMinutes={readingTimeMinutes}
              reviewer={post.populatedReviewedBy ?? undefined}
              updatedAt={post.updatedAt}
            />
          </div>

          {headings.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-12 items-start max-w-[68rem] mx-auto">
              <div className="min-w-0">
                <RichText className="max-w-[48rem]" data={post.content} enableGutter={false} />
              </div>
              <aside className="hidden lg:block sticky top-28">
                <TableOfContents headings={headings} />
              </aside>
            </div>
          ) : (
            <RichText className="max-w-[48rem] mx-auto" data={post.content} enableGutter={false} />
          )}

          {post.relatedPosts && post.relatedPosts.length > 0 && (
            <RelatedPosts
              className="mt-12 max-w-[52rem] lg:grid lg:grid-cols-subgrid col-start-1 col-span-3 grid-rows-[2fr]"
              docs={post.relatedPosts.filter((post) => typeof post === 'object')}
            />
          )}

          <PostReviews postId={post.id} />

          <div className="max-w-[48rem] mx-auto mt-12 flex flex-col gap-8">
            <ShareButtons title={post.title} url={`${getServerSideURL()}${url}`} />

            <EditorialTeam
              author={post.populatedAuthors?.[0] as React.ComponentProps<typeof EditorialTeam>['author']}
              reviewer={post.populatedReviewedBy as React.ComponentProps<typeof EditorialTeam>['reviewer']}
            />
          </div>
        </div>
      </div>
    </article>
  )
}

export async function generateMetadata({ params: paramsPromise }: Args): Promise<Metadata> {
  const { slug = '', tenantDomain } = await paramsPromise
  // Decode to support slugs with special characters
  const decodedSlug = decodeURIComponent(slug)
  const post = await queryPostBySlug({ slug: decodedSlug, tenantDomain })

  return generateMeta({ doc: post, tenantDomain })
}

const queryPostBySlug = cache(async ({ slug, tenantDomain }: { slug: string; tenantDomain: string }) => {
  const { isEnabled: draft } = await draftMode()
  const tenant = await requireTenant(tenantDomain)

  const payload = await getPayload({ config: configPromise })

  const result = await payload.find({
    collection: 'posts',
    draft,
    limit: 1,
    overrideAccess: draft,
    pagination: false,
    where: {
      and: [tenantWhere(tenant.id), { slug: { equals: slug } }],
    },
  })

  return result.docs?.[0] || null
})
