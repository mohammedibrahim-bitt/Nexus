'use client'

import Link from 'next/link'
import React, { useEffect, useState } from 'react'

/**
 * Payload's default relationship list-cell only fetches a related doc's
 * title once an IntersectionObserver reports the row as visible — for a
 * single-row (or otherwise trivially-visible) list this can render as a
 * "no value" fallback before that observer ever fires. This cell fetches
 * the form's title directly on mount instead, no visibility gating.
 */
export const FormSubmissionFormCell: React.FC<{ cellData?: number | string }> = ({ cellData }) => {
  const [title, setTitle] = useState<null | string>(null)

  useEffect(() => {
    if (!cellData) return

    let cancelled = false

    fetch(`/api/forms/${cellData}?depth=0`, { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : null))
      .then((doc) => {
        if (!cancelled) setTitle(doc?.title || null)
      })
      .catch(() => undefined)

    return () => {
      cancelled = true
    }
  }, [cellData])

  if (!cellData) return null

  return (
    <Link href={`/admin/collections/forms/${cellData}`}>{title || `Form #${cellData}`}</Link>
  )
}
