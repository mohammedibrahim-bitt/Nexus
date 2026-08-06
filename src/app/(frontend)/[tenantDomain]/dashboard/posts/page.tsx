'use client'

import { cn } from '@/utilities/ui'
import Link from 'next/link'
import React, { useEffect, useState } from 'react'

import { useStaffAuth } from '@/providers/StaffAuth'

import { useTenantId } from '@/utilities/useTenantId'

type PostSummary = {
  _status: 'draft' | 'published'
  id: string
  reviewedBy?: unknown
  title: string
}

export default function MyPostsPage() {
  const { staff } = useStaffAuth()
  const tenantId = useTenantId()
  const [posts, setPosts] = useState<null | PostSummary[]>(null)

  useEffect(() => {
    if (!staff || !tenantId) return
    fetch(
      `/api/posts?where[authors][contains]=${staff.id}&where[tenant][equals]=${tenantId}&limit=100&draft=true&sort=-updatedAt&depth=0`,
      { credentials: 'include' },
    )
      .then((res) => res.json())
      .then((data) => setPosts(data.docs))
  }, [staff, tenantId])

  if (!staff) return null

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold">My posts</h2>
        <div className="flex gap-2">
          <Link
            className="rounded-full border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
            href="/dashboard/posts/research"
          >
            Research with AI
          </Link>
          <Link
            className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
            href="/dashboard/posts/new"
          >
            New post
          </Link>
        </div>
      </div>

      {posts === null && <p className="text-muted-foreground">Loading...</p>}
      {posts?.length === 0 && <p className="text-muted-foreground">You haven&apos;t written anything yet.</p>}

      <div className="flex flex-col gap-3">
        {posts?.map((post) => (
          <Link
            className="flex items-center justify-between rounded-xl border border-border bg-card p-4 shadow-[var(--shadow-card)] transition-shadow hover:shadow-lg"
            href={`/dashboard/posts/${post.id}/edit`}
            key={post.id}
          >
            <span className="font-medium">{post.title}</span>
            <span
              className={cn(
                'rounded-full px-3 py-1 text-xs font-medium',
                post._status === 'published'
                  ? 'bg-emerald-500/10 text-emerald-600'
                  : 'bg-muted text-muted-foreground',
              )}
            >
              {post._status === 'published' ? 'Published' : post.reviewedBy ? 'In review' : 'Draft'}
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}
