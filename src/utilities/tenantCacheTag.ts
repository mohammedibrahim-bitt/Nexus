/**
 * Builds the cache tag for a per-tenant "global" document (settings, header,
 * footer). Keyed by tenant ID rather than slug so the write side (afterChange
 * hooks, which only ever have the relationship value) never needs an extra
 * lookup to invalidate correctly.
 *
 * Accepts either a populated relationship object or a bare ID, since the depth
 * of the doc handed to a hook varies by call site.
 */
export const tenantCacheTag = (
  slug: 'footer' | 'header' | 'settings',
  tenant: { id: number | string } | null | number | string | undefined,
): string => {
  const tenantId = tenant && typeof tenant === 'object' ? tenant.id : tenant

  return `tenant_${tenantId ?? 'unknown'}_${slug}`
}
