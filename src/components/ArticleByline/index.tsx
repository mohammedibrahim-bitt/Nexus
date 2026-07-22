import { BadgeCheck, Clock, PenLine, ShieldCheck } from 'lucide-react'
import Link from 'next/link'
import React from 'react'

import { formatDateTime } from '@/utilities/formatDateTime'

type BylinePerson = {
  avatarUrl?: string
  id?: number | string
  name?: string
}

const Avatar: React.FC<{ name?: string; url?: string }> = ({ name, url }) => {
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

const PersonName: React.FC<{ id?: number | string; name: string }> = ({ id, name }) => {
  if (id === undefined || id === null) return <p className="font-semibold">{name}</p>

  return (
    <Link className="font-semibold hover:underline" href={`/authors/${id}`}>
      {name}
    </Link>
  )
}

export const ArticleByline: React.FC<{
  author?: BylinePerson
  expertVerified?: boolean
  readingTimeMinutes?: number
  reviewer?: BylinePerson
  updatedAt?: string
}> = ({ author, expertVerified, readingTimeMinutes, reviewer, updatedAt }) => {
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
            <PersonName id={author.id} name={author.name} />
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
            <PersonName id={reviewer.id} name={reviewer.name} />
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

      {readingTimeMinutes && (
        <div className="ml-auto text-sm text-muted-foreground">{readingTimeMinutes} min read</div>
      )}
    </div>
  )
}
