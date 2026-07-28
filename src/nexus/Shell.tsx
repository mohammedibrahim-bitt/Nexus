'use client'

import { AnimatePresence, motion } from 'framer-motion'
import {
  Bot,
  ChevronsUpDown,
  Globe,
  Home,
  LogIn,
  LogOut,
  Moon,
  PanelLeft,
  PenLine,
  Search,
  ShieldCheck,
  Sun,
  X,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import React, { useEffect, useMemo, useRef, useState } from 'react'

import { isNexusWriterRole } from '@/access/isNexusWriter'
import { postsApi, toNexusBlog, type NexusBlog } from './api'
import type { NexusRole } from './NexusProvider'
import { useNexus } from './NexusProvider'

const iconBtn =
  'flex h-10 w-10 items-center justify-center rounded-full text-nx-muted transition-colors hover:bg-nx-surface-2 hover:text-nx-text focus-visible:outline-2 focus-visible:outline-nx-accent'

export function NexusShell({ children }: { children: React.ReactNode }) {
  const { tr, lang, setLang, dark, setDark, role, settings } = useNexus()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [searchOpen, setSearchOpen] = useState(false)
  const pathname = usePathname()
  const rtl = lang === 'ar'

  // Close the search overlay on navigation and on Escape.
  useEffect(() => setSearchOpen(false), [pathname])
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSearchOpen(false)
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        setSearchOpen(true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const nav = [
    { href: '/', label: tr('main'), icon: Home },
    ...(role === 'admin'
      ? [{ href: '/nexus/admin', label: tr('adminPanel'), icon: ShieldCheck }]
      : []),
    ...(role === 'reviewer' ? [{ href: '/nexus/review', label: 'Review', icon: ShieldCheck }] : []),
    { href: '/nexus/ai', label: tr('aiChat'), icon: Bot },
    ...(isNexusWriterRole(role)
      ? [{ href: '/nexus/write', label: tr('writeNav'), icon: PenLine }]
      : []),
  ]

  return (
    <div className="min-h-screen">
      {/* Fixed top bar — the Nexus wordmark sits at the very top corner, nothing above it. */}
      <header className="fixed inset-x-0 top-0 z-40 flex h-16 items-center justify-between border-b border-nx-border bg-nx-bg/80 px-4 backdrop-blur-md">
        <Link
          href="/"
          className="font-proxemic text-2xl font-bold tracking-[0.18em] text-nx-text uppercase"
        >
          {settings.logoText || 'Nexus'}
        </Link>

        <div className="flex items-center gap-1">
          <button aria-label={tr('search')} className={iconBtn} onClick={() => setSearchOpen(true)}>
            <Search size={19} />
          </button>
          <button aria-label="Toggle color mode" className={iconBtn} onClick={() => setDark(!dark)}>
            <motion.span
              key={dark ? 'moon' : 'sun'}
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              transition={{ duration: 0.2 }}
            >
              {dark ? <Moon size={19} /> : <Sun size={19} />}
            </motion.span>
          </button>
          <button
            aria-label="Switch language"
            className="flex h-10 items-center gap-1.5 rounded-full px-3 text-sm font-semibold text-nx-muted transition-colors hover:bg-nx-surface-2 hover:text-nx-text"
            onClick={() => setLang(lang === 'en' ? 'ar' : 'en')}
          >
            <Globe size={17} />
            {lang === 'en' ? 'العربية' : 'EN'}
          </button>
        </div>
      </header>

      {/* Sidebar toggle — sits just under the Nexus wordmark, outside the header */}
      <div className="fixed top-16 z-30 flex h-12 items-center ltr:left-4 rtl:right-4">
        <button
          aria-label="Toggle sidebar"
          className={iconBtn}
          onClick={() => setSidebarOpen((v) => !v)}
        >
          <PanelLeft size={19} />
        </button>
      </div>

      {/* Hidable sidebar — stays mounted, slides off-screen when hidden. Styled after the ChatGPT sidebar: a flat, slightly-tinted panel with plain hover/active fills (no borders), and a bottom account row that opens a small menu above it. */}
      <motion.aside
        animate={{ x: sidebarOpen ? 0 : rtl ? 264 : -264, opacity: sidebarOpen ? 1 : 0 }}
        initial={false}
        transition={{ type: 'spring', stiffness: 380, damping: 34 }}
        className="fixed top-28 bottom-0 z-30 flex w-60 flex-col bg-nx-surface-2 p-2 ltr:left-0 rtl:right-0"
        style={{ pointerEvents: sidebarOpen ? 'auto' : 'none' }}
        aria-hidden={!sidebarOpen}
      >
        <nav className="flex flex-col gap-0.5">
          {nav.map(({ href, label, icon: Icon }) => {
            const active = pathname === href
            return (
              <Link
                key={href}
                href={href}
                className={`relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                  active
                    ? 'font-medium text-nx-text'
                    : 'text-nx-muted hover:bg-nx-surface hover:text-nx-text'
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="nx-nav-active"
                    className="absolute inset-0 rounded-lg bg-nx-surface"
                    transition={{ type: 'spring', stiffness: 420, damping: 36 }}
                  />
                )}
                <Icon size={18} className="relative z-10" />
                <span className="relative z-10">{label}</span>
              </Link>
            )
          })}
        </nav>

        <div className="mt-auto">
          <SidebarUserMenu />
        </div>
      </motion.aside>

      {/* Page content shifts with the sidebar */}
      <motion.main
        animate={
          rtl ? { paddingRight: sidebarOpen ? 240 : 0 } : { paddingLeft: sidebarOpen ? 240 : 0 }
        }
        transition={{ type: 'spring', stiffness: 380, damping: 34 }}
        className="pt-28"
      >
        <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-8">{children}</div>
      </motion.main>

      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  )
}

const roleInitials: Record<Exclude<NexusRole, null>, string> = {
  admin: 'AD',
  author: 'AU',
  reviewer: 'RV',
  user: 'US',
}

/** Bottom-of-sidebar account row, styled after ChatGPT's: avatar + name, opens a small menu above it. */
function SidebarUserMenu() {
  const { role, currentUser, logout, tr } = useNexus()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onPointerDown = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  if (!role) {
    return (
      <Link
        href="/nexus/login"
        className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-nx-muted transition-colors hover:bg-nx-surface hover:text-nx-text"
      >
        <LogIn size={18} />
        {tr('login')}
      </Link>
    )
  }

  return (
    <div ref={ref} className="relative">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 450, damping: 32 }}
            className="nx-card absolute bottom-[calc(100%+6px)] start-0 z-20 w-full overflow-hidden p-1"
          >
            <button
              onClick={() => {
                setOpen(false)
                logout()
              }}
              className="flex w-full items-center gap-3 rounded-[calc(var(--nx-radius)*0.4)] px-3 py-2.5 text-sm text-nx-text transition-colors hover:bg-nx-surface-2"
            >
              <LogOut size={16} className="text-nx-muted" />
              {tr('logout')}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-start transition-colors hover:bg-nx-surface"
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-(--nx-accent) text-xs font-semibold text-white">
          {roleInitials[role]}
        </span>
        <span className="min-w-0 flex-1 truncate text-sm font-medium text-nx-text">
          {currentUser?.name || currentUser?.email}
        </span>
        <ChevronsUpDown size={15} className="shrink-0 text-nx-muted" />
      </button>
    </div>
  )
}

function SearchOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { tr, lang } = useNexus()
  const [query, setQuery] = useState('')
  const [published, setPublished] = useState<NexusBlog[]>([])
  const router = useRouter()
  const inputRef = React.useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setQuery('')
      inputRef.current?.focus()
      postsApi.list({ 'where[status][equals]': 'approved', sort: '-createdAt' }).then((res) => {
        if (res.ok) setPublished(res.data.docs.map(toNexusBlog))
      })
    }
  }, [open])

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return published
    return published.filter(
      (b) =>
        b.title[lang].toLowerCase().includes(q) || b.description[lang].toLowerCase().includes(q),
    )
  }, [query, lang, published])

  // Kept mounted; visibility is animated so a stuck exit can never block the page.
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-4 pt-24 backdrop-blur-sm"
      initial={false}
      animate={{ opacity: open ? 1 : 0 }}
      transition={{ duration: 0.18 }}
      style={{ pointerEvents: open ? 'auto' : 'none', visibility: open ? 'visible' : 'hidden' }}
      aria-hidden={!open}
      onClick={onClose}
    >
      <motion.div
        className="nx-card w-full max-w-xl overflow-hidden"
        initial={false}
        animate={open ? { y: 0, scale: 1, opacity: 1 } : { y: -16, scale: 0.98, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 400, damping: 32 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-nx-border px-4">
          <Search size={18} className="shrink-0 text-nx-muted" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={tr('searchPlaceholder')}
            className="h-14 w-full bg-transparent text-nx-text outline-none placeholder:text-nx-muted"
          />
          <button
            aria-label="Close search"
            onClick={onClose}
            className="text-nx-muted hover:text-nx-text"
          >
            <X size={18} />
          </button>
        </div>
        <ul className="max-h-80 overflow-y-auto p-2">
          {results.length === 0 && (
            <li className="px-3 py-6 text-center text-sm text-nx-muted">{tr('noResults')}</li>
          )}
          {results.map((b) => (
            <li key={b.id}>
              <button
                className="w-full rounded-[calc(var(--nx-radius)*0.6)] px-3 py-3 text-start transition-colors hover:bg-nx-surface-2"
                onClick={() => {
                  onClose()
                  router.push(`/nexus/article/${b.slug || b.id}`)
                }}
              >
                <p className="font-medium text-nx-text">{b.title[lang]}</p>
                <p className="line-clamp-1 text-sm text-nx-muted">{b.description[lang]}</p>
              </button>
            </li>
          ))}
        </ul>
      </motion.div>
    </motion.div>
  )
}
