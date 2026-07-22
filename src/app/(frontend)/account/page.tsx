import type { Metadata } from 'next/types'

import { getBrandData } from '@/utilities/getBrandData'
import React from 'react'

import AccountPageClient from './page.client'

export default function AccountPage() {
  return <AccountPageClient />
}

export async function generateMetadata(): Promise<Metadata> {
  const brand = await getBrandData()

  return {
    title: `Your account | ${brand.siteName}`,
  }
}
