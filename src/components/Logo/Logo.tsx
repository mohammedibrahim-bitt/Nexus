import clsx from 'clsx'
import React from 'react'

import type { BrandLogo } from '@/utilities/getBrandData'

import { Media } from '@/components/Media'
import { RemoteLogoImage } from './RemoteLogoImage'

interface Props {
  className?: string
  logo?: BrandLogo
  siteName?: string | null
}

export const Logo = (props: Props) => {
  const { className, logo, siteName } = props

  const imgClassName = clsx(
    'h-[34px] max-w-[9.375rem] w-full object-contain object-left',
    className,
  )

  if (logo?.type === 'media') {
    return <Media resource={logo.media} imgClassName={imgClassName} htmlElement={null} />
  }

  if (logo?.type === 'remote') {
    return (
      <RemoteLogoImage
        className={className}
        fallbackText={siteName || 'Nexus'}
        imgClassName={imgClassName}
        src={logo.url}
      />
    )
  }

  return (
    <span
      className={clsx(
        'inline-block h-[34px] max-w-[9.375rem] w-full font-proxemic font-bold text-xl uppercase tracking-[0.18em] leading-[34px]',
        className,
      )}
    >
      {siteName || 'Nexus'}
    </span>
  )
}
