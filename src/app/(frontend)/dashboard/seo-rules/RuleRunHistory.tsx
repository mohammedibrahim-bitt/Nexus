'use client'

import { cn } from '@/utilities/ui'
import Link from 'next/link'
import React, { useEffect, useState } from 'react'

type Run = {
  createdAt: string
  error?: null | string
  generatedPost?: { id: string; title: string } | null | number
  id: string
  keyword: string
  status: string
}

const STATUS_STYLES: Record<string, string> = {
  completed: 'bg-emerald-500/10 text-emerald-600',
  failed: 'bg-red-500/10 text-red-600',
}

export const RuleRunHistory: React.FC<{ ruleId: string }> = ({ ruleId }) => {
  const [runs, setRuns] = useState<null | Run[]>(null)

  useEffect(() => {
    fetch(
      `/api/seo-research-runs?where[triggeredByRule][equals]=${ruleId}&limit=10&sort=-createdAt&depth=1`,
      { credentials: 'include' },
    )
      .then((res) => res.json())
      .then((data) => setRuns(data.docs))
  }, [ruleId])

  if (runs === null) return <p className="text-sm text-muted-foreground">Loading history...</p>
  if (runs.length === 0) {
    return <p className="text-sm text-muted-foreground">No runs yet for this rule.</p>
  }

  return (
    <div className="flex flex-col gap-2">
      {runs.map((run) => {
        const post = typeof run.generatedPost === 'object' ? run.generatedPost : null
        return (
          <div
            className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-card p-3"
            key={run.id}
          >
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  'rounded-full px-2 py-0.5 text-xs font-medium capitalize',
                  STATUS_STYLES[run.status] || 'bg-muted text-muted-foreground',
                )}
              >
                {run.status}
              </span>
              <span className="text-sm">{run.keyword}</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              {post && (
                <Link className="underline" href={`/dashboard/posts/${post.id}/edit`}>
                  View draft
                </Link>
              )}
              {run.error && <span className="text-red-600" title={run.error}>error</span>}
              <span>{new Date(run.createdAt).toLocaleString()}</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
