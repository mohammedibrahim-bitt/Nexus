'use client'
import { useHeaderTheme } from '@/providers/HeaderTheme'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React, { useEffect, useState } from 'react'

import type { Header, Setting } from '@/payload-types'

import { Logo } from '@/components/Logo/Logo'
import { HeaderNav } from './Nav'

interface HeaderClientProps {
  data: Header
  settings?: Setting | null
}

export const HeaderClient: React.FC<HeaderClientProps> = ({ data, settings }) => {
  /* Storing the value in a useState to avoid hydration errors */
  const [theme, setTheme] = useState<string | null>(null)
  const { headerTheme, setHeaderTheme } = useHeaderTheme()
  const pathname = usePathname()

  useEffect(() => {
    setHeaderTheme(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  useEffect(() => {
    if (headerTheme && headerTheme !== theme) setTheme(headerTheme)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [headerTheme])

  return (
    <header
      className="relative z-20 bg-background border-b border-border shadow-sm"
      {...(theme ? { 'data-theme': theme } : {})}
    >
      <div className="container">
        <div className="py-8 flex justify-between">
          <Link href="/">
            <Logo
              className="text-foreground"
              logo={typeof settings?.logo === 'object' ? settings?.logo : null}
              siteName={settings?.siteName}
            />
          </Link>
          <HeaderNav data={data} />
        </div>
      </div>
    </header>
  )
}
