import { HeaderClient } from './Component.client'
import { getCachedGlobal } from '@/utilities/getGlobals'
import React from 'react'

export async function Header() {
  const headerData = await getCachedGlobal('header', 1)()
  const settingsData = await getCachedGlobal('settings', 1)()

  return <HeaderClient data={headerData} settings={settingsData} />
}
