'use client'
import { useHeaderTheme } from '@/providers/HeaderTheme'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React, { useEffect, useState } from 'react'

import { useTheme } from '@/providers/Theme'

import type { Header } from '@/payload-types'
import type { BrandData } from '@/utilities/getBrandData'

import { Logo } from '@/components/Logo/Logo'
import { HeaderNav } from './Nav'

interface HeaderClientProps {
  // Null when this tenant has no header row yet (e.g. a tenant created before
  // its per-tenant nav was configured) — the nav simply renders empty.
  data: Header | null
  brand?: BrandData
  initialStaffRole: null | string
}

export const HeaderClient: React.FC<HeaderClientProps> = ({ data, brand, initialStaffRole }) => {
  const { headerTheme, setHeaderTheme } = useHeaderTheme()
  const { theme } = useTheme()
  const pathname = usePathname()

  useEffect(() => {
    setHeaderTheme(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  // Strictly follow the global theme so the header always matches the toggle.
  const activeTheme = theme

  return (
    <header
      className="sticky top-0 z-20 border-b border-border bg-background/85 shadow-[var(--shadow-sm)] backdrop-blur-md"
      {...(activeTheme ? { 'data-theme': activeTheme } : {})}
    >
      {/* Masthead band — the newspaper cue that anchors the brand color. */}
      <div aria-hidden className="h-[3px] w-full bg-primary" />

      <div className="container">
        {brand?.headerLayout === 'centered' ? (
          <div className="flex flex-col items-center gap-3 py-5">
            <Link className="shrink-0 transition-opacity hover:opacity-80" href="/">
              <Logo className="text-foreground" logo={brand?.logo} siteName={brand?.siteName} />
            </Link>
            <HeaderNav data={data} initialStaffRole={initialStaffRole} />
          </div>
        ) : (
          <div className="flex items-center justify-between gap-4 py-4">
            <Link className="shrink-0 transition-opacity hover:opacity-80" href="/">
              <Logo className="text-foreground" logo={brand?.logo} siteName={brand?.siteName} />
            </Link>
            <HeaderNav data={data} initialStaffRole={initialStaffRole} />
          </div>
        )}
      </div>
    </header>
  )
}
