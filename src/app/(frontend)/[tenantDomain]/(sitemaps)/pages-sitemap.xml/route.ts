import { getServerSideSitemap } from 'next-sitemap'
import { getPayload } from 'payload'
import config from '@payload-config'
import { unstable_cache } from 'next/cache'

import { requireTenant } from '@/utilities/getTenant'
import { tenantWhere } from '@/utilities/tenantWhere'

// Built per tenant — see the note in posts-sitemap.xml.
const getPagesSitemap = (tenantDomain: string) =>
  unstable_cache(
    async () => {
      const tenant = await requireTenant(tenantDomain)
      const payload = await getPayload({ config })
      const SITE_URL =
        process.env.NEXT_PUBLIC_SERVER_URL ||
        process.env.VERCEL_PROJECT_PRODUCTION_URL ||
        'https://example.com'

      const results = await payload.find({
        collection: 'pages',
        overrideAccess: false,
        draft: false,
        depth: 0,
        limit: 1000,
        pagination: false,
        where: {
          and: [tenantWhere(tenant.id), { _status: { equals: 'published' } }],
        },
        select: {
          slug: true,
          updatedAt: true,
        },
      })

      const dateFallback = new Date().toISOString()

      const defaultSitemap = [
        {
          loc: `${SITE_URL}/search`,
          lastmod: dateFallback,
        },
        {
          loc: `${SITE_URL}/posts`,
          lastmod: dateFallback,
        },
      ]

      const sitemap = results.docs
        ? results.docs
            .filter((page) => Boolean(page?.slug))
            .map((page) => {
              return {
                loc: page?.slug === 'home' ? `${SITE_URL}/` : `${SITE_URL}/${page?.slug}`,
                lastmod: page.updatedAt || dateFallback,
              }
            })
        : []

      return [...defaultSitemap, ...sitemap]
    },
    ['pages-sitemap', tenantDomain],
    {
      tags: [`pages-sitemap_${tenantDomain}`],
    },
  )

type Args = { params: Promise<{ tenantDomain: string }> }

export async function GET(_request: Request, { params: paramsPromise }: Args) {
  const { tenantDomain } = await paramsPromise
  const sitemap = await getPagesSitemap(tenantDomain)()

  return getServerSideSitemap(sitemap)
}
