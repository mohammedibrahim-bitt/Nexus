import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'

import { darkShade, lightShade } from '@/utilities/colorShade'
import { getBrandData } from '@/utilities/getBrandData'
import { resolveTenant } from '@/utilities/getTenant'

export const revalidate = 3600

export async function GET(req: NextRequest) {
  // A Route Handler, not a page under [tenantDomain] — it already has the
  // request object, so read Host directly rather than going through
  // next/headers.
  const tenant = await resolveTenant(req.headers.get('host'))
  const brand = await getBrandData(tenant?.slug)

  const title = (req.nextUrl.searchParams.get('title') || brand.siteName).slice(0, 140)

  const bg = darkShade(brand.primaryColor, 16)
  const accent = lightShade(brand.primaryColor, 70)

  return new ImageResponse(
    (
      <div
        style={{
          alignItems: 'flex-start',
          backgroundColor: bg,
          color: '#fafafa',
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          justifyContent: 'space-between',
          padding: '72px 80px',
          width: '100%',
        }}
      >
        <div
          style={{
            backgroundColor: accent,
            borderRadius: '9999px',
            color: bg,
            display: 'flex',
            fontSize: 28,
            fontWeight: 700,
            padding: '10px 28px',
          }}
        >
          {brand.siteName}
        </div>

        <div
          style={{
            display: 'flex',
            fontSize: title.length > 70 ? 52 : 64,
            fontWeight: 700,
            lineHeight: 1.15,
            maxWidth: '100%',
          }}
        >
          {title}
        </div>

        <div
          style={{
            backgroundColor: accent,
            borderRadius: '9999px',
            display: 'flex',
            height: 10,
            width: 160,
          }}
        />
      </div>
    ),
    {
      height: 630,
      width: 1200,
    },
  )
}
