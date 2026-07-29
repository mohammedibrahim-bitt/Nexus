import type { Metadata } from 'next/types'

import { getBrandData } from '@/utilities/getBrandData'
import React from 'react'

import ForgotPasswordPageClient from './page.client'

export default async function ForgotPasswordPage() {
  const brand = await getBrandData()

  return <ForgotPasswordPageClient logo={brand.logo} siteName={brand.siteName} />
}

export async function generateMetadata(): Promise<Metadata> {
  const brand = await getBrandData()

  return {
    title: `Forgot password | ${brand.siteName}`,
  }
}
