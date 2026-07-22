import { getCachedGlobal } from '@/utilities/getGlobals'
import { getBrandData } from '@/utilities/getBrandData'
import { darkShade } from '@/utilities/colorShade'
import Link from 'next/link'
import React from 'react'

import { ThemeSelector } from '@/providers/Theme/ThemeSelector'
import { CMSLink } from '@/components/Link'
import { Logo } from '@/components/Logo/Logo'
import { navIconComponents } from '@/utilities/navIcons'
import { socialIconComponents, socialPlatformLabels } from '@/utilities/socialIcons'

export async function Footer() {
  const footerData = await getCachedGlobal('footer', 1)()
  const brand = await getBrandData()

  const navItems = footerData?.navItems || []

  const copyright = brand.copyrightText
    ?.replace('{year}', String(new Date().getFullYear()))
    .replace('{siteName}', brand.siteName)

  const footerBg = darkShade(brand.primaryColor)

  return (
    <footer className="mt-auto border-t border-border text-white" style={{ backgroundColor: footerBg }}>
      <div className="container py-8 gap-8 flex flex-col md:flex-row md:justify-between">
        <div className="flex flex-col gap-2 max-w-sm">
          <Link className="flex items-center" href="/">
            <Logo logo={brand.logo} siteName={brand.siteName} />
          </Link>
          {brand.footerTagline && <p className="text-sm text-white/70">{brand.footerTagline}</p>}
        </div>

        <div className="flex min-w-0 flex-col-reverse items-start gap-4 md:flex-row md:items-center">
          <ThemeSelector />
          <nav className="flex flex-wrap gap-x-4 gap-y-2 md:justify-end">
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

      {(brand.socialLinks.length > 0 || copyright) && (
        <div className="border-t border-white/10">
          <div className="container py-4 flex flex-col-reverse md:flex-row items-center justify-between gap-3">
            {copyright && <p className="text-sm text-white/60">{copyright}</p>}

            {brand.socialLinks.length > 0 && (
              <div className="flex items-center gap-3">
                {brand.socialLinks.map(({ platform, url }, i) => {
                  const Icon = socialIconComponents[platform] || socialIconComponents.other
                  const label = socialPlatformLabels[platform] || 'Link'

                  return (
                    <a
                      aria-label={label}
                      className="flex size-8 items-center justify-center rounded-full border border-white/20 text-white transition-colors hover:bg-white/10"
                      href={url}
                      key={i}
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      <Icon className="size-4" />
                    </a>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </footer>
  )
}
