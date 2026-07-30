'use client'

import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import React, { useEffect, useState } from 'react'

import type { BrandLogo } from '@/utilities/getBrandData'

import { AuthLogo } from '@/components/AuthLogo'
import { useStaffAuth } from '@/providers/StaffAuth'

export default function VerifyPageClient({
  logo,
  siteName,
}: {
  logo: BrandLogo
  siteName: string
}) {
  const { verifyEmail } = useStaffAuth()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [status, setStatus] = useState<'error' | 'pending' | 'success'>('pending')
  const [error, setError] = useState<null | string>(null)

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setError('Missing verification token.')
      return
    }

    verifyEmail(token)
      .then(() => setStatus('success'))
      .catch((err) => {
        setStatus('error')
        setError(err instanceof Error ? err.message : 'Could not verify your account')
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  return (
    <div className="mx-auto my-20 w-[calc(100%-2rem)] max-w-md rounded-lg border border-border bg-card p-6 shadow-[var(--shadow-lg)] sm:p-8">
      <AuthLogo logo={logo} siteName={siteName} />
      {status === 'pending' && <p>Verifying your account...</p>}

      {status === 'success' && (
        <>
          <h1 className="mb-4 text-3xl font-bold">You&apos;re verified!</h1>
          <p className="mb-6 text-muted-foreground">Your account is now active.</p>
          <Button asChild>
            <Link href="/login">Log in</Link>
          </Button>
        </>
      )}

      {status === 'error' && (
        <>
          <h1 className="mb-4 text-3xl font-bold">Verification failed</h1>
          <p className="mb-6 text-muted-foreground">{error}</p>
          <Button asChild variant="outline">
            <Link href="/login">Back to log in</Link>
          </Button>
        </>
      )}
    </div>
  )
}
