'use client'

import React from 'react'

import type { Header as HeaderType } from '@/payload-types'

import { AccountMenu } from '@/components/AccountMenu'
import { CMSLink } from '@/components/Link'
import { QuickSearch } from '@/components/QuickSearch'
import { ThemeToggle } from '@/providers/Theme/ThemeToggle'
import { navIconComponents } from '@/utilities/navIcons'
import { useStaffAuth } from '@/providers/StaffAuth'

export const HeaderNav: React.FC<{ data: HeaderType | null; initialStaffRole: null | string }> = ({
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
    <nav className="flex items-center gap-0.5">
      {navItems.map(({ icon, link }, i) => {
        const Icon = icon ? navIconComponents[icon] : undefined

        return (
          <span
            className="relative flex items-center gap-1.5 px-2.5 py-2 text-[0.8125rem] font-semibold tracking-wide text-foreground/75 uppercase transition-colors duration-200 after:absolute after:inset-x-2.5 after:-bottom-0.5 after:h-[2px] after:origin-left after:scale-x-0 after:bg-primary after:transition-transform after:duration-200 hover:text-foreground hover:after:scale-x-100"
            key={i}
          >
            {Icon && <Icon className="size-4" />}
            <CMSLink {...link} appearance="link" className="!text-inherit !no-underline" />
          </span>
        )
      })}
      <div className="ml-2 flex items-center gap-1 border-l border-border pl-2">
        <QuickSearch />
        <ThemeToggle />
        <AccountMenu />
      </div>
    </nav>
  )
}
