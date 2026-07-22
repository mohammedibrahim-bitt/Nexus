import React from 'react'

import { getCachedGlobal } from '@/utilities/getGlobals'

const getContrastForeground = (hex: string): string => {
  const normalized = hex.replace('#', '')
  const full =
    normalized.length === 3
      ? normalized
          .split('')
          .map((c) => c + c)
          .join('')
      : normalized

  const r = parseInt(full.slice(0, 2), 16) / 255
  const g = parseInt(full.slice(2, 4), 16) / 255
  const b = parseInt(full.slice(4, 6), 16) / 255

  // Relative luminance (WCAG)
  const toLinear = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)
  const luminance = 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b)

  return luminance > 0.4 ? '#171717' : '#fafafa'
}

export const BrandColor: React.FC = async () => {
  const settings = await getCachedGlobal('settings', 0)()
  const color = settings?.primaryColor

  if (!color) return null

  const foreground = getContrastForeground(color)
  const rule = `--primary: ${color}; --primary-foreground: ${foreground}; --ring: ${color};`
  const css = `:root, [data-theme='light'] { ${rule} } [data-theme='dark'] { ${rule} }`

  return <style dangerouslySetInnerHTML={{ __html: css }} />
}
