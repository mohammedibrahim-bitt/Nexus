'use client'

import { useAllFormFields } from '@payloadcms/ui'
import { Facebook, Globe, Instagram, Linkedin, Youtube } from 'lucide-react'
import React, { useEffect, useState } from 'react'

import './index.scss'

const baseClass = 'profile-preview'

const XIcon: React.FC = () => (
  <svg fill="currentColor" height="14" viewBox="0 0 24 24" width="14">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
)

const platformIcons: Record<string, React.ReactNode> = {
  facebook: <Facebook size={14} />,
  instagram: <Instagram size={14} />,
  linkedin: <Linkedin size={14} />,
  twitter: <XIcon />,
  website: <Globe size={14} />,
  youtube: <Youtube size={14} />,
}

const socialLinkPattern = /^socialLinks\.(\d+)\.(platform|url)$/

export const ProfilePreview: React.FC = () => {
  const [fields] = useAllFormFields()
  const [avatarUrl, setAvatarUrl] = useState<null | string>(null)

  const name = (fields?.name?.value as string) || ''
  const title = fields?.title?.value as string | undefined
  const bio = fields?.bio?.value as string | undefined
  const avatarId = fields?.avatar?.value as number | string | undefined

  const socialLinksByIndex: Record<string, { platform?: string; url?: string }> = {}
  for (const path of Object.keys(fields || {})) {
    const match = path.match(socialLinkPattern)
    if (match) {
      const [, index, key] = match
      socialLinksByIndex[index] = socialLinksByIndex[index] || {}
      socialLinksByIndex[index][key as 'platform' | 'url'] = fields[path]?.value as string
    }
  }
  const socialLinks = Object.values(socialLinksByIndex).filter((link) => link.platform && link.url)

  useEffect(() => {
    if (!avatarId) {
      setAvatarUrl(null)
      return
    }

    let cancelled = false

    fetch(`/api/media/${avatarId}`)
      .then((res) => res.json())
      .then((doc) => {
        if (!cancelled) setAvatarUrl(doc?.url ?? null)
      })
      .catch(() => {
        if (!cancelled) setAvatarUrl(null)
      })

    return () => {
      cancelled = true
    }
  }, [avatarId])

  return (
    <div className={baseClass}>
      <p className={`${baseClass}__label`}>Preview</p>
      <p className={`${baseClass}__hint`}>How this appears in a post&apos;s byline</p>

      <div className={`${baseClass}__card`}>
        <div className={`${baseClass}__avatar`}>
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img alt={name} src={avatarUrl} />
          ) : (
            <span>{name.trim()?.[0]?.toUpperCase() || '?'}</span>
          )}
        </div>

        <div className={`${baseClass}__info`}>
          <strong>{name || 'Unnamed'}</strong>
          {title && <p className={`${baseClass}__title`}>{title}</p>}
          {bio && <p className={`${baseClass}__bio`}>{bio}</p>}

          {socialLinks.length > 0 && (
            <div className={`${baseClass}__social`}>
              {socialLinks.map((link) => (
                <span className={`${baseClass}__social-icon`} key={link.platform}>
                  {platformIcons[link.platform as string] ?? <Globe size={14} />}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ProfilePreview
