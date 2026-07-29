'use client'

import { Facebook, Globe, Instagram, Link2, Linkedin, Youtube } from 'lucide-react'
import React, { useEffect, useState } from 'react'

type SocialLink = {
  platform?: null | string
  url?: null | string
}

const XIcon: React.FC = () => (
  <svg fill="currentColor" height="16" viewBox="0 0 24 24" width="16">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
)

const platformIcons: Record<string, React.ReactNode> = {
  facebook: <Facebook className="size-4" />,
  instagram: <Instagram className="size-4" />,
  linkedin: <Linkedin className="size-4" />,
  twitter: <XIcon />,
  website: <Globe className="size-4" />,
  youtube: <Youtube className="size-4" />,
}

const platformLabels: Record<string, string> = {
  facebook: 'Facebook',
  instagram: 'Instagram',
  linkedin: 'LinkedIn',
  twitter: 'X',
  website: 'Website',
  youtube: 'YouTube',
}

export const SocialShare: React.FC<{
  authorSocialLinks?: SocialLink[] | null
  title: string
}> = ({ authorSocialLinks, title }) => {
  const [copied, setCopied] = useState(false)
  const [url, setUrl] = useState('')

  useEffect(() => {
    setUrl(window.location.href)
  }, [])

  const copyLink = async () => {
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const validSocialLinks = authorSocialLinks?.filter((l) => l.platform && l.url) ?? []

  return (
    <div className="flex items-center gap-3" data-social-share>
      {/* Author's social profile links */}
      {validSocialLinks.map((link) => (
        <a
          aria-label={`Author on ${platformLabels[link.platform as string] ?? link.platform}`}
          className="flex size-9 items-center justify-center rounded-full border border-white/30 text-white transition-colors hover:bg-white/10"
          href={link.url as string}
          key={link.platform}
          rel="noopener noreferrer"
          target="_blank"
        >
          {platformIcons[link.platform as string] ?? <Globe className="size-4" />}
        </a>
      ))}

      {/* Copy link — always visible */}
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
