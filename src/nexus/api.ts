import type { NexusPost, User } from '@/payload-types'

export function slugify(text: string): string {
  if (!text) return ''
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-\u0600-\u06FF]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export type NexusBlog = {
  id: string
  slug: string
  title: { en: string; ar: string }
  description: { en: string; ar: string }
  content: { en: string[]; ar: string[] }
  references: string[]
  coverImageUrl?: string
  status: 'pending' | 'approved' | 'rejected'
  createdAt: string
  model: string
  readMinutes: number
  tag: { en: string; ar: string }
  /** Display name of the human author, when this wasn't AI-generated. */
  author?: string
  authorId?: string
}

const splitParagraphs = (text?: string | null): string[] =>
  (text ?? '')
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)

export function toNexusBlog(doc: NexusPost): NexusBlog {
  const authorDoc = typeof doc.author === 'object' && doc.author ? doc.author : null
  const authorId =
    authorDoc?.id != null
      ? String(authorDoc.id)
      : doc.author != null
        ? String(doc.author)
        : undefined

  const docSlug = (doc as unknown as Record<string, unknown>).slug as string | undefined
  const slug = docSlug || slugify(doc.titleEn || doc.titleAr || '') || String(doc.id)

  return {
    id: String(doc.id),
    slug,
    title: { en: doc.titleEn, ar: doc.titleAr || doc.titleEn },
    description: { en: doc.descriptionEn, ar: doc.descriptionAr || doc.descriptionEn },
    content: {
      en: splitParagraphs(doc.contentEn),
      ar: splitParagraphs(doc.contentAr || doc.contentEn),
    },
    references: (doc.references ?? []).map((r) => r.value),
    coverImageUrl: doc.coverImageUrl ?? undefined,
    status: doc.status,
    createdAt: (doc.createdAt ?? '').slice(0, 10),
    model: doc.aiModel ?? '',
    readMinutes: doc.readMinutes ?? 1,
    tag: { en: doc.tagEn || 'Community', ar: doc.tagAr || doc.tagEn || 'Community' },
    author: authorDoc?.name ?? undefined,
    authorId,
  }
}

export type NewBlogInput = {
  title: string
  description: string
  content: string
  references: string
  coverImageUrl?: string
  tag: string
  lang?: 'en' | 'ar'
}

type ApiResult<T> = { ok: true; data: T } | { ok: false; error: string }

async function request<T>(path: string, init?: RequestInit): Promise<ApiResult<T>> {
  try {
    const res = await fetch(`/api${path}`, {
      ...init,
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
    })
    const json = await res.json().catch(() => null)
    if (!res.ok) {
      const message =
        json?.errors?.[0]?.message ?? json?.message ?? `Request failed (${res.status})`
      return { ok: false, error: message }
    }
    return { ok: true, data: json as T }
  } catch {
    return { ok: false, error: 'Network error — is the server reachable?' }
  }
}

export const authApi = {
  me: () => request<{ user: User | null }>('/users/me'),
  login: (email: string, password: string) =>
    request<{ user: User }>('/users/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  logout: () => request<{ message: string }>('/users/logout', { method: 'POST' }),
  signup: (name: string, email: string, password: string) =>
    request<{ doc: User }>('/users', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    }),
}

const toQuery = (params: Record<string, string>) => {
  const qs = new URLSearchParams(params).toString()
  return qs ? `?${qs}` : ''
}

export const postsApi = {
  list: (params: Record<string, string> = {}) =>
    request<{ docs: NexusPost[] }>(`/nexus-posts${toQuery({ limit: '100', ...params })}`),
  get: async (identifier: string): Promise<ApiResult<NexusPost>> => {
    const raw = decodeURIComponent(identifier).trim()

    // 1. Direct fetch if numeric ID
    if (/^\d+$/.test(raw)) {
      const directRes = await request<NexusPost>(`/nexus-posts/${raw}`)
      if (directRes.ok) return directRes
    }

    // 2. Query Payload DB by slug index
    const slugQuery = await request<{ docs: NexusPost[] }>(
      `/nexus-posts?where[slug][equals]=${encodeURIComponent(raw)}&limit=1`
    )
    if (slugQuery.ok && slugQuery.data.docs && slugQuery.data.docs.length > 0) {
      return { ok: true, data: slugQuery.data.docs[0] }
    }

    // 3. Fallback: list posts and match ID, slug, or title slug
    const listRes = await request<{ docs: NexusPost[] }>('/nexus-posts?limit=100')
    if (listRes.ok && listRes.data.docs) {
      const matched = listRes.data.docs.find(
        (doc) =>
          String(doc.id) === raw ||
          (doc as unknown as Record<string, unknown>).slug === raw ||
          slugify(doc.titleEn || '') === raw ||
          slugify(doc.titleAr || '') === raw
      )
      if (matched) {
        return { ok: true, data: matched }
      }
    }

    return request<NexusPost>(`/nexus-posts/${encodeURIComponent(raw)}`)
  },
  create: (input: NewBlogInput) => {
    const isAr = input.lang === 'ar'
    const generatedSlug = slugify(input.title)
    return request<{ doc: NexusPost }>('/nexus-posts', {
      method: 'POST',
      body: JSON.stringify({
        slug: generatedSlug || undefined,
        titleEn: isAr ? undefined : input.title.trim(),
        titleAr: isAr ? input.title.trim() : undefined,
        descriptionEn: isAr ? undefined : input.description.trim(),
        descriptionAr: isAr ? input.description.trim() : undefined,
        contentEn: isAr ? undefined : input.content.trim(),
        contentAr: isAr ? input.content.trim() : undefined,
        tagEn: isAr ? undefined : (input.tag.trim() || 'Community'),
        tagAr: isAr ? (input.tag.trim() || 'Community') : undefined,
        coverImageUrl: input.coverImageUrl?.trim() || undefined,
        references: input.references
          .split('\n')
          .map((r) => r.trim())
          .filter(Boolean)
          .map((value) => ({ value })),
        readMinutes: Math.max(1, Math.round(input.content.trim().split(/\s+/).filter(Boolean).length / 200)),
      }),
    })
  },
  update: (id: string, patch: Record<string, unknown>) => {
    const title = (patch.titleEn as string) || (patch.titleAr as string)
    if (title && !patch.slug) {
      patch.slug = slugify(title)
    }
    return request<{ doc: NexusPost }>(`/nexus-posts/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    })
  },
  decide: (id: string, status: 'approved' | 'rejected') =>
    request<{ doc: NexusPost }>(`/nexus-posts/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
  remove: (id: string) => request<{ doc: NexusPost }>(`/nexus-posts/${id}`, { method: 'DELETE' }),
}

export const usersApi = {
  list: () => request<{ docs: User[] }>('/users?limit=100'),
  updateRole: (id: string, role: string) =>
    request<{ doc: User }>(`/users/${id}`, { method: 'PATCH', body: JSON.stringify({ role }) }),
}
