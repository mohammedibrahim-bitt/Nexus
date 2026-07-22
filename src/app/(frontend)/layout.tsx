import type { Metadata } from 'next'

import { cn } from '@/utilities/ui'
import { GeistMono } from 'geist/font/mono'
import { GeistSans } from 'geist/font/sans'
import React from 'react'

import { AdminBar } from '@/components/AdminBar'
import { BackToTop } from '@/components/BackToTop'
import { BrandColor } from '@/components/BrandColor'
import { Footer } from '@/Footer/Component'
import { Header } from '@/Header/Component'
import { Providers } from '@/providers'
import { InitTheme } from '@/providers/Theme/InitTheme'
import { StructuredData } from '@/components/StructuredData'
import { getBrandData } from '@/utilities/getBrandData'
import { mergeOpenGraph } from '@/utilities/mergeOpenGraph'
import { websiteSchema } from '@/utilities/schema'
import { draftMode } from 'next/headers'

import './globals.css'
import { getServerSideURL } from '@/utilities/getURL'

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { isEnabled } = await draftMode()
  const brand = await getBrandData()

  return (
    <html className={cn(GeistSans.variable, GeistMono.variable)} lang="en" suppressHydrationWarning>
      <head>
        <InitTheme />
        <BrandColor />
        <StructuredData data={websiteSchema(brand)} />
        {brand.favicon?.url ? (
          <link href={brand.favicon.url} rel="icon" />
        ) : (
          <>
            <link href="/favicon.ico" rel="icon" sizes="32x32" />
            <link href="/favicon.svg" rel="icon" type="image/svg+xml" />
          </>
        )}
      </head>
      <body>
        <Providers>
          <AdminBar
            adminBarProps={{
              preview: isEnabled,
            }}
          />

          <Header />
          {children}
          <Footer />
          <BackToTop />
        </Providers>
      </body>
    </html>
  )
}

export async function generateMetadata(): Promise<Metadata> {
  const brand = await getBrandData()

  return {
    metadataBase: new URL(getServerSideURL()),
    openGraph: mergeOpenGraph(undefined, brand.siteName),
    twitter: {
      card: 'summary_large_image',
      creator: '@payloadcms',
    },
  }
}
