import type { Metadata } from 'next/types'

import { getBrandData } from '@/utilities/getBrandData'
import { requireTenant } from '@/utilities/getTenant'
import { tenantWhere } from '@/utilities/tenantWhere'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import Link from 'next/link'
import React from 'react'

export const revalidate = 600

type Args = { params: Promise<{ tenantDomain: string }> }

export default async function CategoriesPage({ params: paramsPromise }: Args) {
  const { tenantDomain } = await paramsPromise
  const tenant = await requireTenant(tenantDomain)
  const payload = await getPayload({ config: configPromise })

  const { docs: categories } = await payload.find({
    collection: 'categories',
    limit: 100,
    sort: 'title',
    where: tenantWhere(tenant.id),
  })

  const categoriesWithCounts = await Promise.all(
    categories.map(async (category) => {
      const { totalDocs } = await payload.count({
        collection: 'posts',
        where: {
          and: [
            tenantWhere(tenant.id),
            { categories: { contains: category.id } },
            { _status: { equals: 'published' } },
          ],
        },
      })

      return { ...category, postCount: totalDocs }
    }),
  )

  return (
    <div className="pt-24 pb-24">
      <div className="container mb-16">
        <p className="kicker mb-2">Sections</p>
        <h1 className="font-display text-4xl leading-tight font-semibold md:text-5xl">Categories</h1>
        <div aria-hidden className="editorial-rule mt-5" />
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

export async function generateMetadata({ params: paramsPromise }: Args): Promise<Metadata> {
  const { tenantDomain } = await paramsPromise
  const brand = await getBrandData(tenantDomain)

  return {
    title: `Categories | ${brand.siteName}`,
  }
}
