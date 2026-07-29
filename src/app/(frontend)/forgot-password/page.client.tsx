'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import React, { useState } from 'react'

import type { BrandLogo } from '@/utilities/getBrandData'

import { AuthLogo } from '@/components/AuthLogo'
import { useStaffAuth } from '@/providers/StaffAuth'

export default function ForgotPasswordPageClient({
  logo,
  siteName,
}: {
  logo: BrandLogo
  siteName: string
}) {
  const { forgotPassword } = useStaffAuth()

  const [email, setEmail] = useState('')
  const [error, setError] = useState<null | string>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    try {
      await forgotPassword(email)
      setSubmitted(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="container max-w-sm py-24">
        <AuthLogo logo={logo} siteName={siteName} />
        <h1 className="mb-4 text-3xl font-bold">Check your email</h1>
        <p className="text-muted-foreground">
          If an account exists for <span className="text-foreground">{email}</span>, we&apos;ve sent
          a link to reset your password.
        </p>
        <Link className="mt-6 inline-block underline" href="/login">
          Back to log in
        </Link>
      </div>
    )
  }

  return (
    <div className="container max-w-sm py-24">
      <AuthLogo logo={logo} siteName={siteName} />
      <h1 className="mb-4 text-3xl font-bold">Forgot password</h1>
      <p className="mb-8 text-muted-foreground">
        Enter your email and we&apos;ll send you a link to reset your password.
      </p>

      <form className="flex flex-col gap-4" onSubmit={onSubmit}>
        <div className="flex flex-col gap-1">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            onChange={(e) => setEmail(e.target.value)}
            required
            type="email"
            value={email}
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <Button disabled={submitting} type="submit">
          {submitting ? 'Sending...' : 'Send reset link'}
        </Button>
      </form>

      <p className="mt-6 text-sm text-muted-foreground">
        <Link className="underline" href="/login">
          Back to log in
        </Link>
      </p>
    </div>
  )
}
