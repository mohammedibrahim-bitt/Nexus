import type { Metadata } from 'next/types'

import { CollectionArchive } from '@/components/CollectionArchive'
import { StructuredData } from '@/components/StructuredData'
import { getBrandData } from '@/utilities/getBrandData'
import { authorSchema } from '@/utilities/schema'
import { requireTenant } from '@/utilities/getTenant'
import { tenantWhere } from '@/utilities/tenantWhere'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { notFound } from 'next/navigation'
import React from 'react'

type Args = {
  params: Promise<{ id: string; tenantDomain: string }>
}

const getAuthorProfile = async (id: string) => {
  const payload = await getPayload({ config: configPromise })

  try {
    const user = await payload.findByID({
      id,
      collection: 'users',
      depth: 1,
    })

    if (!user || !user.name) return null

    return {
      id: user.id,
      avatarUrl:
        user.avatar && typeof user.avatar === 'object' && 'url' in user.avatar
          ? user.avatar.url || undefined
          : undefined,
      bio: user.bio || undefined,
      name: user.name,
      socialLinks: user.socialLinks || [],
      title: user.title || undefined,
    }
  } catch {
    return null
  }
}

export default async function AuthorPage({ params: paramsPromise }: Args) {
  const { id, tenantDomain } = await paramsPromise
  const tenant = await requireTenant(tenantDomain)
  const author = await getAuthorProfile(id)

  if (!author) notFound()

  const payload = await getPayload({ config: configPromise })

  // Users are shared across tenants, but their posts are not — an author page
  // on one subdomain must only list that tenant's articles.
  const posts = await payload.find({
    collection: 'posts',
    depth: 1,
    limit: 24,
    overrideAccess: false,
    where: {
      and: [
        tenantWhere(tenant.id),
        { authors: { contains: author.id } },
        { _status: { equals: 'published' } },
      ],
    },
    select: {
      title: true,
      slug: true,
      categories: true,
      meta: true,
      heroImage: true,
    },
  })

  const brand = await getBrandData(tenantDomain)

  return (
    <div className="pt-24 pb-24">
      <StructuredData data={authorSchema(author, brand)} />
      <div className="container mb-12">
        <div className="flex items-start gap-5">
          {author.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              alt={author.name}
              className="size-20 shrink-0 rounded-full object-cover"
              src={author.avatarUrl}
            />
          ) : (
            <div className="flex size-20 shrink-0 items-center justify-center rounded-full bg-muted text-2xl font-medium">
              {author.name.trim()[0]?.toUpperCase() || '?'}
            </div>
          )}

          <div>
            <h1 className="text-3xl font-bold">{author.name}</h1>
            {author.title && <p className="text-muted-foreground">{author.title}</p>}
            {author.bio && <p className="mt-3 max-w-2xl">{author.bio}</p>}

            {author.socialLinks.length > 0 && (
              <div className="mt-4 flex gap-3">
                {author.socialLinks
                  .filter((link) => link.platform && link.url)
                  .map((link) => (
                    <a
                      className="text-sm underline text-muted-foreground hover:text-foreground"
                      href={link.url as string}
                      key={link.platform}
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      {link.platform}
                    </a>
                  ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="container mb-8">
        <h2 className="text-xl font-semibold">
          {posts.totalDocs} {posts.totalDocs === 1 ? 'post' : 'posts'}
        </h2>
      </div>

      <CollectionArchive posts={posts.docs} />
    </div>
  )
}

export async function generateMetadata({ params: paramsPromise }: Args): Promise<Metadata> {
  const { id, tenantDomain } = await paramsPromise
  const author = await getAuthorProfile(id)
  const brand = await getBrandData(tenantDomain)

  if (!author) return { title: `Author not found | ${brand.siteName}` }

  return { title: `${author.name} | ${brand.siteName}` }
}
