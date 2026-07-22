import Link from 'next/link'
import React from 'react'

import { CollectionArchive } from '@/components/CollectionArchive'
import { Button } from '@/components/ui/button'
import configPromise from '@payload-config'
import { getPayload } from 'payload'

export default async function NotFound() {
  const payload = await getPayload({ config: configPromise })

  const recentPosts = await payload.find({
    collection: 'posts',
    depth: 1,
    limit: 3,
    overrideAccess: false,
    sort: '-publishedAt',
    select: {
      title: true,
      slug: true,
      categories: true,
      meta: true,
    },
  })

  return (
    <div className="py-28">
      <div className="container max-w-xl">
        <p className="text-sm font-semibold text-muted-foreground">404</p>
        <h1 className="mt-2 text-4xl font-bold">This page doesn&apos;t exist.</h1>
        <p className="mt-3 text-muted-foreground">
          The page you're looking for may have been moved, renamed, or never existed.
        </p>

        <div className="mt-6 flex gap-3">
          <Button asChild variant="default">
            <Link href="/">Go home</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/search">Search the site</Link>
          </Button>
        </div>
      </div>

      {recentPosts.docs.length > 0 && (
        <div className="mt-16">
          <div className="container mb-6">
            <h2 className="text-xl font-semibold">Recent posts</h2>
          </div>
          <CollectionArchive posts={recentPosts.docs} />
        </div>
      )}
    </div>
  )
}
