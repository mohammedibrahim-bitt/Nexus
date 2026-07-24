import Script from 'next/script'
import React from 'react'

import { getBrandData } from '@/utilities/getBrandData'

// Matches the Settings field's own validator — this value is interpolated
// into an inline <script> body, so it must be restricted to characters that
// can't break out of that context.
const SAFE_ID = /^[a-zA-Z0-9.\-_]+$/

export const Analytics: React.FC = async () => {
  const brand = await getBrandData()
  const id = brand.analyticsId?.trim()

  if (!id || brand.analyticsProvider === 'none' || !SAFE_ID.test(id)) return null

  if (brand.analyticsProvider === 'ga4') {
    return (
      <>
        <Script async src={`https://www.googletagmanager.com/gtag/js?id=${id}`} />
        <Script id="ga4-init">
          {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${id}');`}
        </Script>
      </>
    )
  }

  if (brand.analyticsProvider === 'plausible') {
    return <Script data-domain={id} defer src="https://plausible.io/js/script.js" />
  }

  return null
}
