import { BadgeCheck, Clock, PenLine, ShieldCheck } from 'lucide-react'
import React from 'react'

import { formatDateTime } from '@/utilities/formatDateTime'

type BylinePerson = {
  avatarUrl?: string | null
  name?: string | null
}

const Avatar: React.FC<{ name?: string | null; url?: string | null }> = ({ name, url }) => {
  if (url) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img alt={name || ''} className="size-9 rounded-full object-cover" src={url} />
  }

  const initial = name?.trim()?.[0]?.toUpperCase() || '?'

  return (
    <div className="size-9 rounded-full bg-muted flex items-center justify-center text-sm font-medium">
      {initial}
    </div>
  )
}

export const ArticleByline: React.FC<{
  author?: BylinePerson
  expertVerified?: boolean
  reviewer?: BylinePerson
  updatedAt?: string
}> = ({ author, expertVerified, reviewer, updatedAt }) => {
  if (!author && !reviewer && !updatedAt) return null

  return (
    <div className="flex flex-wrap items-center gap-x-8 gap-y-3 border-y py-4">
      {author?.name && (
        <div className="flex items-center gap-3">
          <Avatar name={author.name} url={author.avatarUrl} />
          <div>
            <p className="flex items-center gap-1 text-sm text-muted-foreground">
              <PenLine className="size-3.5" />
              Written by
            </p>
            <p className="font-semibold">{author.name}</p>
          </div>
        </div>
      )}

      {reviewer?.name && (
        <div className="flex items-center gap-3">
          <Avatar name={reviewer.name} url={reviewer.avatarUrl} />
          <div>
            <p className="flex items-center gap-1 text-sm text-muted-foreground">
              <ShieldCheck className="size-3.5" />
              Reviewed by
            </p>
            <p className="font-semibold">{reviewer.name}</p>
          </div>
        </div>
      )}

      {updatedAt && (
        <div>
          <p className="flex items-center gap-1 text-sm text-muted-foreground">
            <Clock className="size-3.5" />
            Last updated:
          </p>
          <div className="flex items-center gap-2 font-semibold">
            <span>{formatDateTime(updatedAt)}</span>
            {expertVerified && (
              <span className="inline-flex items-center gap-1 text-sm font-semibold">
                Expert Verified
                <BadgeCheck className="size-4 text-orange-500" />
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
