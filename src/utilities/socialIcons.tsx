import { Facebook, Github, Instagram, Link2, Linkedin, Music2, Twitter, Youtube } from 'lucide-react'

export const socialIconComponents: Record<string, React.ComponentType<{ className?: string }>> = {
  facebook: Facebook,
  github: Github,
  instagram: Instagram,
  linkedin: Linkedin,
  tiktok: Music2,
  twitter: Twitter,
  youtube: Youtube,
  other: Link2,
}

export const socialPlatformLabels: Record<string, string> = {
  facebook: 'Facebook',
  github: 'GitHub',
  instagram: 'Instagram',
  linkedin: 'LinkedIn',
  tiktok: 'TikTok',
  twitter: 'X / Twitter',
  youtube: 'YouTube',
  other: 'Link',
}
