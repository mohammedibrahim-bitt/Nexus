import { HeaderClient } from './Component.client'
import { getCachedGlobal } from '@/utilities/getGlobals'
import { getBrandData } from '@/utilities/getBrandData'
import React from 'react'

export async function Header() {
  const headerData = await getCachedGlobal('header', 1)()
  const brand = await getBrandData()

  return <HeaderClient data={headerData} brand={brand} />
}
