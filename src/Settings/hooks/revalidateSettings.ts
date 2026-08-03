import type { CollectionAfterChangeHook } from 'payload'

import { revalidateTag } from 'next/cache'

import { tenantCacheTag } from '@/utilities/tenantCacheTag'

// Settings is a per-tenant "global" (one row per tenant) rather than a Payload
// Global, so the cache tag has to be tenant-scoped — a shared tag would make
// one tenant's branding edit bust every other tenant's cached pages.
export const revalidateSettings: CollectionAfterChangeHook = ({
  doc,
  req: { payload, context },
}) => {
  if (!context.disableRevalidate) {
    const tag = tenantCacheTag('settings', doc.tenant)

    payload.logger.info(`Revalidating ${tag}`)

    revalidateTag(tag, 'max')
  }

  return doc
}
