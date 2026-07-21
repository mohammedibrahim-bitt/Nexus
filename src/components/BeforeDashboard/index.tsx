'use client'

import { useAuth } from '@payloadcms/ui'
import { Banner } from '@payloadcms/ui/elements/Banner'
import { FileText, MessageSquareText, ShieldCheck, Users } from 'lucide-react'
import React from 'react'

import { SeedButton } from './SeedButton'
import './index.scss'

const baseClass = 'before-dashboard'

const quickLinks = [
  {
    description: 'Draft a new article. It stays private until a reviewer signs off.',
    href: '/admin/collections/posts/create',
    icon: FileText,
    title: 'Write a post',
    visibleFor: ['admin', 'author', 'reviewer'],
  },
  {
    description:
      'Open a draft and set yourself (or another reviewer) in its "Reviewed By" field — that\'s what unlocks publishing.',
    href: '/admin/collections/posts',
    icon: ShieldCheck,
    title: 'Review a post',
    visibleFor: ['admin', 'reviewer'],
  },
  {
    description: 'Only admins can grant the admin or reviewer role to an account.',
    href: '/admin/collections/users',
    icon: Users,
    title: 'Manage roles',
    visibleFor: ['admin'],
  },
  {
    description: 'Approve or reject reader reviews before they appear on a post.',
    href: '/admin/collections/reviews',
    icon: MessageSquareText,
    title: 'Moderate reviews',
    visibleFor: ['admin', 'reviewer'],
  },
]

const BeforeDashboard: React.FC = () => {
  const { user } = useAuth()
  // Least-privilege default while the user is still loading, so nothing
  // admin/reviewer-only flashes before we know the actual role.
  const role = (user as { role?: string } | null)?.role ?? 'author'

  const visibleLinks = quickLinks.filter((link) => link.visibleFor.includes(role))

  return (
    <div className={baseClass}>
      <Banner className={`${baseClass}__banner`} type="success">
        <h4>Welcome to the editorial dashboard</h4>
      </Banner>

      <div className={`${baseClass}__grid`}>
        {visibleLinks.map(({ description, href, icon: Icon, title }) => (
          <a className={`${baseClass}__card`} href={href} key={title}>
            <Icon className={`${baseClass}__card-icon`} size={20} />
            <div>
              <strong>{title}</strong>
              <p>{description}</p>
            </div>
          </a>
        ))}
      </div>

      {role === 'admin' && (
        <p className={`${baseClass}__seed`}>
          <SeedButton />
          {' with placeholder pages, posts, and users to explore the site, then '}
          <a href="/" target="_blank">
            visit your website
          </a>
          {'.'}
        </p>
      )}
    </div>
  )
}

export default BeforeDashboard
