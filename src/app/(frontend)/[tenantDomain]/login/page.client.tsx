'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import React, { useEffect, useState } from 'react'

import type { BrandLogo } from '@/utilities/getBrandData'

import { AuthLogo } from '@/components/AuthLogo'
import { useStaffAuth } from '@/providers/StaffAuth'

export default function LoginPageClient({ logo, siteName }: { logo: BrandLogo; siteName: string }) {
  const { staff, loading, login } = useStaffAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirect') || '/'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<null | string>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!loading && staff) router.replace(redirectTo)
  }, [loading, staff, redirectTo, router])

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    try {
      await login(email, password)
      router.push(redirectTo)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto my-20 w-[calc(100%-2rem)] max-w-md rounded-lg border border-border bg-card p-6 shadow-[var(--shadow-lg)] sm:p-8">
      <AuthLogo logo={logo} siteName={siteName} />
      <h1 className="mb-8 font-display text-3xl leading-tight font-semibold">Log in</h1>

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

        <div className="flex flex-col gap-1">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            onChange={(e) => setPassword(e.target.value)}
            required
            type="password"
            value={password}
          />
        </div>

        {error && (
          <p
            className="rounded-md border border-destructive/40 bg-error/40 px-3 py-2 text-sm text-foreground"
            role="alert"
          >
            {error}
          </p>
        )}

        <Button disabled={submitting} type="submit">
          {submitting ? 'Logging in...' : 'Log in'}
        </Button>
      </form>

      <p className="mt-6 text-sm text-muted-foreground">
        Don&apos;t have an account?{' '}
        <Link className="link-editorial" href="/signup">
          Sign up
        </Link>
      </p>
      <p className="mt-2 text-sm text-muted-foreground">
        <Link className="link-editorial" href="/forgot-password">
          Forgot your password?
        </Link>
      </p>
    </div>
  )
}
