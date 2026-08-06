import { describe, expect, it } from 'vitest'

import { isSuperAdmin, isTenantManagerRole, userTenantIds, usersSharingTenantWhere } from '@/access/permissions'
import { isAdminOrSelf } from '@/access/isAdminOrSelf'
import { isStaffOrSelf } from '@/access/isStaffOrSelf'
import { isSuperAdminOrTenantAdmin } from '@/access/isSuperAdminOrTenantAdmin'
import { enforceTenantAdminBoundaries } from '@/collections/Users/hooks/enforceTenantAdminBoundaries'

/**
 * Covers the tenant-admin role's authorization logic directly, the same way
 * dns-verification.int.spec.ts covers its own pure exported functions — no
 * live DB needed, since every access function and the boundary-enforcement
 * hook are plain functions of their arguments.
 *
 * This is the actual security boundary these tests pin down: a tenant-admin
 * must never see/act on another tenant's data, never grant super_admin, and
 * never promote themselves — enforced server-side, not just hidden in the UI.
 */

const superAdmin = { id: 1, collection: 'users' as const, role: 'super_admin' as const, tenants: [] }
const tenantAAdmin = {
  id: 2,
  collection: 'users' as const,
  role: 'admin' as const,
  tenants: [{ tenant: 10 }],
}
const tenantBAdmin = {
  id: 3,
  collection: 'users' as const,
  role: 'admin' as const,
  tenants: [{ tenant: 20 }],
}
const unassignedAdmin = { id: 4, collection: 'users' as const, role: 'admin' as const, tenants: [] }
const author = { id: 5, collection: 'users' as const, role: 'author' as const, tenants: [{ tenant: 10 }] }
const reader = { id: 6, collection: 'users' as const, role: 'reader' as const, tenants: [] }

// The access/permissions.ts helpers only read `collection`/`role`/`tenants`,
// so a partial object matching that shape is sufficient without pulling in
// every other required field on the generated `User` type.
const asReqUser = (user: unknown) => ({ req: { user } }) as never

describe('Tenant-admin role', () => {
  describe('permission predicates', () => {
    it('isSuperAdmin is true only for super_admin', () => {
      expect(isSuperAdmin(superAdmin)).toBe(true)
      expect(isSuperAdmin(tenantAAdmin)).toBe(false)
      expect(isSuperAdmin(author)).toBe(false)
      expect(isSuperAdmin(null)).toBe(false)
    })

    it('isTenantManagerRole is true for super_admin and admin, false otherwise', () => {
      expect(isTenantManagerRole(superAdmin)).toBe(true)
      expect(isTenantManagerRole(tenantAAdmin)).toBe(true)
      expect(isTenantManagerRole(author)).toBe(false)
      expect(isTenantManagerRole(reader)).toBe(false)
      expect(isTenantManagerRole(null)).toBe(false)
    })

    it('userTenantIds extracts tenant ids from the tenants array', () => {
      expect(userTenantIds(tenantAAdmin)).toEqual([10])
      expect(userTenantIds(unassignedAdmin)).toEqual([])
    })

    it('usersSharingTenantWhere matches nothing for a user with no tenants', () => {
      expect(usersSharingTenantWhere(unassignedAdmin)).toEqual({ id: { equals: -1 } })
    })

    it('usersSharingTenantWhere queries the tenants.tenant array subfield', () => {
      expect(usersSharingTenantWhere(tenantAAdmin)).toEqual({ 'tenants.tenant': { in: [10] } })
    })
  })

  describe('Users collection access — isStaffOrSelf (read)', () => {
    it('super_admin sees everyone', () => {
      expect(isStaffOrSelf(asReqUser(superAdmin))).toBe(true)
    })

    it('a tenant-admin is scoped to same-tenant users, or self', () => {
      const result = isStaffOrSelf(asReqUser(tenantAAdmin))
      expect(result).toEqual({
        or: [{ id: { equals: tenantAAdmin.id } }, { 'tenants.tenant': { in: [10] } }],
      })
    })

    it('a reader only ever sees their own record', () => {
      expect(isStaffOrSelf(asReqUser(reader))).toEqual({ id: { equals: reader.id } })
    })

    it('denies an unauthenticated request', () => {
      expect(isStaffOrSelf(asReqUser(null))).toBe(false)
    })
  })

  describe('Users collection access — isAdminOrSelf (update)', () => {
    it('super_admin can update anyone', () => {
      expect(isAdminOrSelf(asReqUser(superAdmin))).toBe(true)
    })

    it('a tenant-admin is scoped to same-tenant users, or self', () => {
      const result = isAdminOrSelf(asReqUser(tenantAAdmin))
      expect(result).toEqual({
        or: [{ id: { equals: tenantAAdmin.id } }, { 'tenants.tenant': { in: [10] } }],
      })
    })

    it('an author can only update their own record', () => {
      expect(isAdminOrSelf(asReqUser(author))).toEqual({ id: { equals: author.id } })
    })
  })

  describe('Users collection access — isSuperAdminOrTenantAdmin (delete)', () => {
    it('super_admin can delete anyone', () => {
      expect(isSuperAdminOrTenantAdmin(asReqUser(superAdmin))).toBe(true)
    })

    it('a tenant-admin is scoped to same-tenant users, with no self carve-out', () => {
      expect(isSuperAdminOrTenantAdmin(asReqUser(tenantAAdmin))).toEqual({
        'tenants.tenant': { in: [10] },
      })
    })

    it('an author has no delete access at all', () => {
      expect(isSuperAdminOrTenantAdmin(asReqUser(author))).toBe(false)
    })
  })

  describe('enforceTenantAdminBoundaries', () => {
    const runHook = (args: {
      actor: unknown
      data: Record<string, unknown>
      operation: 'create' | 'update'
      originalDoc?: unknown
    }) =>
      enforceTenantAdminBoundaries({
        data: args.data,
        operation: args.operation,
        originalDoc: args.originalDoc as never,
        req: { user: args.actor } as never,
      } as never)

    it('is a no-op for super_admin — no restriction on role or tenants', async () => {
      const data = { role: 'super_admin', tenants: [{ tenant: 999 }] }
      await expect(runHook({ actor: superAdmin, data, operation: 'update' })).resolves.toBe(data)
    })

    it('is a no-op when there is no authenticated tenant-admin actor', async () => {
      const data = { role: 'admin' }
      await expect(runHook({ actor: null, data, operation: 'create' })).resolves.toBe(data)
    })

    it('blocks a tenant-admin from granting super_admin to anyone', async () => {
      await expect(
        runHook({ actor: tenantAAdmin, data: { role: 'super_admin' }, operation: 'create' }),
      ).rejects.toThrow('Only a Super Admin can grant the Super Admin role.')
    })

    it('blocks a tenant-admin from changing their own role', async () => {
      await expect(
        runHook({
          actor: tenantAAdmin,
          data: { role: 'author' },
          operation: 'update',
          originalDoc: { id: tenantAAdmin.id, role: 'admin' },
        }),
      ).rejects.toThrow('You cannot change your own role.')
    })

    it('allows a tenant-admin to change their own non-role fields', async () => {
      const data = { name: 'New Name' }
      await expect(
        runHook({
          actor: tenantAAdmin,
          data,
          operation: 'update',
          originalDoc: { id: tenantAAdmin.id, role: 'admin' },
        }),
      ).resolves.toBe(data)
    })

    it("allows a tenant-admin to change another same-tenant user's role to a non-super_admin role", async () => {
      const data = { role: 'reviewer' }
      await expect(
        runHook({
          actor: tenantAAdmin,
          data,
          operation: 'update',
          originalDoc: { id: author.id, role: 'author' },
        }),
      ).resolves.toBe(data)
    })

    it('blocks a tenant-admin from assigning a user to a tenant outside their own', async () => {
      await expect(
        runHook({
          actor: tenantAAdmin,
          data: { tenants: [{ tenant: 20 }] }, // tenant B, not tenant A
          operation: 'create',
        }),
      ).rejects.toThrow('You can only assign users to your own tenant.')
    })

    it('allows a tenant-admin to assign a user to their own tenant', async () => {
      const data = { tenants: [{ tenant: 10 }] }
      await expect(runHook({ actor: tenantAAdmin, data, operation: 'create' })).resolves.toBe(data)
    })

    it("tenant A's admin and tenant B's admin cannot assign into each other's tenant", async () => {
      await expect(
        runHook({ actor: tenantAAdmin, data: { tenants: [{ tenant: 20 }] }, operation: 'create' }),
      ).rejects.toThrow()
      await expect(
        runHook({ actor: tenantBAdmin, data: { tenants: [{ tenant: 10 }] }, operation: 'create' }),
      ).rejects.toThrow()
    })
  })
})
