import { Facebook, Globe, Instagram, Linkedin, ShieldCheck, Youtube } from 'lucide-react'
import React from 'react'

type SocialLink = {
  platform?: null | string
  url?: null | string
}

type TeamMember = {
  avatarUrl?: string
  bio?: string
  name?: string
  socialLinks?: SocialLink[] | null
  title?: string
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
  website: 'website',
  youtube: 'YouTube',
}

const Avatar: React.FC<{ name?: string; url?: string }> = ({ name, url }) => {
  if (url) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img alt={name || ''} className="size-14 shrink-0 rounded-full object-cover" src={url} />
  }

  return (
    <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-muted text-lg font-medium">
      {name?.trim()?.[0]?.toUpperCase() || '?'}
    </div>
  )
}

const TeamMemberRow: React.FC<{ label: string; member: TeamMember }> = ({ label, member }) => {
  if (!member.name) return null

  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex items-start gap-4">
        <Avatar name={member.name} url={member.avatarUrl} />
        <div>
          <p className="text-xs font-semibold tracking-wide text-orange-500 uppercase">{label}</p>
          <p className="font-semibold">{member.name}</p>
          {member.title && <p className="text-sm text-muted-foreground">{member.title}</p>}
          {member.bio && <p className="mt-2 text-sm">{member.bio}</p>}
        </div>
      </div>

      <div className="flex shrink-0 gap-2">
        {member.socialLinks
          ?.filter((link) => link.platform && link.url)
          .map((link) => (
            <a
              aria-label={`${member.name} on ${platformLabels[link.platform as string] ?? link.platform}`}
              className="flex size-9 items-center justify-center rounded-md border text-foreground hover:bg-muted"
              href={link.url as string}
              key={link.platform}
              rel="noopener noreferrer"
              target="_blank"
            >
              {platformIcons[link.platform as string] ?? <Globe className="size-4" />}
            </a>
          ))}
      </div>
    </div>
  )
}

export const EditorialTeam: React.FC<{
  author?: TeamMember
  reviewer?: TeamMember
}> = ({ author, reviewer }) => {
  if (!author?.name && !reviewer?.name) return null

  return (
    <div className="rounded-xl border bg-card p-6">
      <h2 className="mb-6 flex items-center gap-2 text-xl font-bold">
        <ShieldCheck className="size-5 text-orange-500" />
        About the editorial team
      </h2>

      <div className="flex flex-col gap-6">
        {author?.name && <TeamMemberRow label="Written by" member={author} />}
        {author?.name && reviewer?.name && <hr />}
        {reviewer?.name && <TeamMemberRow label="Reviewed by" member={reviewer} />}
      </div>
    </div>
  )
}
