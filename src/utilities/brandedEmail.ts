import type { PayloadRequest } from 'payload'

export type BrandEmailData = {
  primaryColor: string
  siteName: string
}

/**
 * Lightweight brand lookup for transactional auth emails (password
 * reset/verify) — reads directly off the request's own Payload instance
 * rather than going through `getBrandData()`'s Next-cache/remote-brand-sync
 * machinery, which assumes a full page-render request context these auth
 * hooks don't always run inside.
 */
export async function getBrandEmailData(
  req?: PayloadRequest,
  tenantId?: null | number | string,
): Promise<BrandEmailData> {
  if (!req?.payload) {
    return { primaryColor: '#dc2626', siteName: 'Nexus' }
  }

  // Settings is one row per tenant now. Without a tenant to attribute the
  // email to (auth emails aren't always sent from a tenant-aware context) we
  // fall back to the oldest row, which is the default tenant's.
  const { docs } = await req.payload.find({
    collection: 'settings',
    depth: 0,
    limit: 1,
    sort: 'createdAt',
    ...(tenantId ? { where: { tenant: { equals: tenantId } } } : {}),
  })

  const settings = docs[0]

  return {
    primaryColor: settings?.primaryColor || '#dc2626',
    siteName: settings?.siteName || 'Nexus',
  }
}

export function brandedEmailHTML(args: {
  bodyHtml: string
  brand: BrandEmailData
  buttonLabel: string
  url: string
}): string {
  const { bodyHtml, brand, buttonLabel, url } = args

  return `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px;">
  <p style="font-size: 18px; font-weight: 700; color: #111; margin: 0 0 24px;">${brand.siteName}</p>
  <div style="font-size: 15px; line-height: 1.6; color: #333;">${bodyHtml}</div>
  <p style="margin: 28px 0;">
    <a href="${url}" style="display: inline-block; background: ${brand.primaryColor}; color: #fff; text-decoration: none; padding: 10px 20px; border-radius: 8px; font-size: 14px; font-weight: 600;">${buttonLabel}</a>
  </p>
  <p style="font-size: 13px; color: #888; word-break: break-all;">Or copy this link: ${url}</p>
</div>`.trim()
}
