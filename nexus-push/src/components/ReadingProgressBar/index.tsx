'use client'

import React, { useEffect, useRef, useState } from 'react'

export const ReadingProgressBar: React.FC<{ targetId: string }> = ({ targetId }) => {
  const [progress, setProgress] = useState(0)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    const target = document.getElementById(targetId)
    if (!target) return

    const onScroll = () => {
      if (rafRef.current) return

      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null

        const rect = target.getBoundingClientRect()
        const viewportHeight = window.innerHeight
        const total = rect.height - viewportHeight
        const scrolled = -rect.top

        const pct = total > 0 ? Math.min(100, Math.max(0, (scrolled / total) * 100)) : 0
        setProgress(pct)
      })
    }

    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)

    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [targetId])

  return (
    <div className="fixed top-0 left-0 z-40 h-1 w-full bg-transparent print:hidden">
      <div className="h-full bg-primary transition-[width]" style={{ width: `${progress}%` }} />
    </div>
  )
}
