'use client'

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

import type { BlogStatus, Lang, NexusBlog } from './data'
import { demoBlogs, t } from './data'

export type BlogEdit = Partial<Pick<NexusBlog, 'title' | 'description' | 'content' | 'references'>>

export type NexusRole = 'admin' | 'reader' | 'author' | null

/** A frontend-only demo directory — no real accounts/auth, just a roster the admin can assign roles on. */
export type NexusUser = {
  id: string
  name: string
  email: string
  role: Exclude<NexusRole, null>
}

const seedUsers: NexusUser[] = [
  { id: 'u-1', name: 'Amara Osei', email: 'amara@example.com', role: 'reader' },
  { id: 'u-2', name: 'Liam Chen', email: 'liam@example.com', role: 'reader' },
  { id: 'u-3', name: 'Priya Nair', email: 'priya@example.com', role: 'author' },
  { id: 'u-4', name: 'Sofia Martins', email: 'sofia@example.com', role: 'reader' },
]

export type NewBlogInput = {
  title: string
  description: string
  content: string
  references: string
  tag: string
}

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') || 'blog'

export type UISettings = {
  accent: string
  radius: number // px
  fontScale: number // 0.9 – 1.15
  density: 'comfortable' | 'compact'
  animations: boolean
  connectedToParent: boolean
  logoText: string
}

export const defaultSettings: UISettings = {
  accent: '#6366f1',
  radius: 16,
  fontScale: 1,
  density: 'comfortable',
  animations: true,
  connectedToParent: false,
  logoText: 'Nexus',
}

/** Token set Nexus would fetch from the parent site when connected. */
export const parentSiteTokens: Pick<UISettings, 'accent' | 'radius' | 'fontScale' | 'density'> = {
  accent: '#0ea5e9',
  radius: 8,
  fontScale: 1,
  density: 'compact',
}

type NexusState = {
  lang: Lang
  setLang: (l: Lang) => void
  dark: boolean
  setDark: (d: boolean) => void
  role: NexusRole
  login: (role: Exclude<NexusRole, null>) => void
  logout: () => void
  users: NexusUser[]
  setUserRole: (id: string, role: Exclude<NexusRole, null>) => void
  settings: UISettings
  updateSettings: (patch: Partial<UISettings>) => void
  resetSettings: () => void
  statuses: Record<string, BlogStatus>
  decide: (id: string, status: BlogStatus) => void
  blogs: NexusBlog[]
  updateBlog: (id: string, patch: BlogEdit) => void
  createBlog: (input: NewBlogInput) => void
  tr: (key: string) => string
}

const NexusContext = createContext<NexusState | null>(null)

const STORAGE_KEY = 'nexus-state-v1'

type Persisted = {
  lang: Lang
  dark: boolean
  role: NexusRole
  settings: UISettings
  statuses: Record<string, BlogStatus>
  edits: Record<string, BlogEdit>
  authorBlogs: NexusBlog[]
  users: NexusUser[]
}

export function NexusProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Lang>('en')
  const [dark, setDark] = useState(false)
  const [role, setRole] = useState<NexusRole>(null)
  const [settings, setSettings] = useState<UISettings>(defaultSettings)
  const [statuses, setStatuses] = useState<Record<string, BlogStatus>>(() =>
    Object.fromEntries(demoBlogs.map((b) => [b.id, b.status])),
  )
  const [edits, setEdits] = useState<Record<string, BlogEdit>>({})
  const [authorBlogs, setAuthorBlogs] = useState<NexusBlog[]>([])
  const [users, setUsers] = useState<NexusUser[]>(seedUsers)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const p = JSON.parse(raw) as Partial<Persisted>
        if (p.lang) setLang(p.lang)
        if (typeof p.dark === 'boolean') setDark(p.dark)
        if (p.role !== undefined) setRole(p.role)
        if (p.settings) setSettings({ ...defaultSettings, ...p.settings })
        if (p.statuses) setStatuses((s) => ({ ...s, ...p.statuses }))
        if (p.edits) setEdits((e) => ({ ...e, ...p.edits }))
        if (p.authorBlogs) setAuthorBlogs(p.authorBlogs)
        if (p.users) setUsers(p.users)
      } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        setDark(true)
      }
    } catch {
      // corrupted storage — fall back to defaults
    }
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (!hydrated) return
    const persisted: Persisted = { lang, dark, role, settings, statuses, edits, authorBlogs, users }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(persisted))
  }, [hydrated, lang, dark, role, settings, statuses, edits, authorBlogs, users])

  // Reflect theme / direction / UI tokens on the document root.
  useEffect(() => {
    const root = document.documentElement
    root.setAttribute('data-theme', dark ? 'dark' : 'light')
    root.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr')
    root.setAttribute('lang', lang)
    root.style.setProperty('--nx-accent', settings.accent)
    root.style.setProperty('--nx-radius', `${settings.radius}px`)
    root.style.setProperty('--nx-font-scale', String(settings.fontScale))
    root.style.setProperty('--nx-space', settings.density === 'compact' ? '0.75' : '1')
  }, [dark, lang, settings])

  const setUserRole = useCallback((id: string, newRole: Exclude<NexusRole, null>) => {
    setUsers((u) => u.map((user) => (user.id === id ? { ...user, role: newRole } : user)))
  }, [])

  const updateSettings = useCallback(
    (patch: Partial<UISettings>) => setSettings((s) => ({ ...s, ...patch })),
    [],
  )

  const updateBlog = useCallback(
    (id: string, patch: BlogEdit) => setEdits((e) => ({ ...e, [id]: { ...e[id], ...patch } })),
    [],
  )

  const createBlog = useCallback(
    (input: NewBlogInput) => {
      const title = input.title.trim()
      const paragraphs = input.content
        .split(/\n\s*\n/)
        .map((p) => p.trim())
        .filter(Boolean)
      const references = input.references
        .split('\n')
        .map((r) => r.trim())
        .filter(Boolean)
      const wordCount = paragraphs.join(' ').split(/\s+/).filter(Boolean).length
      const id = `${slugify(title)}-${Date.now().toString(36)}`

      const blog: NexusBlog = {
        id,
        title: { en: title, ar: title },
        description: { en: input.description.trim(), ar: input.description.trim() },
        content: { en: paragraphs, ar: paragraphs },
        references,
        status: 'pending',
        generatedAt: new Date().toISOString().slice(0, 10),
        model: 'Human-written',
        readMinutes: Math.max(1, Math.round(wordCount / 200)),
        tag: { en: input.tag.trim() || 'Community', ar: input.tag.trim() || 'Community' },
        author: 'Author',
      }

      setAuthorBlogs((b) => [blog, ...b])
      setStatuses((s) => ({ ...s, [id]: 'pending' }))
    },
    [],
  )

  const blogs = useMemo<NexusBlog[]>(
    () =>
      [...demoBlogs, ...authorBlogs].map((b) => (edits[b.id] ? { ...b, ...edits[b.id] } : b)),
    [edits, authorBlogs],
  )

  const value = useMemo<NexusState>(
    () => ({
      lang,
      setLang,
      dark,
      setDark,
      role,
      login: (r) => setRole(r),
      logout: () => setRole(null),
      users,
      setUserRole,
      settings,
      updateSettings,
      resetSettings: () => setSettings(defaultSettings),
      statuses,
      decide: (id, status) => setStatuses((s) => ({ ...s, [id]: status })),
      blogs,
      updateBlog,
      createBlog,
      tr: (key) => t[key]?.[lang] ?? key,
    }),
    [
      lang,
      dark,
      role,
      users,
      setUserRole,
      settings,
      statuses,
      updateSettings,
      blogs,
      updateBlog,
      createBlog,
    ],
  )

  return <NexusContext.Provider value={value}>{children}</NexusContext.Provider>
}

export function useNexus() {
  const ctx = useContext(NexusContext)
  if (!ctx) throw new Error('useNexus must be used inside NexusProvider')
  return ctx
}
