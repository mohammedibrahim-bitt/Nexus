import React from 'react'

import type { Page } from '@/payload-types'

import { CMSLink } from '@/components/Link'
import { Media } from '@/components/Media'
import RichText from '@/components/RichText'

export const MediumImpactHero: React.FC<Page['hero']> = ({ links, media, richText }) => {
  return (
    <div className="mt-12">
      <div className="container mb-8 max-w-[52rem]">
        {richText && <RichText className="mb-6" data={richText} enableGutter={false} />}

        {Array.isArray(links) && links.length > 0 && (
          <ul className="flex flex-wrap gap-4">
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
      <div className="container">
        {media && typeof media === 'object' && (
          <figure>
            <Media
              className="overflow-hidden rounded-lg shadow-[var(--shadow-lg)]"
              imgClassName="w-full object-cover"
              priority
              resource={media}
            />
            {media?.caption && (
              <figcaption className="mt-3 border-l-2 border-rule pl-3 text-sm text-muted-foreground">
                <RichText data={media.caption} enableGutter={false} enableProse={false} />
              </figcaption>
            )}
          </figure>
        )}
      </div>
    </div>
  )
}
