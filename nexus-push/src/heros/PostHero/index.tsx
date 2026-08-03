import { formatDateTime } from 'src/utilities/formatDateTime'
import React from 'react'

import type { Post } from '@/payload-types'

import { Media } from '@/components/Media'
import { Reveal } from '@/components/Reveal'
import { SocialShare } from '@/components/SocialShare'
import { formatAuthors } from '@/utilities/formatAuthors'

export const PostHero: React.FC<{
  post: Post
}> = ({ post }) => {
  const { categories, heroImage, populatedAuthors, publishedAt, title } = post

  const hasAuthors =
    populatedAuthors && populatedAuthors.length > 0 && formatAuthors(populatedAuthors) !== ''

  return (
    <div className="relative -mt-[10.4rem] flex items-end">
      <div className="container z-10 relative lg:grid lg:grid-cols-[1fr_48rem_1fr] text-white pb-8">
        <Reveal className="col-start-1 col-span-1 md:col-start-2 md:col-span-2">
          {/* Always sits on the dark scrim, so the kicker uses the light red
          rather than the theme-dependent --kicker token. */}
          <div className="mb-5 text-[0.6875rem] font-bold tracking-[0.1em] text-red-300 uppercase">
            {categories?.map((category, index) => {
              if (typeof category === 'object' && category !== null) {
                const { title: categoryTitle } = category

                const titleToUse = categoryTitle || 'Untitled category'

                const isLast = index === categories.length - 1

                return (
                  <React.Fragment key={index}>
                    {titleToUse}
                    {!isLast && <React.Fragment> · </React.Fragment>}
                  </React.Fragment>
                )
              }
              return null
            })}
          </div>

          <h1 className="mb-6 max-w-[40ch] text-3xl leading-[1.1] font-semibold text-balance [text-shadow:0_1px_16px_rgb(0_0_0/0.45)] md:text-5xl lg:text-6xl">
            {title}
          </h1>

          <div className="flex flex-col gap-2 border-t border-white/20 pt-5 text-sm md:flex-row md:items-center md:gap-3">
            {hasAuthors && (
              <p className="font-medium text-white">
                <span className="text-white/60">By </span>
                {formatAuthors(populatedAuthors)}
              </p>
            )}
            {hasAuthors && publishedAt && (
              <span aria-hidden className="hidden text-white/40 md:inline">
                ·
              </span>
            )}
            {publishedAt && (
              <time className="text-white/70" dateTime={publishedAt}>
                {formatDateTime(publishedAt)}
              </time>
            )}
          </div>

          <div className="mt-6">
            <SocialShare
              authorSocialLinks={
                (populatedAuthors?.[0]?.socialLinks as { platform: string; url: string }[] | null) ?? null
              }
              title={title}
            />
          </div>
        </Reveal>
      </div>
      <div className="min-h-[80vh] select-none">
        {heroImage && typeof heroImage !== 'string' && (
          <Media fill priority imgClassName="-z-10 object-cover" resource={heroImage} />
        )}
        <div className="absolute pointer-events-none left-0 bottom-0 w-full h-1/2 bg-linear-to-t from-black to-transparent" />
      </div>
    </div>
  )
}
