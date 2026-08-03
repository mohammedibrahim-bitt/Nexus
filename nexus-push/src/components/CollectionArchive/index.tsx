import { cn } from '@/utilities/ui'
import React from 'react'

import { Card, CardPostData } from '@/components/Card'
import { Reveal } from '@/components/Reveal'

export type Props = {
  posts: CardPostData[]
}

export const CollectionArchive: React.FC<Props> = (props) => {
  const { posts } = props

  return (
    <div className={cn('container')}>
      <div className="grid grid-cols-4 gap-x-6 gap-y-8 sm:grid-cols-8 lg:grid-cols-12">
        {posts?.map((result, index) => {
          if (typeof result === 'object' && result !== null) {
            // Front-page rhythm: the lead story takes two thirds of the first
            // row, then the deck settles into an even three-up grid.
            const isLead = index === 0

            return (
              <div
                className={cn('col-span-4', isLead && 'sm:col-span-8 lg:col-span-8')}
                key={index}
              >
                <Reveal className="h-full" delay={(index % 4) * 60}>
                  <Card className="h-full" doc={result} relationTo="posts" showCategories />
                </Reveal>
              </div>
            )
          }

          return null
        })}
      </div>
    </div>
  )
}
