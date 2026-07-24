import type { Metadata } from 'next/types'

import { getBrandData } from '@/utilities/getBrandData'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import Link from 'next/link'
import React from 'react'

export const revalidate = 600

export default async function CategoriesPage() {
  const payload = await getPayload({ config: configPromise })

  const { docs: categories } = await payload.find({
    collection: 'categories',
    limit: 100,
    sort: 'title',
  })

  const categoriesWithCounts = await Promise.all(
    categories.map(async (category) => {
      const { totalDocs } = await payload.count({
        collection: 'posts',
        where: {
          categories: { contains: category.id },
          _status: { equals: 'published' },
        },
      })

      return { ...category, postCount: totalDocs }
    }),
  )

  return (
    <div className="pt-24 pb-24">
      <div className="container mb-16">
        <div className="prose dark:prose-invert max-w-none">
          <h1>Categories</h1>
        </div>
      </div>

      <div className="container">
        {categoriesWithCounts.length === 0 ? (
          <p className="text-muted-foreground">No categories yet.</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {categoriesWithCounts.map((category) => (
              <Link
                className="flex items-center justify-between rounded-xl border border-border bg-card p-4 shadow-[var(--shadow-card)] transition-shadow hover:shadow-lg"
                href={`/posts?category=${category.slug}`}
                key={category.id}
              >
                <span className="font-medium">{category.title}</span>
                <span className="text-sm text-muted-foreground">
                  {category.postCount} {category.postCount === 1 ? 'post' : 'posts'}
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
    title: `Categories | ${brand.siteName}`,
  }
}
