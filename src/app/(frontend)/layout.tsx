import type { Metadata } from 'next'

import { cn } from '@/utilities/ui'
import { GeistMono } from 'geist/font/mono'
import { GeistSans } from 'geist/font/sans'
import { Inter, Outfit, Playfair_Display, Poppins, Sora, Space_Grotesk } from 'next/font/google'
import React from 'react'

import { Analytics } from '@/components/Analytics'
import { BackToTop } from '@/components/BackToTop'
import { BrandColor } from '@/components/BrandColor'
import { Footer } from '@/Footer/Component'
import { Header } from '@/Header/Component'
import { Providers } from '@/providers'
import { InitTheme } from '@/providers/Theme/InitTheme'
import { getBrandData } from '@/utilities/getBrandData'
import { getMergedSettings } from '@/utilities/getSettings'
import { mergeOpenGraph } from '@/utilities/mergeOpenGraph'

import './globals.css'
import { getServerSideURL } from '@/utilities/getURL'

// Curated display-font options for Settings > Appearance — all preloaded
// (self-hosted via next/font/google) so switching the admin's selection is
// just a CSS variable swap in BrandColor, no extra network requests.
const spaceGrotesk = Space_Grotesk({
  display: 'swap',
  subsets: ['latin'],
  variable: '--font-space-grotesk',
})
const poppins = Poppins({
  display: 'swap',
  subsets: ['latin'],
  variable: '--font-poppins',
  weight: ['500', '600', '700'],
})
const sora = Sora({
  display: 'swap',
  subsets: ['latin'],
  variable: '--font-sora',
})
const outfit = Outfit({
  display: 'swap',
  subsets: ['latin'],
  variable: '--font-outfit',
})
const playfairDisplay = Playfair_Display({
  display: 'swap',
  subsets: ['latin'],
  variable: '--font-playfair-display',
})
const interDisplay = Inter({
  display: 'swap',
  subsets: ['latin'],
  variable: '--font-inter-display',
})

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const brand = await getBrandData()
  const faviconUrl = brand.favicon?.url

  return (
    <html
      className={cn(
        GeistSans.variable,
        GeistMono.variable,
        spaceGrotesk.variable,
        poppins.variable,
        sora.variable,
        outfit.variable,
        playfairDisplay.variable,
        interDisplay.variable,
      )}
      lang="en"
      suppressHydrationWarning
    >
      <head>
        <InitTheme />
        <BrandColor />
        <Analytics />
        {faviconUrl ? (
          <link href={faviconUrl} rel="icon" type={brand.favicon?.mimeType || undefined} />
        ) : (
          <>
            <link href="/favicon.ico" rel="icon" sizes="32x32" />
            <link href="/favicon.svg" rel="icon" type="image/svg+xml" />
          </>
        )}
      </head>
      <body>
        <Providers>
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
  const settings = await getMergedSettings(0)

  // Pull the X/Twitter handle out of Settings' social links, if one's set —
  // never fall back to a hardcoded handle that isn't actually this site's.
  const twitterLink = settings?.socialLinks?.find((link) => link.platform === 'twitter')?.url
  const twitterHandle = twitterLink?.match(/(?:twitter|x)\.com\/@?([^/?#]+)/i)?.[1]

  return {
    metadataBase: new URL(getServerSideURL()),
    openGraph: mergeOpenGraph(undefined, settings?.siteName),
    twitter: {
      card: 'summary_large_image',
      ...(twitterHandle ? { creator: `@${twitterHandle}` } : {}),
    },
  }
}
