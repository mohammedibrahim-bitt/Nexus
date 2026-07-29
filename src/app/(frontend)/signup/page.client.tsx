'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import React, { useEffect, useState } from 'react'

import type { BrandLogo } from '@/utilities/getBrandData'

import { AuthLogo } from '@/components/AuthLogo'
import { useStaffAuth } from '@/providers/StaffAuth'

export default function SignupPageClient({
  logo,
  siteName,
}: {
  logo: BrandLogo
  siteName: string
}) {
  const { staff, loading, signup } = useStaffAuth()
  const router = useRouter()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<null | string>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    if (!loading && staff) router.replace('/account')
  }, [loading, staff, router])

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    try {
      await signup(name, email, password)
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
          We sent a verification link to <span className="text-foreground">{email}</span>. Click it
          to activate your account, then log in.
        </p>
        <Link className="mt-6 inline-block underline" href="/login">
          Go to log in
        </Link>
      </div>
    )
  }

  return (
    <div className="container max-w-sm py-24">
      <AuthLogo logo={logo} siteName={siteName} />
      <h1 className="mb-8 text-3xl font-bold">Sign up</h1>

      <form className="flex flex-col gap-4" onSubmit={onSubmit}>
        <div className="flex flex-col gap-1">
          <Label htmlFor="name">Name</Label>
          <Input id="name" onChange={(e) => setName(e.target.value)} required value={name} />
        </div>

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

        {error && <p className="text-sm text-red-600">{error}</p>}

        <Button disabled={submitting} type="submit">
          {submitting ? 'Creating account...' : 'Sign up'}
        </Button>
      </form>

      <p className="mt-6 text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link className="underline" href="/login">
          Log in
        </Link>
      </p>
    </div>
  )
}
