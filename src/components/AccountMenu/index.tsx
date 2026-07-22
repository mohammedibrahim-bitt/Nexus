'use client'

import { LogOut, User } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import React, { useEffect, useRef, useState } from 'react'

import { useCustomerAuth } from '@/providers/CustomerAuth'

export const AccountMenu: React.FC = () => {
  const { customer, loading, logout } = useCustomerAuth()
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  if (loading) return null

  if (!customer) {
    return (
      <Link
        className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm text-foreground/80 transition-colors hover:bg-muted hover:text-foreground"
        href="/login"
      >
        <User className="size-4" />
        Sign in
      </Link>
    )
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        aria-label="Account menu"
        className="flex size-9 items-center justify-center rounded-full bg-muted text-sm font-medium text-foreground"
        onClick={() => setOpen((v) => !v)}
        type="button"
      >
        {customer.name.trim()[0]?.toUpperCase() || '?'}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-3 w-48 rounded-lg border border-border bg-background text-foreground shadow-lg">
          <div className="border-b border-border px-4 py-3">
            <p className="truncate text-sm font-medium">{customer.name}</p>
            <p className="truncate text-xs text-muted-foreground">{customer.email}</p>
          </div>
          <Link
            className="block px-4 py-2 text-sm hover:bg-muted"
            href="/account"
            onClick={() => setOpen(false)}
          >
            Your account
          </Link>
          <button
            className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm hover:bg-muted"
            onClick={async () => {
              setOpen(false)
              await logout()
              router.push('/')
            }}
            type="button"
          >
            <LogOut className="size-4" />
            Log out
          </button>
        </div>
      )}
    </div>
  )
}
