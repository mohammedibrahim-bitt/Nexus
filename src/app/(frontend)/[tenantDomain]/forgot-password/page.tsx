import type { Metadata } from 'next/types'

import { getBrandData } from '@/utilities/getBrandData'
import { requireTenant } from '@/utilities/getTenant'
import React from 'react'

import ForgotPasswordPageClient from './page.client'

type Args = { params: Promise<{ tenantDomain: string }> }

export default async function ForgotPasswordPage({ params: paramsPromise }: Args) {
  const { tenantDomain } = await paramsPromise
  const tenant = await requireTenant(tenantDomain)
  const brand = await getBrandData(tenant.slug)

  return <ForgotPasswordPageClient logo={brand.logo} siteName={brand.siteName} />
}

export async function generateMetadata({ params: paramsPromise }: Args): Promise<Metadata> {
  const { tenantDomain } = await paramsPromise
  const brand = await getBrandData(tenantDomain)

  return {
    title: `Forgot password | ${brand.siteName}`,
  }
}
