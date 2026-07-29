'use client'

import React from 'react'

import type { Header as HeaderType } from '@/payload-types'

import { AccountMenu } from '@/components/AccountMenu'
import { CMSLink } from '@/components/Link'
import { QuickSearch } from '@/components/QuickSearch'
import { ThemeToggle } from '@/providers/Theme/ThemeToggle'
import { navIconComponents } from '@/utilities/navIcons'
import { useStaffAuth } from '@/providers/StaffAuth'

export const HeaderNav: React.FC<{ data: HeaderType; initialStaffRole: null | string }> = ({
  data,
  initialStaffRole,
}) => {
  const { loading, staff } = useStaffAuth()
  // Matches the server's render until the client-side auth check resolves,
  // so staff-only links can't cause a hydration mismatch or a pop-in flash.
  const role = loading ? initialStaffRole : staff?.role
  const isStaff = Boolean(role && role !== 'reader')

  const navItems = (data?.navItems || []).filter((item) => !item.staffOnly || isStaff)

  return (
    <nav className="flex items-center gap-1">
      {navItems.map(({ icon, link }, i) => {
        const Icon = icon ? navIconComponents[icon] : undefined

        return (
          <span
            className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-foreground/80 transition-colors hover:bg-muted hover:text-foreground"
            key={i}
          >
            {Icon && <Icon className="size-4" />}
            <CMSLink {...link} appearance="link" className="!text-inherit !no-underline" />
          </span>
        )
      })}
      <div className="ml-1 flex items-center gap-1">
        <QuickSearch />
        <ThemeToggle />
        <AccountMenu />
      </div>
    </nav>
  )
}
