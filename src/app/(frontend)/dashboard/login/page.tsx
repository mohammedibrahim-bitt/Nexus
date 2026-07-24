'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useRouter, useSearchParams } from 'next/navigation'
import React, { useEffect, useState } from 'react'

import { useStaffAuth } from '@/providers/StaffAuth'

export default function DashboardLoginPage() {
  const { staff, loading, login } = useStaffAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirect') || '/dashboard'

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
    <div className="container max-w-sm py-24">
      <h1 className="mb-8 text-3xl font-bold">Staff login</h1>

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

        {error && <p className="text-sm text-red-600">{error}</p>}

        <Button disabled={submitting} type="submit">
          {submitting ? 'Logging in...' : 'Log in'}
        </Button>
      </form>
    </div>
  )
}
