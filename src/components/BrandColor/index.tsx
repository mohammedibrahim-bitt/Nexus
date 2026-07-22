import React from 'react'

import { getBrandData } from '@/utilities/getBrandData'
import { darkShade, lightShade } from '@/utilities/colorShade'

export const BrandColor: React.FC = async () => {
  const brand = await getBrandData()
  const color = brand.primaryColor

  if (!color) return null

  // Same brand hue, but adapted per theme so it always has strong contrast
  // against that theme's background — a literal color forced into both
  // themes would go invisible in whichever theme it doesn't suit.
  const lightModePrimary = darkShade(color, 25)
  const darkModePrimary = lightShade(color, 85)

  const lightRule = `--primary: ${lightModePrimary}; --primary-foreground: #fafafa; --ring: ${lightModePrimary};`
  const darkRule = `--primary: ${darkModePrimary}; --primary-foreground: #171717; --ring: ${darkModePrimary};`
  const css = `:root, [data-theme='light'] { ${lightRule} } [data-theme='dark'] { ${darkRule} }`

  return <style dangerouslySetInnerHTML={{ __html: css }} />
}
