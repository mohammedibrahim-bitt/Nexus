'use client'

import React from 'react'

import type { Header as HeaderType } from '@/payload-types'

import { CMSLink } from '@/components/Link'
import Link from 'next/link'
import { SearchIcon } from 'lucide-react'
import { ThemeToggle } from '@/providers/Theme/ThemeToggle'
import { navIconComponents } from '@/utilities/navIcons'

export const HeaderNav: React.FC<{ data: HeaderType }> = ({ data }) => {
  const navItems = data?.navItems || []

  return (
    <nav className="flex gap-3 items-center">
      {navItems.map(({ icon, link }, i) => {
        const Icon = icon ? navIconComponents[icon] : undefined

        return (
          <span className="flex items-center gap-1.5" key={i}>
            {Icon && <Icon className="size-4" />}
            <CMSLink {...link} appearance="link" />
          </span>
        )
      })}
      <Link href="/search">
        <span className="sr-only">Search</span>
        <SearchIcon className="w-5 text-primary" />
      </Link>
      <ThemeToggle />
    </nav>
  )
}
