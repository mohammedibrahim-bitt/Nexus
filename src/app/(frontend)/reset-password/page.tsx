import type { Metadata } from 'next/types'

import { getBrandData } from '@/utilities/getBrandData'
import React, { Suspense } from 'react'

import ResetPasswordPageClient from './page.client'

export default async function ResetPasswordPage() {
  const brand = await getBrandData()

  return (
    <Suspense>
      <ResetPasswordPageClient logo={brand.logo} siteName={brand.siteName} />
    </Suspense>
  )
}

export async function generateMetadata(): Promise<Metadata> {
  const brand = await getBrandData()

  return {
    title: `Reset password | ${brand.siteName}`,
  }
}
