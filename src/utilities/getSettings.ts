import type { BrandData } from './getBrandData'

import { getBrandData } from './getBrandData'

/**
 * Thin alias over getBrandData — kept as a separate export so call sites
 * can ask for "merged settings" (local Settings global + any brand-sync
 * overrides) without needing to know the underlying implementation lives
 * in getBrandData. The `depth` param is accepted for signature
 * compatibility with callers but isn't currently used by getBrandData.
 */
export const getMergedSettings = async (
  _depth = 0,
  tenantHostOrSlug?: null | string,
): Promise<BrandData> => {
  return getBrandData(tenantHostOrSlug)
}
