'use client'

import { Check, Facebook, Link as LinkIcon, Linkedin, Share2 } from 'lucide-react'
import React, { useState } from 'react'

const IconButton: React.FC<{
  'aria-label': string
  href?: string
  onClick?: () => void
}> = ({ 'aria-label': ariaLabel, href, onClick, children }) => {
  const className =
    'flex size-10 items-center justify-center rounded-full border bg-card text-foreground transition-colors hover:bg-muted'

  if (href) {
    return (
      <a
        aria-label={ariaLabel}
        className={className}
        href={href}
        rel="noopener noreferrer"
        target="_blank"
      >
        {children}
      </a>
    )
  }

  return (
    <button aria-label={ariaLabel} className={className} onClick={onClick} type="button">
      {children}
    </button>
  )
}

// X's own logo isn't in lucide-react's icon set, so it's drawn inline here.
const XIcon: React.FC = () => (
  <svg fill="currentColor" height="16" viewBox="0 0 24 24" width="16">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
)

export const ShareButtons: React.FC<{ title: string; url: string }> = ({ title, url }) => {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // clipboard access denied — nothing to fall back to here
    }
  }

  const encodedUrl = encodeURIComponent(url)
  const encodedTitle = encodeURIComponent(title)

  return (
    <div className="flex flex-col gap-3" data-social-share>
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <Share2 className="size-4" />
        Share this post
      </p>
      <div className="flex gap-3">
        <IconButton aria-label="Copy link" onClick={handleCopy}>
          {copied ? <Check className="size-4" /> : <LinkIcon className="size-4" />}
        </IconButton>
        <IconButton
          aria-label="Share on LinkedIn"
          href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`}
        >
          <Linkedin className="size-4" />
        </IconButton>
        <IconButton
          aria-label="Share on X"
          href={`https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`}
        >
          <XIcon />
        </IconButton>
        <IconButton
          aria-label="Share on Facebook"
          href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`}
        >
          <Facebook className="size-4" />
        </IconButton>
      </div>
    </div>
  )
}
