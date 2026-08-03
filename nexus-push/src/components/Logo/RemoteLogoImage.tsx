'use client'

import clsx from 'clsx'
import React, { useState } from 'react'

interface Props {
  className?: string
  fallbackText: string
  imgClassName: string
  src: string
}

export const RemoteLogoImage: React.FC<Props> = ({ className, fallbackText, imgClassName, src }) => {
  const [failed, setFailed] = useState(false)

  if (failed) {
    return (
      <span
        className={clsx(
          'inline-block h-[34px] max-w-[9.375rem] w-full font-bold text-2xl tracking-tight leading-[34px]',
          className,
        )}
      >
        {fallbackText}
      </span>
    )
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={fallbackText} className={imgClassName} onError={() => setFailed(true)} src={src} />
  )
}
