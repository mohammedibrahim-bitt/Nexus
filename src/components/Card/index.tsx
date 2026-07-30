'use client'
import { cn } from '@/utilities/ui'
import useClickableCard from '@/utilities/useClickableCard'
import { NewspaperIcon } from 'lucide-react'
import Link from 'next/link'
import React, { Fragment } from 'react'

import type { Post } from '@/payload-types'

import { Media } from '@/components/Media'

export type CardPostData = Pick<Post, 'slug' | 'categories' | 'meta' | 'title' | 'heroImage'>

export const Card: React.FC<{
  alignItems?: 'center'
  className?: string
  doc?: CardPostData
  relationTo?: 'posts'
  showCategories?: boolean
  title?: string
}> = (props) => {
  const { card, link } = useClickableCard({})
  const { className, doc, relationTo, showCategories, title: titleFromProps } = props

  const { slug, categories, meta, title, heroImage } = doc || {}
  const { description, image: metaImage } = meta || {}
  const imageToUse = metaImage || heroImage

  const hasCategories = categories && Array.isArray(categories) && categories.length > 0
  const titleToUse = titleFromProps || title
  const sanitizedDescription = description?.replace(/\s/g, ' ') // replace non-breaking space with white space
  const href = `/${relationTo}/${slug}`

  return (
    <article
      className={cn(
        'group hover-lift flex flex-col overflow-hidden rounded-lg border border-border bg-card shadow-[var(--shadow-md)] hover:cursor-pointer hover:border-rule',
        className,
      )}
      ref={card.ref}
    >
      {/* Fixed ratio keeps the grid on a consistent baseline whether or not a
      post has artwork; the image scales inside its own clipped box so the
      hover never nudges neighbouring cards. */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-muted">
        {!imageToUse && (
          <div className="flex h-full w-full items-center justify-center">
            <NewspaperIcon aria-hidden className="size-8 text-muted-foreground/40" />
          </div>
        )}
        {imageToUse && typeof imageToUse !== 'string' && (
          <Media
            fill
            imgClassName="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
            resource={imageToUse}
            size="33vw"
          />
        )}
      </div>

      <div
        className="flex flex-1 flex-col gap-2"
        style={{ padding: 'calc(1.25rem * var(--space-scale, 1))' }}
      >
        {showCategories && hasCategories && (
          <div className="kicker">
            {categories?.map((category, index) => {
              if (typeof category === 'object') {
                const { title: titleFromCategory } = category

                const categoryTitle = titleFromCategory || 'Untitled category'

                const isLast = index === categories.length - 1

                return (
                  <Fragment key={index}>
                    {categoryTitle}
                    {!isLast && <Fragment> · </Fragment>}
                  </Fragment>
                )
              }

              return null
            })}
          </div>
        )}

        {titleToUse && (
          <h3 className="font-display text-xl leading-snug font-semibold text-balance transition-colors duration-200 group-hover:text-primary">
            <Link className="not-prose" href={href} ref={link.ref}>
              {titleToUse}
            </Link>
          </h3>
        )}

        {description && (
          <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">
            {sanitizedDescription}
          </p>
        )}
      </div>
    </article>
  )
}
