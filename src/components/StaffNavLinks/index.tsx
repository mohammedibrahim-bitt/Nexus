'use client'

import { FilePlus2, LayoutDashboard } from 'lucide-react'
import Link from 'next/link'
import React from 'react'

import { useStaffAuth } from '@/providers/StaffAuth'

// The only staff-facing entry points shown anywhere on the public site —
// everything else (including /admin itself) is reachable only by typing
// the URL directly, never via a link or button.
export const StaffNavLinks: React.FC = () => {
  const { staff } = useStaffAuth()

  if (!staff) return null

  return (
    <>
      <Link
        className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm text-foreground/80 transition-colors hover:bg-muted hover:text-foreground"
        href="/dashboard"
      >
        <LayoutDashboard className="size-4" />
        Dashboard
      </Link>
      <Link
        className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm text-foreground/80 transition-colors hover:bg-muted hover:text-foreground"
        href="/dashboard/posts/new"
      >
        <FilePlus2 className="size-4" />
        New Post
      </Link>
    </>
  )
}
