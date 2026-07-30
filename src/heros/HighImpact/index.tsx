'use client'
import { useHeaderTheme } from '@/providers/HeaderTheme'
import React, { useEffect } from 'react'

import type { Page } from '@/payload-types'

import { CMSLink } from '@/components/Link'
import { Media } from '@/components/Media'
import RichText from '@/components/RichText'

export const HighImpactHero: React.FC<Page['hero']> = ({
  links,
  media,
  overlayOpacity,
  richText,
}) => {
  const { setHeaderTheme } = useHeaderTheme()

  useEffect(() => {
    setHeaderTheme('dark')
  })

  return (
    <div
      className="relative -mt-[10.4rem] flex min-h-[80vh] items-center justify-center text-white"
      data-theme="dark"
    >
      <div className="container relative z-10 mb-8 flex items-center justify-center">
        <div className="max-w-[44rem] [text-shadow:0_1px_16px_rgb(0_0_0/0.45)] md:text-center">
          {richText && <RichText className="mb-8" data={richText} enableGutter={false} />}
          {Array.isArray(links) && links.length > 0 && (
            <ul className="flex flex-wrap gap-4 md:justify-center">
              {links.map(({ link }, i) => {
                return (
                  <li key={i}>
                    <CMSLink {...link} size="lg" />
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>
      {/* Full-bleed background — absolutely positioned so it sits behind the
      text without competing for width in the flex row above (it previously
      shared flex flow with the text container, which claims 100% width via
      `.container`, collapsing this box to 0 width). */}
      <div className="absolute inset-0 select-none">
        {media && typeof media === 'object' && (
          <Media fill imgClassName="-z-10 object-cover" priority resource={media} />
        )}
        {/* Gradient scrim: darkest where the copy sits, so headlines clear the
        4.5:1 contrast bar even over a bright photo — the flat overlay below
        stays under admin control on top of it. */}
        <div
          aria-hidden
          className="absolute inset-0 -z-[6] bg-gradient-to-t from-black/85 via-black/50 to-black/25"
        />
        {Boolean(overlayOpacity) && (
          <div
            className="absolute inset-0 -z-[5] bg-black"
            style={{ opacity: Math.min(90, Math.max(0, overlayOpacity || 0)) / 100 }}
          />
        )}
      </div>
    </div>
  )
}
