'use client'

import React, { useEffect, useRef, useState } from 'react'

import { cn } from '@/utilities/ui'

export const Reveal: React.FC<{
  children: React.ReactNode
  className?: string
  delay?: number
}> = ({ children, className, delay = 0 }) => {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { rootMargin: '0px 0px -10% 0px', threshold: 0.1 },
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      className={cn(
        'transition-[opacity,transform] duration-500 ease-out',
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3',
        className,
      )}
      ref={ref}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  )
}
