import type { Metadata } from 'next/types'

import { getBrandData } from '@/utilities/getBrandData'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import Link from 'next/link'
import React from 'react'

export const revalidate = 600

export default async function TagsPage() {
  const payload = await getPayload({ config: configPromise })

  const { docs: tags } = await payload.find({
    collection: 'tags',
    limit: 100,
    sort: 'title',
  })

  const tagsWithCounts = await Promise.all(
    tags.map(async (tag) => {
      const { totalDocs } = await payload.count({
        collection: 'posts',
        where: {
          tags: { contains: tag.id },
          _status: { equals: 'published' },
        },
      })

      return { ...tag, postCount: totalDocs }
    }),
  )

  return (
    <div className="pt-24 pb-24">
      <div className="container mb-16">
        <p className="kicker mb-2">Browse by topic</p>
        <h1 className="font-display text-4xl leading-tight font-semibold md:text-5xl">Tags</h1>
        <div aria-hidden className="editorial-rule mt-5" />
      </div>

      <div className="container">
        {tagsWithCounts.length === 0 ? (
          <p className="text-muted-foreground">No tags yet.</p>
        ) : (
          <div className="flex flex-wrap gap-3">
            {tagsWithCounts.map((tag) => (
              <Link
                className="rounded-full border border-border px-4 py-2 text-sm transition-colors hover:bg-muted"
                href={`/posts?tag=${tag.slug}`}
                key={tag.id}
              >
                #{tag.title}{' '}
                <span className="text-muted-foreground">
                  ({tag.postCount})
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export async function generateMetadata(): Promise<Metadata> {
  const brand = await getBrandData()

  return {
    title: `Tags | ${brand.siteName}`,
  }
}
