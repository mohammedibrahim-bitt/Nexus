'use client'

import React from 'react'

import type { Heading } from '@/utilities/richTextHeadings'

export const TableOfContents: React.FC<{ headings: Heading[] }> = ({ headings }) => {
  if (headings.length < 2) return null

  return (
    <nav aria-label="Table of contents" className="sticky top-24 hidden lg:block" data-toc>
      <p className="text-sm font-semibold mb-3">On this page</p>
      <ul className="space-y-2 border-l border-border text-sm">
        {headings.map((heading) => (
          <li key={heading.id} style={{ paddingLeft: `${(heading.level - 1) * 0.75}rem` }}>
            <a
              className="block border-l -ml-px border-transparent pl-3 text-muted-foreground hover:text-foreground hover:border-foreground transition-colors"
              href={`#${heading.id}`}
            >
              {heading.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}
