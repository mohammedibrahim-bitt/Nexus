'use client'

import type { User } from '@/payload-types'
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

import { authApi } from './api'
import type { Lang } from './data'
import { t } from './data'

export type NexusRole = 'admin' | 'author' | 'reviewer' | null

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

export type AuthResult = { ok: true; role: NexusRole } | { ok: false; error: string }

type NexusState = {
  lang: Lang
  setLang: (l: Lang) => void
  dark: boolean
  setDark: (d: boolean) => void
  currentUser: User | null
  role: NexusRole
  authLoading: boolean
  signIn: (email: string, password: string) => Promise<AuthResult>
  signUp: (name: string, email: string, password: string) => Promise<AuthResult>
  logout: () => Promise<void>
  settings: UISettings
  updateSettings: (patch: Partial<UISettings>) => void
  resetSettings: () => void
  tr: (key: string) => string
}

const NexusContext = createContext<NexusState | null>(null)

const SETTINGS_KEY = 'nexus-ui-settings-v1'

export function NexusProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Lang>('en')
  const [dark, setDark] = useState(false)
  const [settings, setSettings] = useState<UISettings>(defaultSettings)
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [hydrated, setHydrated] = useState(false)

  // UI-only preferences (theme, language, accent, etc.) stay client-side —
  // there's nothing for a backend to own here.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY)
      if (raw) {
        const p = JSON.parse(raw) as { lang?: Lang; dark?: boolean; settings?: UISettings }
        if (p.lang) setLang(p.lang)
        if (typeof p.dark === 'boolean') setDark(p.dark)
        if (p.settings) setSettings({ ...defaultSettings, ...p.settings })
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
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({ lang, dark, settings }))
  }, [hydrated, lang, dark, settings])

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

  // Real session — ask the backend who's logged in via the payload-token cookie.
  const refreshSession = useCallback(async () => {
    setAuthLoading(true)
    const res = await authApi.me()
    setCurrentUser(res.ok ? (res.data.user ?? null) : null)
    setAuthLoading(false)
  }, [])

  useEffect(() => {
    refreshSession()
  }, [refreshSession])

  const signIn = useCallback(
    async (email: string, password: string): Promise<AuthResult> => {
      const res = await authApi.login(email, password)
      if (!res.ok) return { ok: false, error: res.error }
      setCurrentUser(res.data.user)
      return { ok: true, role: (res.data.user.role as NexusRole) ?? null }
    },
    [],
  )

  const signUp = useCallback(
    async (name: string, email: string, password: string): Promise<AuthResult> => {
      const res = await authApi.signup(name, email, password)
      if (!res.ok) return { ok: false, error: res.error }
      // Payload doesn't log the new user in on creation — sign them in right away.
      return signIn(email, password)
    },
    [signIn],
  )

  const logout = useCallback(async () => {
    await authApi.logout()
    setCurrentUser(null)
  }, [])

  const updateSettings = useCallback(
    (patch: Partial<UISettings>) => setSettings((s) => ({ ...s, ...patch })),
    [],
  )

  const role: NexusRole = (currentUser?.role as NexusRole) ?? null

  const value = useMemo<NexusState>(
    () => ({
      lang,
      setLang,
      dark,
      setDark,
      currentUser,
      role,
      authLoading,
      signIn,
      signUp,
      logout,
      settings,
      updateSettings,
      resetSettings: () => setSettings(defaultSettings),
      tr: (key) => t[key]?.[lang] ?? key,
    }),
    [lang, dark, currentUser, role, authLoading, signIn, signUp, logout, settings, updateSettings],
  )

  return <NexusContext.Provider value={value}>{children}</NexusContext.Provider>
}

export function useNexus() {
  const ctx = useContext(NexusContext)
  if (!ctx) throw new Error('useNexus must be used inside NexusProvider')
  return ctx
}
