import type { Metadata } from 'next/types'

import { getBrandData } from '@/utilities/getBrandData'
import { requireTenant } from '@/utilities/getTenant'
import React, { Suspense } from 'react'

import LoginPageClient from './page.client'

type Args = { params: Promise<{ tenantDomain: string }> }

export default async function LoginPage({ params: paramsPromise }: Args) {
  const { tenantDomain } = await paramsPromise
  const tenant = await requireTenant(tenantDomain)
  const brand = await getBrandData(tenant.slug)

  return (
    <Suspense>
      <LoginPageClient logo={brand.logo} siteName={brand.siteName} />
    </Suspense>
  )
}

export async function generateMetadata({ params: paramsPromise }: Args): Promise<Metadata> {
  const { tenantDomain } = await paramsPromise
  const brand = await getBrandData(tenantDomain)

  return {
    title: `Log in | ${brand.siteName}`,
  }
}
