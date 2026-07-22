'use client'

import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import React, { useEffect, useState } from 'react'

import { useCustomerAuth } from '@/providers/CustomerAuth'

export default function VerifyPageClient() {
  const { verifyEmail } = useCustomerAuth()
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
    <div className="container max-w-sm py-24">
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
