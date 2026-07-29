import type { Metadata } from 'next'
import React from 'react'

import { NexusProvider } from '@/nexus/NexusProvider'
import { NexusShell } from '@/nexus/Shell'

import './nexus.css'

export const metadata: Metadata = {
  title: { default: 'Nexus', template: '%s · Nexus' },
  description: 'AI-written, human-approved articles — published automatically.',
}

export default function NexusRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <NexusProvider>
          <NexusShell>{children}</NexusShell>
        </NexusProvider>
      </body>
    </html>
  )
}
