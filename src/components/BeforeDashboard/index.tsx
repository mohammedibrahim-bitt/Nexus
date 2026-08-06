'use client'

import React, { useEffect, useState } from 'react'

import './index.scss'

/* ── Lucide-like inline SVGs (no extra bundle cost) ── */
const Icon = {
  Newspaper: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"/>
      <path d="M18 14h-8"/><path d="M15 18h-5"/><path d="M10 6h8v4h-8V6Z"/>
    </svg>
  ),
  FileEdit: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
  ),
  Clock: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
    </svg>
  ),
  Users: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  UserCheck: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
      <polyline points="16 11 18 13 22 9"/>
    </svg>
  ),
  Activity: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
    </svg>
  ),
  Search: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  ),
  LayoutDashboard: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
      <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
    </svg>
  ),
  Shield: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  ),
  MessageSquare: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
  ),
  Settings: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  ),
  ArrowRight: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
    </svg>
  ),
  TrendingUp: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>
    </svg>
  ),
}

/* ── Stat card data ── */
type StatItem = {
  label: string
  value: null | number
  icon: React.FC
  color: string   // CSS color for the icon bg / accent
  href: string
}

const STAT_CONFIG: Omit<StatItem, 'value'>[] = [
  { label: 'Published posts',     icon: Icon.Newspaper,    color: '#6366f1', href: '/admin/collections/posts?where[or][0][and][0][_status][operator]=equals&where[or][0][and][0][_status][value]=published' },
  { label: 'Drafts',              icon: Icon.FileEdit,     color: '#f59e0b', href: '/admin/collections/posts?where[or][0][and][0][_status][operator]=equals&where[or][0][and][0][_status][value]=draft' },
  { label: 'Pending review',      icon: Icon.Clock,        color: '#ef4444', href: '/admin/collections/posts?where[or][0][and][0][_status][operator]=equals&where[or][0][and][0][_status][value]=draft&where[or][0][and][1][reviewedBy][operator]=exists&where[or][0][and][1][reviewedBy][value]=false' },
  { label: 'Staff accounts',      icon: Icon.Shield,       color: '#10b981', href: '/admin/collections/users?where[or][0][and][0][role][operator]=not_equals&where[or][0][and][0][role][value]=reader' },
  { label: 'Registered readers',  icon: Icon.Users,        color: '#3b82f6', href: '/admin/collections/users?where[or][0][and][0][role][operator]=equals&where[or][0][and][0][role][value]=reader' },
  { label: 'Active users (30d)',  icon: Icon.Activity,     color: '#8b5cf6', href: '/admin/collections/users' },
  { label: 'SEO research runs',   icon: Icon.Search,       color: '#06b6d4', href: '/admin/collections/seo-research-runs' },
]

/* ── Quick-action links ── */
const QUICK_ACTIONS = [
  { icon: Icon.LayoutDashboard, label: 'Staff dashboard',    desc: 'Where authors & reviewers manage posts and their profile.', href: '/dashboard',                         color: '#6366f1' },
  { icon: Icon.Shield,          label: 'Manage roles',       desc: 'Grant the admin, author, or reviewer role to accounts.',    href: '/admin/collections/users',           color: '#10b981' },
  { icon: Icon.MessageSquare,   label: 'Moderate reviews',   desc: 'Approve or reject reader comments before they go live.',    href: '/admin/collections/reviews',         color: '#f59e0b' },
  { icon: Icon.Settings,        label: 'Site settings',      desc: 'Brand colours, logos, fonts, and global site preferences.', href: '/admin/globals/settings',            color: '#8b5cf6' },
]

/* ═══════════════════════════════════════════════════════════════════════════
 *  STAT CARD
 * ═══════════════════════════════════════════════════════════════════════════ */
const StatCard: React.FC<StatItem> = ({ label, value, icon: StatIcon, color, href }) => (
  <a className="nx-stat-card" href={href} style={{ '--stat-color': color } as React.CSSProperties}>
    <div className="nx-stat-card__icon">
      <StatIcon />
    </div>
    <div className="nx-stat-card__body">
      <span className="nx-stat-card__value">
        {value === null ? <span className="nx-stat-card__skeleton" /> : value}
      </span>
      <span className="nx-stat-card__label">{label}</span>
    </div>
    <div className="nx-stat-card__arrow"><Icon.ArrowRight /></div>
  </a>
)

/* ═══════════════════════════════════════════════════════════════════════════
 *  QUICK ACTION CARD
 * ═══════════════════════════════════════════════════════════════════════════ */
const ActionCard: React.FC<typeof QUICK_ACTIONS[number]> = ({ icon: ActionIcon, label, desc, href, color }) => (
  <a className="nx-action-card" href={href} style={{ '--action-color': color } as React.CSSProperties}>
    <div className="nx-action-card__icon">
      <ActionIcon />
    </div>
    <div className="nx-action-card__body">
      <strong className="nx-action-card__title">{label}</strong>
      <p className="nx-action-card__desc">{desc}</p>
    </div>
    <div className="nx-action-card__arrow"><Icon.ArrowRight /></div>
  </a>
)

/* ═══════════════════════════════════════════════════════════════════════════
 *  MAIN COMPONENT
 * ═══════════════════════════════════════════════════════════════════════════ */
const countFrom = (results: PromiseSettledResult<Response>[], i: number): Promise<number> => {
  const r = results[i]
  if (r.status !== 'fulfilled' || !r.value.ok) return Promise.resolve(0)
  return r.value.json().then((d: { totalDocs?: number }) => d.totalDocs ?? 0).catch(() => 0)
}

const BeforeDashboard: React.FC = () => {
  const [stats, setStats] = useState<(number | null)[]>(STAT_CONFIG.map(() => null))
  const [greeting, setGreeting] = useState('Good morning')

  /* Greeting based on local time */
  useEffect(() => {
    const h = new Date().getHours()
    if (h >= 5 && h < 12) setGreeting('Good morning')
    else if (h >= 12 && h < 17) setGreeting('Good afternoon')
    else setGreeting('Good evening')
  }, [])

  /* Fetch all counts in parallel */
  useEffect(() => {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const queries = [
      '/api/posts?where[_status][equals]=published&limit=1',
      '/api/posts?where[_status][equals]=draft&draft=true&limit=1',
      '/api/posts?where[_status][equals]=draft&where[reviewedBy][exists]=false&draft=true&limit=1',
      '/api/users?where[role][not_equals]=reader&limit=1',
      '/api/users?where[role][equals]=reader&limit=1',
      `/api/users?where[lastLoginAt][greater_than]=${encodeURIComponent(thirtyDaysAgo)}&limit=1`,
      '/api/seo-research-runs?limit=1',
    ]

    Promise.allSettled(queries.map((u) => fetch(u, { credentials: 'include', cache: 'no-store' }))).then(
      async (results) => {
        const values = await Promise.all(queries.map((_, i) => countFrom(results, i)))
        setStats(values)
      },
    )
  }, [])

  return (
    <div className="nx-dashboard">

      {/* ── Header ── */}
      <div className="nx-dashboard__header">
        <div className="nx-dashboard__header-text">
          <p className="nx-dashboard__greeting">{greeting}, Admin 👋</p>
          <h1 className="nx-dashboard__title">Editorial Dashboard</h1>
          <p className="nx-dashboard__subtitle">
            Monitor your platform, manage content, and keep your team aligned — all in one place.
          </p>
        </div>
        <div className="nx-dashboard__header-actions">
          <a className="nx-btn nx-btn--primary" href="/admin/collections/posts/create">
            + New post
          </a>
          <a className="nx-btn nx-btn--ghost" href="/" target="_blank" rel="noopener noreferrer">
            View site ↗
          </a>
        </div>
      </div>

      {/* ── Stats grid ── */}
      <section className="nx-section">
        <h2 className="nx-section__title">
          <Icon.TrendingUp /> Platform overview
        </h2>
        <div className="nx-stats-grid">
          {STAT_CONFIG.map((cfg, i) => (
            <StatCard key={cfg.label} {...cfg} value={stats[i] ?? null} />
          ))}
        </div>
      </section>

      {/* ── Quick actions ── */}
      <section className="nx-section">
        <h2 className="nx-section__title">Quick actions</h2>
        <div className="nx-actions-grid">
          {QUICK_ACTIONS.map((a) => (
            <ActionCard key={a.label} {...a} />
          ))}
        </div>
      </section>

      {/* ── Seed utility (collapsible, for dev/setup) ── */}
      <details className="nx-seed-details">
        <summary className="nx-seed-details__summary">⚙ Developer utilities</summary>
        <div className="nx-seed-details__body">
          <p>
            Seed the database with placeholder pages, posts, and users, then{' '}
            <a href="/" target="_blank">visit your website</a> to see the result.
          </p>
          <SeedButtonInline />
        </div>
      </details>

    </div>
  )
}

/* Inline seed button — avoids importing the scss-importing SeedButton */
const SeedButtonInline: React.FC = () => {
  const [state, setState] = React.useState<'idle' | 'loading' | 'done' | 'error'>('idle')

  const handleClick = async () => {
    if (state !== 'idle') return
    setState('loading')
    try {
      const res = await fetch('/next/seed', { method: 'POST', credentials: 'include' })
      setState(res.ok ? 'done' : 'error')
    } catch {
      setState('error')
    }
  }

  const labels = { idle: 'Seed database', loading: 'Seeding…', done: 'Done ✓', error: 'Error — try again' }

  return (
    <button className={`nx-btn nx-btn--outline nx-seed-btn nx-seed-btn--${state}`} onClick={handleClick} disabled={state === 'loading' || state === 'done'}>
      {labels[state]}
    </button>
  )
}

export default BeforeDashboard
