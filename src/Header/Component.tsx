import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { headers as getHeaders } from 'next/headers'
import { HeaderClient } from './Component.client'
import { getCachedTenantDoc } from '@/utilities/getTenantDoc'
import { getRequestTenant } from '@/utilities/getTenant'
import { getBrandData } from '@/utilities/getBrandData'
import React from 'react'

export async function Header() {
  const tenant = await getRequestTenant()
  const headerData = tenant ? await getCachedTenantDoc('header', tenant.id, 1)() : null
  const brand = await getBrandData(tenant?.slug)

  // Resolved server-side (from the request's own auth cookie) so
  // staff-only nav links like "New Post" render in the initial HTML
  // instead of popping in after the client-side auth check resolves.
  const payload = await getPayload({ config: configPromise })
  const headers = await getHeaders()
  const { user } = await payload.auth({ headers })
  const initialStaffRole =
    user && user.collection === 'users' ? (user.role as string) : null

  return <HeaderClient data={headerData} brand={brand} initialStaffRole={initialStaffRole} />
}
