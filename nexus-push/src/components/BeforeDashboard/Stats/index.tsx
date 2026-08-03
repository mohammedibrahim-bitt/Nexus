'use client'

import React, { useEffect, useState } from 'react'

const baseClass = 'before-dashboard'

type Stat = { label: string; value: null | number }

const countFrom = (res: PromiseSettledResult<Response>[], index: number): Promise<number> => {
  const settled = res[index]
  if (settled.status !== 'fulfilled' || !settled.value.ok) return Promise.resolve(0)
  return settled.value
    .json()
    .then((data) => data.totalDocs ?? 0)
    .catch(() => 0)
}

export const DashboardStats: React.FC = () => {
  const [stats, setStats] = useState<null | Stat[]>(null)

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

    Promise.allSettled(queries.map((url) => fetch(url, { credentials: 'include' }))).then(
      async (results) => {
        const [published, drafts, pendingReview, staffAccounts, readers, activeUsers, seoRuns] =
          await Promise.all(queries.map((_, i) => countFrom(results, i)))

        setStats([
          { label: 'Published posts', value: published },
          { label: 'Drafts', value: drafts },
          { label: 'Pending review', value: pendingReview },
          { label: 'Staff accounts', value: staffAccounts },
          { label: 'Registered readers', value: readers },
          { label: 'Active users (30d)', value: activeUsers },
          { label: 'SEO research runs', value: seoRuns },
        ])
      },
    )
  }, [])

  return (
    <div className={`${baseClass}__stats-grid`}>
      {(stats ?? Array.from({ length: 7 }, () => null)).map((stat, i) => (
        <div className={`${baseClass}__stat-card`} key={stat?.label ?? i}>
          <span className={`${baseClass}__stat-value`}>{stat ? (stat.value ?? '—') : '…'}</span>
          <span className={`${baseClass}__stat-label`}>{stat?.label ?? ''}</span>
        </div>
      ))}
    </div>
  )
}
