'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import React, { useEffect, useRef, useState } from 'react'

import { useStaffAuth } from '@/providers/StaffAuth'

const STATUS_LABELS: Record<string, string> = {
  analyzing: 'Analyzing competitors…',
  completed: 'Completed',
  failed: 'Failed',
  queued: 'Queued…',
  researching: 'Finding top-ranking pages…',
  strategizing: 'Building content strategy…',
  writing: 'Writing draft article…',
}

const IN_PROGRESS = new Set(['queued', 'researching', 'analyzing', 'strategizing', 'writing'])

type RunDoc = {
  error?: string
  generatedPost?: { id: string } | string
  status: string
}

export default function ResearchPage() {
  const { staff } = useStaffAuth()

  const [keyword, setKeyword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<null | string>(null)
  const [run, setRun] = useState<null | RunDoc>(null)
  const pollRef = useRef<null | ReturnType<typeof setInterval>>(null)

  const stopPolling = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current)
      pollRef.current = null
    }
  }

  useEffect(() => stopPolling, [])

  const pollOnce = async (runId: string) => {
    try {
      const res = await fetch(`/api/seo-research-runs/${runId}`, { credentials: 'include' })
      if (!res.ok) return
      const doc = (await res.json()) as RunDoc
      setRun(doc)
      if (!IN_PROGRESS.has(doc.status)) stopPolling()
    } catch {
      // transient — next interval tick retries
    }
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!keyword.trim()) return

    setSubmitting(true)
    setError(null)
    setRun(null)
    stopPolling()

    try {
      const res = await fetch('/api/seo-research/trigger', {
        body: JSON.stringify({ keyword }),
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data?.error || 'Failed to start research.')
        return
      }

      void pollOnce(data.runId)
      pollRef.current = setInterval(() => void pollOnce(data.runId), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start research.')
    } finally {
      setSubmitting(false)
    }
  }

  if (!staff) return null

  const generatedPostId =
    run?.generatedPost && typeof run.generatedPost === 'object' ? run.generatedPost.id : run?.generatedPost

  return (
    <div className="flex max-w-lg flex-col gap-6">
      <div>
        <h2 className="text-xl font-semibold">Research with AI</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Enter a keyword and this finds top-ranking competitor pages, scores them, and drafts an
          original post designed to outperform them. Uses your own SerpApi key and your choice of
          AI provider — set them on your{' '}
          <Link className="underline" href="/dashboard/profile">
            profile
          </Link>{' '}
          first.
        </p>
      </div>

      <form className="flex flex-col gap-3" onSubmit={onSubmit}>
        <div className="flex flex-col gap-1">
          <Label htmlFor="keyword">Target keyword</Label>
          <Input
            id="keyword"
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="e.g. best hiking boots"
            value={keyword}
          />
        </div>
        <Button
          className="self-start"
          disabled={submitting || (run !== null && IN_PROGRESS.has(run.status))}
          type="submit"
        >
          {submitting ? 'Starting...' : 'Run research'}
        </Button>
      </form>

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-600">
          {error}
        </div>
      )}

      {run && (
        <div className="rounded-xl border border-border bg-card p-4 shadow-[var(--shadow-card)]">
          <p className="font-medium">{STATUS_LABELS[run.status] || run.status}</p>
          {run.status === 'failed' && run.error && (
            <p className="mt-1 text-sm text-red-600">{run.error}</p>
          )}
          {run.status === 'completed' && generatedPostId && (
            <p className="mt-2">
              <Link className="underline" href={`/dashboard/posts/${generatedPostId}/edit`}>
                Open the draft →
              </Link>
            </p>
          )}
        </div>
      )}
    </div>
  )
}
