import { getCachedTenantDoc } from '@/utilities/getTenantDoc'
import { getRequestTenant } from '@/utilities/getTenant'
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
  const tenant = await getRequestTenant()
  const footerData = tenant ? await getCachedTenantDoc('footer', tenant.id, 1)() : null
  const brand = await getBrandData(tenant?.slug)

  const navItems = footerData?.navItems || []

  const copyright = brand.copyrightText
    ?.replace('{year}', String(new Date().getFullYear()))
    .replace('{siteName}', brand.siteName)

  const footerBg = darkShade(brand.primaryColor)

  return (
    <footer className="mt-auto text-white" style={{ backgroundColor: footerBg }}>
      {/* Mirrors the masthead band so the page is bracketed in brand color. */}
      <div aria-hidden className="h-[3px] w-full bg-primary" />

      <div className="container flex flex-col gap-10 py-12 md:flex-row md:justify-between">
        <div className="flex max-w-sm flex-col gap-3">
          <Link className="flex items-center transition-opacity hover:opacity-80" href="/">
            <Logo logo={brand.logo} siteName={brand.siteName} />
          </Link>
          {brand.footerTagline && (
            <p className="text-sm leading-relaxed text-white/70">{brand.footerTagline}</p>
          )}
        </div>

        <div className="flex min-w-0 flex-col-reverse items-start gap-6 md:items-end">
          <nav className="flex flex-wrap gap-x-6 gap-y-3 md:justify-end">
            {navItems.map(({ icon, link }, i) => {
              const Icon = icon ? navIconComponents[icon] : undefined

              return (
                <span
                  className="flex items-center gap-1.5 text-[0.8125rem] font-semibold tracking-wide text-white/75 uppercase transition-colors duration-200 hover:text-white"
                  key={i}
                >
                  {Icon && <Icon className="size-4" />}
                  <CMSLink className="!text-inherit !no-underline" {...link} appearance="link" />
                </span>
              )
            })}
          </nav>
          <ThemeSelector />
        </div>
      </div>

      {(brand.socialLinks.length > 0 || copyright) && (
        <div className="border-t border-white/10">
          <div className="container flex flex-col-reverse items-center justify-between gap-4 py-5 md:flex-row">
            {copyright && <p className="text-xs text-white/55">{copyright}</p>}

            {brand.socialLinks.length > 0 && (
              <div className="flex items-center gap-2">
                {brand.socialLinks.map(({ platform, url }, i) => {
                  const Icon = socialIconComponents[platform] || socialIconComponents.other
                  const label = socialPlatformLabels[platform] || 'Link'

                  return (
                    <a
                      aria-label={label}
                      className="flex size-9 items-center justify-center rounded-full border border-white/20 text-white/80 transition-colors duration-200 hover:border-white/40 hover:bg-white/10 hover:text-white"
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
