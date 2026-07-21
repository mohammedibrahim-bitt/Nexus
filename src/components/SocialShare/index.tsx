'use client'

import { Facebook, Link2, Linkedin, Twitter } from 'lucide-react'
import React, { useState } from 'react'

export const SocialShare: React.FC<{ title: string }> = ({ title }) => {
  const [copied, setCopied] = useState(false)
  const url = typeof window !== 'undefined' ? window.location.href : ''

  const links = [
    {
      Icon: Twitter,
      href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`,
      label: 'Share on X',
    },
    {
      Icon: Facebook,
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      label: 'Share on Facebook',
    },
    {
      Icon: Linkedin,
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
      label: 'Share on LinkedIn',
    },
  ]

  const copyLink = async () => {
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex items-center gap-3">
      {links.map(({ Icon, href, label }) => (
        <a
          aria-label={label}
          className="flex size-9 items-center justify-center rounded-full border border-white/30 text-white transition-colors hover:bg-white/10"
          href={href}
          key={label}
          rel="noopener noreferrer"
          target="_blank"
        >
          <Icon className="size-4" />
        </a>
      ))}
      <button
        aria-label="Copy link"
        className="flex size-9 items-center justify-center rounded-full border border-white/30 text-white transition-colors hover:bg-white/10"
        onClick={copyLink}
        type="button"
      >
        <Link2 className="size-4" />
      </button>
      {copied && <span className="text-sm text-white">Link copied</span>}
    </div>
  )
}
