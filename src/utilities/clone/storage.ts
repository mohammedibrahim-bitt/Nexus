import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import crypto from 'crypto'
import path from 'path'

/**
 * Supabase Storage access for cloned tenant assets.
 *
 * Server-only. The service-role key bypasses RLS, so this module must never be
 * imported into anything that ends up in a client bundle — hence reading it
 * from a non-`NEXT_PUBLIC_` env var, which Next refuses to expose to the browser.
 */

let cached: SupabaseClient | null = null

export const getStorageClient = (): SupabaseClient => {
  if (cached) return cached

  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    throw new Error(
      'Supabase Storage is not configured — set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (see .env.example).',
    )
  }

  cached = createClient(url, key, { auth: { persistSession: false } })

  return cached
}

export const getBucketName = (): string => process.env.SUPABASE_STORAGE_BUCKET || 'tenant-assets'

/**
 * Public URL for a stored object.
 *
 * The bucket is public deliberately: these are copies of an already-public
 * marketing site, and signed URLs would expire — forcing a re-sign and an HTML
 * rewrite on every render, and preventing browser/CDN caching.
 */
export const getPublicUrl = (storagePath: string): string => {
  const { data } = getStorageClient().storage.from(getBucketName()).getPublicUrl(storagePath)

  return data.publicUrl
}

/** Keeps a filename safe for a storage key while preserving a useful extension. */
const safeFileName = (assetUrl: string): string => {
  let pathname = ''
  try {
    pathname = new URL(assetUrl).pathname
  } catch {
    pathname = assetUrl
  }

  const base = path.posix.basename(pathname) || 'asset'
  const cleaned = base.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 80)

  return cleaned || 'asset'
}

/**
 * Content-addressed storage path for one asset.
 *
 * Hashing the source URL (not the bytes) means re-running a clone reuses the
 * same key, so a re-sync overwrites in place rather than accumulating
 * duplicates — while two genuinely different assets that happen to share a
 * filename (`/a/logo.png` vs `/b/logo.png`) still get distinct keys.
 */
export const buildAssetPath = (tenantId: number | string, assetUrl: string): string => {
  const hash = crypto.createHash('sha1').update(assetUrl).digest('hex').slice(0, 12)

  return `${tenantId}/assets/${hash}-${safeFileName(assetUrl)}`
}

export type UploadedAsset = {
  publicUrl: string
  storagePath: string
}

/** Uploads a buffer, overwriting any previous copy at the same key. */
export const uploadTenantAsset = async (args: {
  contentType?: string
  data: ArrayBuffer | Buffer | Uint8Array
  storagePath: string
}): Promise<UploadedAsset> => {
  const { contentType, data, storagePath } = args
  const client = getStorageClient()

  const { error } = await client.storage
    .from(getBucketName())
    .upload(storagePath, data as ArrayBuffer, {
      contentType: contentType || 'application/octet-stream',
      upsert: true,
    })

  if (error) throw new Error(`Storage upload failed for ${storagePath}: ${error.message}`)

  const { data: pub } = client.storage.from(getBucketName()).getPublicUrl(storagePath)

  return { publicUrl: pub.publicUrl, storagePath }
}

/** Uploads a text document (the rewritten shell HTML/CSS). */
export const uploadTenantText = async (args: {
  contentType: string
  storagePath: string
  text: string
}): Promise<UploadedAsset> =>
  uploadTenantAsset({
    contentType: args.contentType,
    data: Buffer.from(args.text, 'utf8'),
    storagePath: args.storagePath,
  })

/** Removes everything stored for a tenant — used when discarding a clone. */
export const removeTenantAssets = async (tenantId: number | string): Promise<number> => {
  const client = getStorageClient()
  const bucket = getBucketName()
  let removed = 0

  for (const folder of ['assets', 'shell', 'qa']) {
    const prefix = `${tenantId}/${folder}`
    const { data: files } = await client.storage.from(bucket).list(prefix, { limit: 1000 })

    if (files?.length) {
      const paths = files.map((f) => `${prefix}/${f.name}`)
      await client.storage.from(bucket).remove(paths)
      removed += paths.length
    }
  }

  return removed
}
