'use client'

import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import React, { useEffect, useState } from 'react'

import { useStaffAuth } from '@/providers/StaffAuth'

type ReviewPost = { id: string; title: string }

export default function ReviewQueuePage() {
  const { staff } = useStaffAuth()
  const router = useRouter()

  const [posts, setPosts] = useState<null | ReviewPost[]>(null)
  const [busyId, setBusyId] = useState<null | string>(null)
  const [error, setError] = useState<null | string>(null)

  useEffect(() => {
    if (staff && staff.role === 'author') {
      router.replace('/dashboard')
    }
  }, [staff, router])

  const load = () => {
    fetch(
      '/api/posts?where[_status][equals]=draft&where[reviewedBy][exists]=false&limit=100&draft=true&sort=-updatedAt&depth=0',
      { credentials: 'include' },
    )
      .then((res) => res.json())
      .then((data) => setPosts(data.docs))
  }

  useEffect(() => {
    if (staff && staff.role !== 'author') load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [staff])

  if (!staff || staff.role === 'author') return null

  const approveAndPublish = async (postId: string) => {
    setBusyId(postId)
    setError(null)

    try {
      const res = await fetch(`/api/posts/${postId}`, {
        body: JSON.stringify({ _status: 'published', reviewedBy: staff.id }),
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        method: 'PATCH',
      })

      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.errors?.[0]?.message || 'Could not publish this post.')
      }

      setPosts((prev) => prev?.filter((p) => p.id !== postId) ?? null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not publish this post.')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-xl font-semibold">Review queue</h2>
      <p className="text-sm text-muted-foreground">
        Drafts waiting on a reviewer. Approving publishes the post immediately.
      </p>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {posts === null && <p className="text-muted-foreground">Loading...</p>}
      {posts?.length === 0 && <p className="text-muted-foreground">Nothing waiting for review.</p>}

      <div className="flex flex-col gap-3">
        {posts?.map((post) => (
          <div
            className="flex items-center justify-between rounded-xl border border-border bg-card p-4 shadow-[var(--shadow-card)]"
            key={post.id}
          >
            <Link className="font-medium hover:underline" href={`/dashboard/posts/${post.id}/edit`}>
              {post.title}
            </Link>
            <Button disabled={busyId === post.id} onClick={() => approveAndPublish(post.id)} size="sm">
              {busyId === post.id ? 'Publishing...' : 'Approve & publish'}
            </Button>
          </div>
        ))}
      </div>
    </div>
  )
}
