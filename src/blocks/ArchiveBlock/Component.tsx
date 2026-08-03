import type { Post, ArchiveBlock as ArchiveBlockProps } from '@/payload-types'

import configPromise from '@payload-config'
import { getPayload } from 'payload'
import React from 'react'
import RichText from '@/components/RichText'

import { CollectionArchive } from '@/components/CollectionArchive'
import { requireTenant } from '@/utilities/getTenant'
import { tenantWhere } from '@/utilities/tenantWhere'

export const ArchiveBlock: React.FC<
  ArchiveBlockProps & {
    id?: string
    tenantDomain: string
  }
> = async (props) => {
  const {
    id,
    categories,
    introContent,
    limit: limitFromProps,
    populateBy,
    selectedDocs,
    tenantDomain,
  } = props

  const limit = limitFromProps || 3

  let posts: Post[] = []

  if (populateBy === 'collection') {
    const tenant = await requireTenant(tenantDomain)
    const payload = await getPayload({ config: configPromise })

    const flattenedCategories = categories?.map((category) => {
      if (typeof category === 'object') return category.id
      else return category
    })

    const fetchedPosts = await payload.find({
      collection: 'posts',
      depth: 1,
      limit,
      overrideAccess: false,
      // Public archive listings only ever show published posts — never
      // rely on the viewer's own access level (an admin/reviewer viewing
      // the site would otherwise see drafts mixed in with real content).
      where: {
        and: [
          tenantWhere(tenant.id),
          { _status: { equals: 'published' } },
          ...(flattenedCategories && flattenedCategories.length > 0
            ? [{ categories: { in: flattenedCategories } }]
            : []),
        ],
      },
    })

    posts = fetchedPosts.docs
  } else {
    if (selectedDocs?.length) {
      const filteredSelectedPosts = selectedDocs.map((post) => {
        if (typeof post.value === 'object') return post.value
      }) as Post[]

      posts = filteredSelectedPosts
    }
  }

  return (
    <div className="my-16" id={`block-${id}`}>
      {introContent && (
        <div className="container mb-16">
          <RichText className="ms-0 max-w-[48rem]" data={introContent} enableGutter={false} />
        </div>
      )}
      <CollectionArchive posts={posts} />
    </div>
  )
}
