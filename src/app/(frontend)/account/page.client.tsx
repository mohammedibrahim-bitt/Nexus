'use client'

import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import React, { useEffect } from 'react'

import { useStaffAuth } from '@/providers/StaffAuth'

export default function AccountPageClient() {
  const { staff, loading, logout } = useStaffAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !staff) router.replace('/login?redirect=/account')
  }, [loading, staff, router])

  if (loading || !staff) {
    return <div className="container py-24">Loading...</div>
  }

  return (
    <div className="container max-w-sm py-24">
      <h1 className="mb-8 text-3xl font-bold">Your account</h1>

      <div className="flex flex-col gap-1 mb-8">
        <p className="text-sm text-muted-foreground">Name</p>
        <p className="font-medium">{staff.name}</p>
      </div>

      <div className="flex flex-col gap-1 mb-8">
        <p className="text-sm text-muted-foreground">Email</p>
        <p className="font-medium">{staff.email}</p>
      </div>

      <Button
        onClick={async () => {
          await logout()
          router.push('/')
        }}
        variant="outline"
      >
        Log out
      </Button>
    </div>
  )
}
