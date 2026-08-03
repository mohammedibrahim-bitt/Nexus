import type { Metadata } from 'next/types'

import { getBrandData } from '@/utilities/getBrandData'
import React from 'react'

import AccountPageClient from './page.client'

export default function AccountPage() {
  return <AccountPageClient />
}

type Args = { params: Promise<{ tenantDomain: string }> }

export async function generateMetadata({ params: paramsPromise }: Args): Promise<Metadata> {
  const { tenantDomain } = await paramsPromise
  const brand = await getBrandData(tenantDomain)

  return {
    title: `Your account | ${brand.siteName}`,
  }
}
