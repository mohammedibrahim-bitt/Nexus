import type { GlobalAfterChangeHook } from 'payload'

import { revalidateTag } from 'next/cache.js'

export const revalidateSettings: GlobalAfterChangeHook = ({ doc, req: { payload, context } }) => {
  if (!context.disableRevalidate) {
    payload.logger.info(`Revalidating settings`)

    revalidateTag('global_settings', 'max')
  }

  return doc
}
