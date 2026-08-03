import type { Metadata } from 'next/types'

import { getBrandData } from '@/utilities/getBrandData'
import React, { Suspense } from 'react'

import SignupPageClient from './page.client'

export default async function SignupPage() {
  const brand = await getBrandData()

  return (
    <Suspense>
      <SignupPageClient logo={brand.logo} siteName={brand.siteName} />
    </Suspense>
  )
}

export async function generateMetadata(): Promise<Metadata> {
  const brand = await getBrandData()

  return {
    title: `Sign up | ${brand.siteName}`,
  }
}
