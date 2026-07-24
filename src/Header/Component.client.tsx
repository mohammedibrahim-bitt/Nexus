'use client'
import { useHeaderTheme } from '@/providers/HeaderTheme'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React, { useEffect, useState } from 'react'

import type { Header } from '@/payload-types'
import type { BrandData } from '@/utilities/getBrandData'

import { Logo } from '@/components/Logo/Logo'
import { HeaderNav } from './Nav'

interface HeaderClientProps {
  data: Header
  brand?: BrandData
}

export const HeaderClient: React.FC<HeaderClientProps> = ({ data, brand }) => {
  /* Storing the value in a useState to avoid hydration errors */
  const [theme, setTheme] = useState<string | null>(null)
  const { headerTheme, setHeaderTheme } = useHeaderTheme()
  const pathname = usePathname()

  useEffect(() => {
    setHeaderTheme(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  useEffect(() => {
    if (headerTheme !== theme) setTheme(headerTheme)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [headerTheme])

  return (
    <header
      className="sticky top-0 z-20 bg-background/80 backdrop-blur border-b border-border"
      {...(theme ? { 'data-theme': theme } : {})}
    >
      <div className="container">
        {brand?.headerLayout === 'centered' ? (
          <div className="flex flex-col items-center gap-3 py-5">
            <Link className="shrink-0 transition-opacity hover:opacity-80" href="/">
              <Logo className="text-foreground" logo={brand?.logo} siteName={brand?.siteName} />
            </Link>
            <HeaderNav data={data} />
          </div>
        ) : (
          <div className="flex items-center justify-between py-5">
            <Link className="shrink-0 transition-opacity hover:opacity-80" href="/">
              <Logo className="text-foreground" logo={brand?.logo} siteName={brand?.siteName} />
            </Link>
            <HeaderNav data={data} />
          </div>
        )}
      </div>
    </header>
  )
}
