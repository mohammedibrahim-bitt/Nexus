'use client'

import { cn } from '@/utilities/ui'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import React, { useEffect } from 'react'

import { useStaffAuth } from '@/providers/StaffAuth'

const navItems = [
  { href: '/dashboard', label: 'Overview', rolesOnly: null as null | string[] },
  { href: '/dashboard/posts', label: 'My Posts', rolesOnly: null },
  { href: '/dashboard/review', label: 'Review Queue', rolesOnly: ['admin', 'reviewer'] },
  { href: '/dashboard/profile', label: 'Profile', rolesOnly: null },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { loading, logout, staff } = useStaffAuth()
  const pathname = usePathname()
  const router = useRouter()
  const isLoginPage = pathname === '/dashboard/login'

  useEffect(() => {
    if (!loading && !staff && !isLoginPage) {
      router.replace(`/dashboard/login?redirect=${encodeURIComponent(pathname)}`)
    }
  }, [loading, staff, isLoginPage, pathname, router])

  if (isLoginPage) return <>{children}</>

  if (loading || !staff) {
    return <div className="container py-24 text-muted-foreground">Loading...</div>
  }

  const visibleItems = navItems.filter(
    (item) => !item.rolesOnly || item.rolesOnly.includes(staff.role),
  )

  return (
    <div className="container py-12">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <h1 className="text-2xl font-bold">Staff Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Signed in as {staff.name} ({staff.role})
          </p>
        </div>

        <nav className="flex flex-wrap items-center gap-2">
          {visibleItems.map((item) => (
            <Link
              className={cn(
                'rounded-full px-3 py-1.5 text-sm font-medium transition-colors hover:bg-muted',
                pathname === item.href && 'bg-muted',
              )}
              href={item.href}
              key={item.href}
            >
              {item.label}
            </Link>
          ))}
          <button
            className="rounded-full px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted"
            onClick={async () => {
              await logout()
              router.push('/')
            }}
            type="button"
          >
            Log out
          </button>
        </nav>
      </div>

      {children}
    </div>
  )
}
