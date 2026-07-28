import type { NexusPost, User } from '@/payload-types'

export type NexusBlog = {
  id: string
  title: { en: string; ar: string }
  description: { en: string; ar: string }
  content: { en: string[]; ar: string[] }
  references: string[]
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

  return {
    id: String(doc.id),
    title: { en: doc.titleEn, ar: doc.titleAr || doc.titleEn },
    description: { en: doc.descriptionEn, ar: doc.descriptionAr || doc.descriptionEn },
    content: {
      en: splitParagraphs(doc.contentEn),
      ar: splitParagraphs(doc.contentAr || doc.contentEn),
    },
    references: (doc.references ?? []).map((r) => r.value),
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
  get: (id: string) => request<NexusPost>(`/nexus-posts/${id}`),
  create: (input: NewBlogInput) => {
    const isAr = input.lang === 'ar'
    return request<{ doc: NexusPost }>('/nexus-posts', {
      method: 'POST',
      body: JSON.stringify({
        titleEn: isAr ? undefined : input.title.trim(),
        titleAr: isAr ? input.title.trim() : undefined,
        descriptionEn: isAr ? undefined : input.description.trim(),
        descriptionAr: isAr ? input.description.trim() : undefined,
        contentEn: isAr ? undefined : input.content.trim(),
        contentAr: isAr ? input.content.trim() : undefined,
        tagEn: isAr ? undefined : (input.tag.trim() || 'Community'),
        tagAr: isAr ? (input.tag.trim() || 'Community') : undefined,
        references: input.references
          .split('\n')
          .map((r) => r.trim())
          .filter(Boolean)
          .map((value) => ({ value })),
        readMinutes: Math.max(1, Math.round(input.content.trim().split(/\s+/).filter(Boolean).length / 200)),
      }),
    })
  },
  update: (id: string, patch: Record<string, unknown>) =>
    request<{ doc: NexusPost }>(`/nexus-posts/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    }),
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
