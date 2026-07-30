'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import React, { useState } from 'react'

import type { BrandLogo } from '@/utilities/getBrandData'

import { AuthLogo } from '@/components/AuthLogo'
import { useStaffAuth } from '@/providers/StaffAuth'

export default function ResetPasswordPageClient({
  logo,
  siteName,
}: {
  logo: BrandLogo
  siteName: string
}) {
  const { resetPassword } = useStaffAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [password, setPassword] = useState('')
  const [error, setError] = useState<null | string>(null)
  const [submitting, setSubmitting] = useState(false)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!token) {
      setError('Missing reset token. Use the link from your email.')
      return
    }

    setSubmitting(true)

    try {
      await resetPassword(token, password)
      router.push('/account')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not reset your password')
    } finally {
      setSubmitting(false)
    }
  }

  if (!token) {
    return (
      <div className="mx-auto my-20 w-[calc(100%-2rem)] max-w-md rounded-lg border border-border bg-card p-6 shadow-[var(--shadow-lg)] sm:p-8">
        <AuthLogo logo={logo} siteName={siteName} />
        <h1 className="mb-4 text-3xl font-bold">Invalid link</h1>
        <p className="mb-6 text-muted-foreground">
          This password reset link is missing or invalid. Request a new one.
        </p>
        <Link className="link-editorial" href="/forgot-password">
          Request a new link
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto my-20 w-[calc(100%-2rem)] max-w-md rounded-lg border border-border bg-card p-6 shadow-[var(--shadow-lg)] sm:p-8">
      <AuthLogo logo={logo} siteName={siteName} />
      <h1 className="mb-8 text-3xl font-bold">Set a new password</h1>

      <form className="flex flex-col gap-4" onSubmit={onSubmit}>
        <div className="flex flex-col gap-1">
          <Label htmlFor="password">New password</Label>
          <Input
            id="password"
            onChange={(e) => setPassword(e.target.value)}
            required
            type="password"
            value={password}
          />
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button disabled={submitting} type="submit">
          {submitting ? 'Saving...' : 'Reset password'}
        </Button>
      </form>
    </div>
  )
}
