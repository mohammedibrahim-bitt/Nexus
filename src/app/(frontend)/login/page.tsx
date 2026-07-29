import type { Metadata } from 'next/types'

import { getBrandData } from '@/utilities/getBrandData'
import React, { Suspense } from 'react'

import LoginPageClient from './page.client'

export default async function LoginPage() {
  const brand = await getBrandData()

  return (
    <Suspense>
      <LoginPageClient logo={brand.logo} siteName={brand.siteName} />
    </Suspense>
  )
}

export async function generateMetadata(): Promise<Metadata> {
  const brand = await getBrandData()

  return {
    title: `Log in | ${brand.siteName}`,
  }
}
