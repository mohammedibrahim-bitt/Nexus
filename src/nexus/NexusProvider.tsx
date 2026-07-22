'use client'

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

import type { BlogStatus, Lang } from './data'
import { demoBlogs, t } from './data'

export type NexusRole = 'admin' | 'reader' | null

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
  settings: UISettings
  updateSettings: (patch: Partial<UISettings>) => void
  resetSettings: () => void
  statuses: Record<string, BlogStatus>
  decide: (id: string, status: BlogStatus) => void
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
}

export function NexusProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Lang>('en')
  const [dark, setDark] = useState(false)
  const [role, setRole] = useState<NexusRole>(null)
  const [settings, setSettings] = useState<UISettings>(defaultSettings)
  const [statuses, setStatuses] = useState<Record<string, BlogStatus>>(() =>
    Object.fromEntries(demoBlogs.map((b) => [b.id, b.status])),
  )
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
    const persisted: Persisted = { lang, dark, role, settings, statuses }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(persisted))
  }, [hydrated, lang, dark, role, settings, statuses])

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

  const updateSettings = useCallback(
    (patch: Partial<UISettings>) => setSettings((s) => ({ ...s, ...patch })),
    [],
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
      settings,
      updateSettings,
      resetSettings: () => setSettings(defaultSettings),
      statuses,
      decide: (id, status) => setStatuses((s) => ({ ...s, [id]: status })),
      tr: (key) => t[key]?.[lang] ?? key,
    }),
    [lang, dark, role, settings, statuses, updateSettings],
  )

  return <NexusContext.Provider value={value}>{children}</NexusContext.Provider>
}

export function useNexus() {
  const ctx = useContext(NexusContext)
  if (!ctx) throw new Error('useNexus must be used inside NexusProvider')
  return ctx
}
