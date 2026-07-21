import { getCachedGlobal } from '@/utilities/getGlobals'
import Link from 'next/link'
import React from 'react'

import { ThemeSelector } from '@/providers/Theme/ThemeSelector'
import { CMSLink } from '@/components/Link'
import { Logo } from '@/components/Logo/Logo'
import { navIconComponents } from '@/utilities/navIcons'

export async function Footer() {
  const footerData = await getCachedGlobal('footer', 1)()
  const settingsData = await getCachedGlobal('settings', 1)()

  const navItems = footerData?.navItems || []

  return (
    <footer className="mt-auto border-t border-border bg-black dark:bg-card text-white">
      <div className="container py-8 gap-8 flex flex-col md:flex-row md:justify-between">
        <Link className="flex items-center" href="/">
          <Logo
            logo={typeof settingsData?.logo === 'object' ? settingsData?.logo : null}
            siteName={settingsData?.siteName}
          />
        </Link>

        <div className="flex flex-col-reverse items-start md:flex-row gap-4 md:items-center">
          <ThemeSelector />
          <nav className="flex flex-col md:flex-row gap-4">
            {navItems.map(({ icon, link }, i) => {
              const Icon = icon ? navIconComponents[icon] : undefined

              return (
                <span className="flex items-center gap-1.5" key={i}>
                  {Icon && <Icon className="size-4" />}
                  <CMSLink className="text-white" {...link} />
                </span>
              )
            })}
          </nav>
        </div>
      </div>
    </footer>
  )
}
