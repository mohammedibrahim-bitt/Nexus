import type { Access } from 'payload'

import { isTenantManagerRole } from './permissions'

/**
 * super_admin sees every SEO research run platform-wide. A tenant-scoped
 * `admin` sees every run in their own tenant — returning `true` here isn't a
 * blanket allow for them: this collection is registered with the
 * multi-tenant plugin (`plugins/index.ts`), whose `withTenantAccess` wrapper
 * automatically narrows any non-`userHasAccessToAllTenants` user's `true`
 * down to a tenant-scoped `where`, the same way it already does for
 * `author`/`reviewer` elsewhere. Everyone else can only see/manage the runs
 * they personally triggered — each run is tied to whoever's own API keys
 * paid for it.
 */
export const isAdminOrTriggeredBy: Access = ({ req: { user } }) => {
  if (!user || user.collection !== 'users') return false
  if (isTenantManagerRole(user)) return true

  return {
    triggeredBy: {
      equals: user.id,
    },
  }
}
