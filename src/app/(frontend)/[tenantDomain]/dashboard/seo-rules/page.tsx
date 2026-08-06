'use client'

import { Button } from '@/components/ui/button'
import { cn } from '@/utilities/ui'
import Link from 'next/link'
import React, { useCallback, useEffect, useState } from 'react'

import { useStaffAuth } from '@/providers/StaffAuth'

type Rule = {
  active: boolean
  id: string
  intervalDays: number
  keyword: string
  lastRunAt?: null | string
  lastRunStatus?: null | string
  runAsUser?: { email: string; id: string; name: string } | string
}

export default function SeoRulesPage() {
  const { staff } = useStaffAuth()
  const [rules, setRules] = useState<null | Rule[]>(null)
  const [checking, setChecking] = useState(false)
  const [checkResult, setCheckResult] = useState<null | string>(null)

  const load = useCallback(() => {
    fetch('/api/seo-research-rules?limit=100&sort=-createdAt', { credentials: 'include' })
      .then((res) => res.json())
      .then((data) => setRules(data.docs))
  }, [])

  useEffect(() => {
    if (staff?.role === 'super_admin' || staff?.role === 'admin') load()
  }, [staff, load])

  if (!staff || (staff.role !== 'super_admin' && staff.role !== 'admin')) return null

  const onDelete = async (id: string) => {
    if (!confirm('Delete this rule? This does not delete any drafts it already created.')) return
    await fetch(`/api/seo-research-rules/${id}`, { credentials: 'include', method: 'DELETE' })
    load()
  }

  const onCheckNow = async () => {
    setChecking(true)
    setCheckResult(null)
    try {
      const res = await fetch('/api/seo-research/run-due', { credentials: 'include', method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Check failed.')
      const parts = []
      if (data.ran?.length) parts.push(`ran: ${data.ran.join(', ')}`)
      if (data.errored?.length) parts.push(`errored: ${data.errored.join(', ')}`)
      if (data.skipped?.length) parts.push(`skipped: ${data.skipped.join(', ')}`)
      setCheckResult(parts.length ? parts.join(' — ') : 'Nothing was due.')
      load()
    } catch (err) {
      setCheckResult(err instanceof Error ? err.message : 'Check failed.')
    } finally {
      setChecking(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">SEO Automation</h2>
          <p className="text-sm text-muted-foreground">
            Keywords the SEO Research Agent researches and drafts on its own, on a schedule. This
            already runs automatically in the background (checked hourly) — the button below just
            lets you force a check right now instead of waiting.
          </p>
        </div>
        <div className="flex gap-2">
          <Button disabled={checking} onClick={onCheckNow} variant="outline">
            {checking ? 'Checking...' : 'Check for due rules now'}
          </Button>
          <Link
            className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
            href="/dashboard/seo-rules/new"
          >
            New rule
          </Link>
        </div>
      </div>

      {checkResult && <p className="text-sm text-muted-foreground">{checkResult}</p>}

      {rules === null && <p className="text-muted-foreground">Loading...</p>}
      {rules?.length === 0 && (
        <p className="text-muted-foreground">No rules yet — add one to get started.</p>
      )}

      <div className="flex flex-col gap-3">
        {rules?.map((rule) => {
          const runner = typeof rule.runAsUser === 'object' ? rule.runAsUser?.name : null
          return (
            <div
              className="flex flex-col gap-2 rounded-xl border border-border bg-card p-4 shadow-[var(--shadow-card)]"
              key={rule.id}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{rule.keyword}</span>
                  <span
                    className={cn(
                      'rounded-full px-2.5 py-0.5 text-xs font-medium',
                      rule.active
                        ? 'bg-emerald-500/10 text-emerald-600'
                        : 'bg-muted text-muted-foreground',
                    )}
                  >
                    {rule.active ? 'Active' : 'Paused'}
                  </span>
                </div>
                <div className="flex gap-2">
                  <Link
                    className="rounded-full border border-border px-3 py-1.5 text-sm font-medium hover:bg-muted"
                    href={`/dashboard/seo-rules/${rule.id}/edit`}
                  >
                    Edit
                  </Link>
                  <button
                    className="rounded-full border border-border px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-500/10"
                    onClick={() => onDelete(rule.id)}
                    type="button"
                  >
                    Delete
                  </button>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Runs as {runner || 'unknown'} · every {rule.intervalDays} day
                {rule.intervalDays === 1 ? '' : 's'}
              </p>
              {rule.lastRunStatus && (
                <p className="text-sm text-muted-foreground">
                  Last run {rule.lastRunAt ? new Date(rule.lastRunAt).toLocaleString() : ''}:{' '}
                  {rule.lastRunStatus}
                </p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
