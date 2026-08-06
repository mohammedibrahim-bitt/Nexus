import { getUserTenantIDs } from '@payloadcms/plugin-multi-tenant/utilities'

import type { Where } from 'payload'
import type { User } from '@/payload-types'

/**
 * Structurally compatible with both the full server-side `User` (used by
 * access functions) and Payload admin config's slimmer `ClientUser` (used by
 * `admin.hidden` callbacks, e.g. in `ContentSources.ts`) — only `collection`
 * and `role` are read here, so a minimal shape lets the same two checks
 * below serve both contexts without a cast at every call site.
 */
type RoleBearingUser = { collection?: string; role?: null | string } | null | undefined

/**
 * Central definition of the two staff role-groups every access function in
 * this directory checks against, so a future role only needs to be added
 * here rather than in a dozen scattered `role === '...'` conditionals.
 *
 * - `super_admin`: unrestricted, platform-wide (tenant creation/deletion,
 *   the site-clone pipeline, every tenant's data). Bypasses tenant scoping
 *   entirely via `userHasAccessToAllTenants` in `src/plugins/index.ts`.
 * - `admin`: full CRUD, but only within their own assigned tenant(s). Not a
 *   plugin-managed collection scope — enforced the same way `author`/
 *   `reviewer` already are, by NOT being in the super-admin bypass list, so
 *   the multi-tenant plugin's own `withTenantAccess` wrapper confines them.
 */
export const isSuperAdmin = (user: RoleBearingUser): boolean =>
  Boolean(user && user.collection === 'users' && user.role === 'super_admin')

/** super_admin OR the tenant-scoped admin role — "can fully manage this resource". */
export const isTenantManagerRole = (user: RoleBearingUser): boolean =>
  Boolean(user && user.collection === 'users' && (user.role === 'super_admin' || user.role === 'admin'))

/**
 * IDs of every tenant a user is assigned to, via the multi-tenant plugin's
 * own extraction helper (reused rather than re-implemented, so this stays
 * correct if the plugin's field names ever change).
 */
export const userTenantIds = (user: null | undefined | User): number[] =>
  getUserTenantIDs<number>(user ?? null)

/**
 * Where-clause matching other Users who share at least one tenant with
 * `user`. The `Users` collection is deliberately NOT registered with the
 * multi-tenant plugin's `collections` map in `plugins/index.ts` — it has its
 * own separate `tenants` hasMany field (added by the plugin's
 * `tenantsArrayField`, "which tenants can I act in," a different concept
 * from a document's single owning tenant) — so, unlike every other
 * tenant-scoped collection, Users gets none of the automatic
 * `withTenantAccess` filtering for free. This is the hand-written
 * equivalent, used by the Users collection's own access functions.
 *
 * Returns a clause that matches nothing if `user` has no tenants — callers
 * should `or` this with a self clause so the requester can still see/act on
 * their own record.
 */
export const usersSharingTenantWhere = (user: User): Where => {
  const tenantIds = userTenantIds(user)
  if (tenantIds.length === 0) return { id: { equals: -1 } }
  return { 'tenants.tenant': { in: tenantIds } }
}
