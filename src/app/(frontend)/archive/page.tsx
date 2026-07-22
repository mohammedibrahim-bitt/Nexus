import type { Metadata } from 'next/types'

import { getBrandData } from '@/utilities/getBrandData'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import Link from 'next/link'
import React from 'react'

export const revalidate = 600

export default async function ArchivePage() {
  const payload = await getPayload({ config: configPromise })

  const { docs: posts } = await payload.find({
    collection: 'posts',
    depth: 0,
    limit: 500,
    pagination: false,
    sort: '-publishedAt',
    select: {
      title: true,
      slug: true,
      publishedAt: true,
    },
  })

  const groupedByYear = posts.reduce<Record<string, typeof posts>>((acc, post) => {
    const year = post.publishedAt ? new Date(post.publishedAt).getFullYear().toString() : 'Undated'
    acc[year] = acc[year] || []
    acc[year].push(post)
    return acc
  }, {})

  const years = Object.keys(groupedByYear).sort((a, b) => Number(b) - Number(a))

  return (
    <div className="pt-24 pb-24">
      <div className="container mb-16">
        <div className="prose dark:prose-invert max-w-none">
          <h1>Archive</h1>
        </div>
      </div>

      <div className="container max-w-[48rem]">
        {years.length === 0 && <p className="text-muted-foreground">No posts yet.</p>}

        {years.map((year) => (
          <div className="mb-10" key={year}>
            <h2 className="mb-4 text-2xl font-bold">{year}</h2>
            <ul className="flex flex-col divide-y divide-border border-t border-b border-border">
              {groupedByYear[year].map((post) => (
                <li key={post.id}>
                  <Link
                    className="flex items-center justify-between gap-4 py-3 hover:text-primary"
                    href={`/posts/${post.slug}`}
                  >
                    <span>{post.title}</span>
                    {post.publishedAt && (
                      <time className="shrink-0 text-sm text-muted-foreground" dateTime={post.publishedAt}>
                        {new Date(post.publishedAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </time>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}

export async function generateMetadata(): Promise<Metadata> {
  const brand = await getBrandData()

  return {
    title: `Archive | ${brand.siteName}`,
  }
}
