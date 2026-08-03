'use client'

import { Banner } from '@payloadcms/ui/elements/Banner'
import { LayoutDashboard, MessageSquareText, Users } from 'lucide-react'
import React from 'react'

import { SeedButton } from './SeedButton'
import { DashboardStats } from './Stats'
import './index.scss'

const baseClass = 'before-dashboard'

// This panel is only ever reachable by admins now — Users.access.admin
// blocks author/reviewer accounts from /admin entirely, and they use
// /dashboard on the main site instead (see src/app/(frontend)/dashboard).
const quickLinks = [
  {
    description: 'Where authors and reviewers write and review posts, and manage their own profile.',
    href: '/dashboard',
    icon: LayoutDashboard,
    title: 'Staff dashboard',
  },
  {
    description: 'Grant the admin or reviewer role to an account.',
    href: '/admin/collections/users',
    icon: Users,
    title: 'Manage roles',
  },
  {
    description: 'Approve or reject reader reviews before they appear on a post.',
    href: '/admin/collections/reviews',
    icon: MessageSquareText,
    title: 'Moderate reviews',
  },
]

const BeforeDashboard: React.FC = () => {
  return (
    <div className={baseClass}>
      <Banner className={`${baseClass}__banner`} type="success">
        <h4>Welcome to the editorial dashboard</h4>
      </Banner>

      <DashboardStats />

      <div className={`${baseClass}__grid`}>
        {quickLinks.map(({ description, href, icon: Icon, title }) => (
          <a className={`${baseClass}__card`} href={href} key={title}>
            <Icon className={`${baseClass}__card-icon`} size={20} />
            <div>
              <strong>{title}</strong>
              <p>{description}</p>
            </div>
          </a>
        ))}
      </div>

      <p className={`${baseClass}__seed`}>
        <SeedButton />
        {' with placeholder pages, posts, and users to explore the site, then '}
        <a href="/" target="_blank">
          visit your website
        </a>
        {'.'}
      </p>
    </div>
  )
}

export default BeforeDashboard
