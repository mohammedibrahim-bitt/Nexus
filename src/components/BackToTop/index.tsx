'use client'

import { ArrowUp } from 'lucide-react'
import React, { useEffect, useState } from 'react'

export const BackToTop: React.FC = () => {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  if (!visible) return null

  return (
    <button
      aria-label="Back to top"
      className="fixed bottom-6 right-6 z-50 flex size-11 items-center justify-center rounded-full border border-border bg-background text-foreground shadow-lg transition-opacity hover:opacity-80"
      onClick={() => window.scrollTo({ behavior: 'smooth', top: 0 })}
      type="button"
    >
      <ArrowUp className="size-5" />
    </button>
  )
}
