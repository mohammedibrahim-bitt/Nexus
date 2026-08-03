import type { BannerBlock as BannerBlockProps } from 'src/payload-types'

import { cn } from '@/utilities/ui'
import React from 'react'
import RichText from '@/components/RichText'

type Props = {
  className?: string
} & BannerBlockProps

export const BannerBlock: React.FC<Props> = ({ className, content, style }) => {
  return (
    <div className={cn('mx-auto my-8 w-full', className)}>
      <div
        className={cn('flex items-center rounded-md border border-l-4 px-5 py-4 text-sm', {
          'border-border border-l-primary bg-card shadow-[var(--shadow-sm)]': style === 'info',
          'border-error border-l-destructive bg-error/30': style === 'error',
          'border-success border-l-chart-4 bg-success/30': style === 'success',
          'border-warning border-l-chart-3 bg-warning/30': style === 'warning',
        })}
      >
        <RichText data={content} enableGutter={false} enableProse={false} />
      </div>
    </div>
  )
}
