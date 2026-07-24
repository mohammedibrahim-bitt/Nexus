'use client'

import { toast, useDocumentInfo, useFormFields } from '@payloadcms/ui'
import { useRouter } from 'next/navigation'
import React, { useCallback, useEffect, useRef, useState } from 'react'

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
  generatedPost?: number | string | { id: number | string }
  status?: string
}

export const RunTrigger: React.FC = () => {
  const router = useRouter()
  const { id } = useDocumentInfo()
  const keywordField = useFormFields(([fields]) => fields?.keyword)
  const keyword = (keywordField?.value as string) || ''

  const [submitting, setSubmitting] = useState(false)
  const [polled, setPolled] = useState<null | RunDoc>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current)
      pollRef.current = null
    }
  }, [])

  const pollOnce = useCallback(async (runId: number | string) => {
    try {
      const res = await fetch(`/api/seo-research-runs/${runId}`, { credentials: 'include' })
      if (!res.ok) return
      const doc = (await res.json()) as RunDoc
      setPolled(doc)
      if (!IN_PROGRESS.has(doc.status || '')) stopPolling()
    } catch {
      // transient — next interval tick will retry
    }
  }, [stopPolling])

  useEffect(() => {
    if (!id) return
    pollOnce(id)
    pollRef.current = setInterval(() => pollOnce(id), 3000)
    return stopPolling
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const handleRun = useCallback(async () => {
    if (!keyword.trim()) {
      toast.error('Enter a keyword first.')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/seo-research/trigger', {
        body: JSON.stringify({ keyword }),
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      })
      const data = await res.json()

      if (!res.ok) {
        toast.error(data?.error || 'Failed to start research.')
        return
      }

      toast.success('Research started — this can take a few minutes.')
      router.push(`/admin/collections/seo-research-runs/${data.runId}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to start research.')
    } finally {
      setSubmitting(false)
    }
  }, [keyword, router])

  const status = polled?.status
  const generatedPostId =
    polled?.generatedPost && typeof polled.generatedPost === 'object'
      ? polled.generatedPost.id
      : polled?.generatedPost

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      {!id && (
        <button
          className="btn btn--style-primary"
          disabled={submitting}
          onClick={handleRun}
          type="button"
        >
          {submitting ? 'Starting…' : 'Run Research'}
        </button>
      )}

      {id && status && (
        <div>
          <strong>{STATUS_LABELS[status] || status}</strong>
          {status === 'failed' && polled?.error && (
            <p style={{ color: 'var(--theme-error-500)', marginTop: '0.25rem' }}>{polled.error}</p>
          )}
          {status === 'completed' && generatedPostId && (
            <p style={{ marginTop: '0.25rem' }}>
              <a href={`/admin/collections/posts/${generatedPostId}`}>View draft post →</a>
            </p>
          )}
        </div>
      )}
    </div>
  )
}

export default RunTrigger
