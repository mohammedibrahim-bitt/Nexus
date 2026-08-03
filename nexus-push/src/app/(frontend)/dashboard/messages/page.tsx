'use client'

import React, { useEffect, useState } from 'react'

import { useStaffAuth } from '@/providers/StaffAuth'

type Submission = {
  createdAt: string
  form?: { title?: string } | number | string
  id: string
  submissionData?: { field: string; value: string }[]
}

const fieldLabel: Record<string, string> = {
  'full-name': 'Name',
  email: 'Email',
  message: 'Message',
  phone: 'Phone',
}

const formatFieldLabel = (field: string) =>
  fieldLabel[field] ||
  field
    .split(/[-_]/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')

export default function MessagesPage() {
  const { staff } = useStaffAuth()
  const [submissions, setSubmissions] = useState<null | Submission[]>(null)

  useEffect(() => {
    if (staff?.role !== 'admin') return
    fetch('/api/form-submissions?limit=100&sort=-createdAt&depth=1', { credentials: 'include' })
      .then((res) => res.json())
      .then((data) => setSubmissions(data.docs))
  }, [staff])

  if (!staff || staff.role !== 'admin') return null

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-xl font-semibold">Messages</h2>
        <p className="text-sm text-muted-foreground">
          Everything submitted through the site's forms (contact, newsletter, etc.) — visible only
          to admins here and in the admin panel's Form Submissions.
        </p>
      </div>

      {submissions === null && <p className="text-muted-foreground">Loading...</p>}
      {submissions?.length === 0 && (
        <p className="text-muted-foreground">No submissions yet.</p>
      )}

      <div className="flex flex-col gap-3">
        {submissions?.map((submission) => {
          const formTitle =
            typeof submission.form === 'object' ? submission.form?.title : 'Form submission'
          const fields = (submission.submissionData || []).filter((f) => f.value?.trim())

          return (
            <div
              className="flex flex-col gap-2 rounded-xl border border-border bg-card p-4 shadow-[var(--shadow-card)]"
              key={submission.id}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                  {formTitle || 'Form submission'}
                </span>
                <span className="text-xs text-muted-foreground">
                  {new Date(submission.createdAt).toLocaleString()}
                </span>
              </div>

              <dl className="flex flex-col gap-1">
                {fields.map((field, i) => (
                  <div className="flex flex-col sm:flex-row sm:gap-2" key={i}>
                    <dt className="shrink-0 text-sm font-medium text-muted-foreground">
                      {formatFieldLabel(field.field)}:
                    </dt>
                    <dd className="text-sm whitespace-pre-wrap">{field.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )
        })}
      </div>
    </div>
  )
}
