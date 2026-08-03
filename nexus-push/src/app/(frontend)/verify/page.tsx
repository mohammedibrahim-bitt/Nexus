import type { Metadata } from 'next/types'

import { getBrandData } from '@/utilities/getBrandData'
import React, { Suspense } from 'react'

import VerifyPageClient from './page.client'

export default async function VerifyPage() {
  const brand = await getBrandData()

  return (
    <Suspense>
      <VerifyPageClient logo={brand.logo} siteName={brand.siteName} />
    </Suspense>
  )
}

export async function generateMetadata(): Promise<Metadata> {
  const brand = await getBrandData()

  return {
    title: `Verify your account | ${brand.siteName}`,
  }
}
