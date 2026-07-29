'use client'

import React, { useEffect, useState } from 'react'
import type { Heading } from '@/utilities/richTextHeadings'

export const TableOfContents: React.FC<{ headings: Heading[] }> = ({ headings }) => {
  const [activeId, setActiveId] = useState<string>('')

  useEffect(() => {
    if (!headings || headings.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id)
          }
        })
      },
      {
        rootMargin: '-80px 0px -60% 0px',
        threshold: 0.1,
      },
    )

    headings.forEach((heading) => {
      const el = document.getElementById(heading.id)
      if (el) observer.observe(el)
    })

    return () => observer.disconnect()
  }, [headings])

  if (!headings || headings.length === 0) return null

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault()
    const element = document.getElementById(id)
    if (element) {
      const yOffset = -100
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset
      window.scrollTo({ top: y, behavior: 'smooth' })
      setActiveId(id)
    }
  }

  return (
    <nav aria-label="Table of contents" className="sticky top-28 select-none" data-toc>
      <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase mb-4">
        ON THIS PAGE
      </p>
      <div className="relative border-l border-border/60">
        <ul className="space-y-3 text-sm">
          {headings.map((heading) => {
            const isActive = activeId === heading.id
            return (
              <li key={heading.id} className="relative">
                <a
                  className={`block pl-4 py-0.5 text-sm transition-all duration-200 border-l-2 -ml-[1.5px] ${
                    isActive
                      ? 'border-foreground font-medium text-foreground'
                      : 'border-transparent text-muted-foreground/80 hover:text-foreground hover:border-border'
                  }`}
                  href={`#${heading.id}`}
                  onClick={(e) => handleClick(e, heading.id)}
                >
                  {heading.text}
                </a>
              </li>
            )
          })}
        </ul>
      </div>
    </nav>
  )
}
