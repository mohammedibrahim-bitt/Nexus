import type { Metadata } from 'next/types'

import { getBrandData } from '@/utilities/getBrandData'
import React, { Suspense } from 'react'

import ResetPasswordPageClient from './page.client'

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordPageClient />
    </Suspense>
  )
}

export async function generateMetadata(): Promise<Metadata> {
  const brand = await getBrandData()

  return {
    title: `Reset password | ${brand.siteName}`,
  }
}
