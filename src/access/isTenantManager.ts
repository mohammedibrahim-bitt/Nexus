import { isTenantManagerRole } from './permissions'

type IsTenantManager = (args: any) => boolean

/**
 * Direct drop-in replacement for the old `isAdmin` on collections that used
 * to be super_admin-only but should now also be fully manageable by a
 * tenant-scoped `admin` — Pages, Settings, Header, Footer, ContentSources,
 * SeoResearchRules, and similar. These collections are all registered with
 * the multi-tenant plugin (`plugins/index.ts`), whose `withTenantAccess`
 * wrapper automatically confines a plain `admin` (not
 * `userHasAccessToAllTenants`) to their own tenant's rows — the same
 * mechanism that already scopes `author`/`reviewer` today — so returning an
 * unconditional `true` here for a tenant-admin is safe: the plugin narrows
 * it, not this function.
 */
export const isTenantManager: IsTenantManager = ({ req: { user } }) => isTenantManagerRole(user)
