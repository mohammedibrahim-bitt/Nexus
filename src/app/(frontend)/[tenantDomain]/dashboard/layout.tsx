'use client'

import { cn } from '@/utilities/ui'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import React, { useEffect, useState } from 'react'

import { useStaffAuth } from '@/providers/StaffAuth'

const navItems = [
  { href: '/dashboard', label: 'Overview', rolesOnly: null as null | string[] },
  { href: '/dashboard/posts', label: 'My Posts', rolesOnly: ['admin', 'author', 'reviewer'] },
  { href: '/dashboard/review', label: 'Review Queue', rolesOnly: ['admin', 'reviewer'] },
  { href: '/dashboard/seo-rules', label: 'SEO Automation', rolesOnly: ['admin'] },
  { href: '/dashboard/messages', label: 'Messages', rolesOnly: ['admin'] },
  { href: '/dashboard/profile', label: 'Profile', rolesOnly: null },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { loading, logout, staff } = useStaffAuth()
  const pathname = usePathname()
  const router = useRouter()
  const [pendingReviewCount, setPendingReviewCount] = useState(0)

  useEffect(() => {
    if (!loading && !staff) {
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`)
    }
  }, [loading, staff, pathname, router])

  useEffect(() => {
    if (!staff || (staff.role !== 'admin' && staff.role !== 'reviewer')) return

    fetch(
      '/api/posts?where[_status][equals]=draft&where[reviewedBy][exists]=false&limit=1&draft=true',
      { credentials: 'include' },
    )
      .then((res) => res.json())
      .then((data) => setPendingReviewCount(data.totalDocs ?? 0))
      .catch(() => setPendingReviewCount(0))
  }, [staff])

  if (loading || !staff) {
    return <div className="container py-24 text-muted-foreground">Loading...</div>
  }

  const visibleItems = navItems.filter(
    (item) => !item.rolesOnly || item.rolesOnly.includes(staff.role),
  )

  return (
    <div className="container py-12">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b-2 border-rule pb-6">
        <div>
          <p className="kicker mb-1.5">Staff</p>
          <h1 className="font-display text-3xl leading-tight font-semibold">Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Signed in as {staff.name} ({staff.role})
          </p>
        </div>

        <nav className="flex flex-wrap items-center gap-1">
          {visibleItems.map((item) => (
            <Link
              className={cn(
                'flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors duration-200 hover:bg-muted',
                pathname === item.href
                  ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                  : 'text-foreground/75 hover:text-foreground',
              )}
              href={item.href}
              key={item.href}
            >
              {item.label}
              {item.href === '/dashboard/review' && pendingReviewCount > 0 && (
                <span
                  className={cn(
                    'flex min-w-4.5 items-center justify-center rounded-full px-1 text-xs font-semibold',
                    pathname === item.href
                      ? 'bg-primary-foreground text-primary'
                      : 'bg-primary text-primary-foreground',
                  )}
                >
                  {pendingReviewCount}
                </span>
              )}
            </Link>
          ))}
          <button
            className="ml-1 cursor-pointer rounded-md border border-border px-3 py-2 text-sm font-medium text-muted-foreground transition-colors duration-200 hover:bg-muted hover:text-foreground"
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
