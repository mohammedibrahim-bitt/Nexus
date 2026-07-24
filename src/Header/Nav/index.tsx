'use client'

import React from 'react'

import type { Header as HeaderType } from '@/payload-types'

import { AccountMenu } from '@/components/AccountMenu'
import { CMSLink } from '@/components/Link'
import { QuickSearch } from '@/components/QuickSearch'
import { StaffNavLinks } from '@/components/StaffNavLinks'
import { ThemeToggle } from '@/providers/Theme/ThemeToggle'
import { navIconComponents } from '@/utilities/navIcons'

export const HeaderNav: React.FC<{ data: HeaderType }> = ({ data }) => {
  const navItems = data?.navItems || []

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
        <StaffNavLinks />
        <QuickSearch />
        <ThemeToggle />
        <AccountMenu />
      </div>
    </nav>
  )
}
