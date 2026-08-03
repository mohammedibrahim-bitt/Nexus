import type { CollectionAfterChangeHook } from 'payload'

import { revalidateTag } from 'next/cache'

import { tenantCacheTag } from '@/utilities/tenantCacheTag'

// Per-tenant "global" — see the note in revalidateSettings for why the tag
// must be tenant-scoped.
export const revalidateHeader: CollectionAfterChangeHook = ({
  doc,
  req: { payload, context },
}) => {
  if (!context.disableRevalidate) {
    const tag = tenantCacheTag('header', doc.tenant)

    payload.logger.info(`Revalidating ${tag}`)

    revalidateTag(tag, 'max')
  }

  return doc
}
