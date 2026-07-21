import clsx from 'clsx'
import React from 'react'

import type { Media as MediaType } from '@/payload-types'

import { Media } from '@/components/Media'

interface Props {
  className?: string
  logo?: MediaType | null
  siteName?: string | null
}

export const Logo = (props: Props) => {
  const { className, logo, siteName } = props

  if (logo && typeof logo === 'object') {
    return (
      <Media
        resource={logo}
        imgClassName={clsx('h-[34px] max-w-[9.375rem] w-full object-contain object-left', className)}
        htmlElement={null}
      />
    )
  }

  return (
    <span
      className={clsx(
        'inline-block h-[34px] max-w-[9.375rem] w-full font-bold text-2xl tracking-tight leading-[34px]',
        className,
      )}
    >
      {siteName || 'Nexus'}
    </span>
  )
}
