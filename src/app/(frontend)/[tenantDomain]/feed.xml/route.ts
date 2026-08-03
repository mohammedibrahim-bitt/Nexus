import configPromise from '@payload-config'
import { getPayload } from 'payload'

import { getBrandData } from '@/utilities/getBrandData'
import { getServerSideURL } from '@/utilities/getURL'
import { requireTenant } from '@/utilities/getTenant'
import { tenantWhere } from '@/utilities/tenantWhere'

export const revalidate = 3600

const escapeXml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')

type Args = { params: Promise<{ tenantDomain: string }> }

export async function GET(_request: Request, { params: paramsPromise }: Args) {
  const { tenantDomain } = await paramsPromise
  const tenant = await requireTenant(tenantDomain)
  const payload = await getPayload({ config: configPromise })
  const brand = await getBrandData(tenantDomain)
  const serverUrl = getServerSideURL()

  const { docs: posts } = await payload.find({
    collection: 'posts',
    depth: 0,
    limit: 50,
    overrideAccess: false,
    sort: '-publishedAt',
    where: { and: [tenantWhere(tenant.id), { _status: { equals: 'published' } }] },
    select: {
      title: true,
      slug: true,
      publishedAt: true,
      meta: true,
    },
  })

  const items = posts
    .map((post) => {
      const url = `${serverUrl}/posts/${post.slug}`
      const pubDate = post.publishedAt ? new Date(post.publishedAt).toUTCString() : ''

      return `
    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${url}</link>
      <guid>${url}</guid>
      ${pubDate ? `<pubDate>${pubDate}</pubDate>` : ''}
      ${post.meta?.description ? `<description>${escapeXml(post.meta.description)}</description>` : ''}
    </item>`
    })
    .join('')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${escapeXml(brand.siteName)}</title>
    <link>${serverUrl}</link>
    <description>${escapeXml(brand.siteName)} — latest posts</description>
    <language>en</language>${items}
  </channel>
</rss>`

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
    },
  })
}
