'use client'

import Link from 'next/link'
import React, { useEffect, useState } from 'react'

import { useStaffAuth } from '@/providers/StaffAuth'

type Counts = { drafts: number; pendingReview: number; published: number }

export default function DashboardOverviewPage() {
  const { staff } = useStaffAuth()
  const [counts, setCounts] = useState<Counts | null>(null)
  const canReview = staff?.role === 'admin' || staff?.role === 'reviewer'

  useEffect(() => {
    if (!staff || staff.role === 'reader') return

    const load = async () => {
      const [draftsRes, publishedRes, reviewRes] = await Promise.all([
        fetch(
          `/api/posts?where[authors][contains]=${staff.id}&where[_status][equals]=draft&limit=1&draft=true`,
          { credentials: 'include' },
        ),
        fetch(
          `/api/posts?where[authors][contains]=${staff.id}&where[_status][equals]=published&limit=1`,
          { credentials: 'include' },
        ),
        canReview
          ? fetch(
              `/api/posts?where[_status][equals]=draft&where[reviewedBy][exists]=false&limit=1&draft=true`,
              { credentials: 'include' },
            )
          : Promise.resolve(null),
      ])

      const drafts = (await draftsRes.json()).totalDocs
      const published = (await publishedRes.json()).totalDocs
      const pendingReview = reviewRes ? (await reviewRes.json()).totalDocs : 0

      setCounts({ drafts, pendingReview, published })
    }

    void load()
  }, [staff, canReview])

  if (!staff) return null

  if (staff.role === 'reader') {
    return (
      <div className="flex flex-col gap-6">
        <p className="text-muted-foreground">
          Welcome, {staff.name}. You&apos;re signed in as a reader — manage your account or leave
          reviews on posts you&apos;ve read.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
            href="/dashboard/profile"
          >
            Your profile
          </Link>
          <Link
            className="rounded-full border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
            href="/posts"
          >
            Browse posts
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
          <p className="text-sm text-muted-foreground">Your drafts</p>
          <p className="text-3xl font-bold">{counts?.drafts ?? '—'}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
          <p className="text-sm text-muted-foreground">Your published posts</p>
          <p className="text-3xl font-bold">{counts?.published ?? '—'}</p>
        </div>
        {canReview && (
          <div className="rounded-xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
            <p className="text-sm text-muted-foreground">Pending review (all authors)</p>
            <p className="text-3xl font-bold">{counts?.pendingReview ?? '—'}</p>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        <Link
          className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
          href="/dashboard/posts/new"
        >
          Write a new post
        </Link>
        <Link
          className="rounded-full border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
          href="/dashboard/posts/research"
        >
          Research with AI
        </Link>
        <Link
          className="rounded-full border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
          href="/dashboard/posts"
        >
          View my posts
        </Link>
        {canReview && (
          <Link
            className="rounded-full border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
            href="/dashboard/review"
          >
            Go to review queue
          </Link>
        )}
      </div>
    </div>
  )
}
