import type { Metadata } from 'next/types'

import { getBrandData } from '@/utilities/getBrandData'
import { requireTenant } from '@/utilities/getTenant'
import React, { Suspense } from 'react'

import SignupPageClient from './page.client'

type Args = { params: Promise<{ tenantDomain: string }> }

export default async function SignupPage({ params: paramsPromise }: Args) {
  const { tenantDomain } = await paramsPromise
  const tenant = await requireTenant(tenantDomain)
  const brand = await getBrandData(tenant.slug)

  return (
    <Suspense>
      <SignupPageClient logo={brand.logo} siteName={brand.siteName} />
    </Suspense>
  )
}

export async function generateMetadata({ params: paramsPromise }: Args): Promise<Metadata> {
  const { tenantDomain } = await paramsPromise
  const brand = await getBrandData(tenantDomain)

  return {
    title: `Sign up | ${brand.siteName}`,
  }
}
