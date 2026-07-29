import Link from 'next/link'
import React from 'react'

import type { BrandLogo } from '@/utilities/getBrandData'

import { Logo } from '@/components/Logo/Logo'

// Shared across every auth page (login/signup/forgot-password/reset-password/
// verify) so someone landing there from a bookmark or password manager sees
// the actual site's identity, not a generic unbranded form.
export const AuthLogo: React.FC<{ logo: BrandLogo; siteName: string }> = ({ logo, siteName }) => {
  return (
    <Link className="mb-8 inline-block transition-opacity hover:opacity-80" href="/">
      <Logo logo={logo} siteName={siteName} />
    </Link>
  )
}
