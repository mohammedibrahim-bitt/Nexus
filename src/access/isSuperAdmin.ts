import { isSuperAdmin as isSuperAdminUser } from './permissions'

type IsSuperAdmin = (args: any) => boolean

// Platform-wide only — tenant creation/deletion, the site-clone pipeline,
// and anything else that must never be reachable by a tenant-scoped `admin`.
// For "full CRUD within one's own tenant," use isTenantManagerRole instead.
export const isSuperAdmin: IsSuperAdmin = ({ req: { user } }) => isSuperAdminUser(user)
