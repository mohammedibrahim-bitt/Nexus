import Link from 'next/link'
import React from 'react'

import type { Tag } from '@/payload-types'

import { cn } from '@/utilities/ui'

export const PostTags: React.FC<{ className?: string; tags?: (number | Tag)[] | null }> = ({
  className,
  tags,
}) => {
  const populated = (tags || []).filter((tag): tag is Tag => typeof tag === 'object')

  if (populated.length === 0) return null

  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      {populated.map((tag) => (
        <Link
          className="rounded-full border border-border px-3 py-1 text-sm text-muted-foreground hover:text-foreground hover:border-foreground transition-colors"
          href={`/posts?tag=${tag.slug}`}
          key={tag.id}
        >
          #{tag.title}
        </Link>
      ))}
    </div>
  )
}
