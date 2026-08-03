import React from 'react'

import { getBrandData } from '@/utilities/getBrandData'
import { darkShade, lightShade } from '@/utilities/colorShade'
import { getDisplayFontCssVar } from '@/utilities/displayFonts'

export const BrandColor: React.FC = async () => {
  const brand = await getBrandData()
  const color = brand.primaryColor

  const radiusPx = Math.min(28, Math.max(0, brand.cornerRadius))
  const fontScale = Math.min(1.15, Math.max(0.9, brand.fontScale))
  const spaceScale = brand.density === 'compact' ? 0.75 : 1
  const fontDisplayVar = getDisplayFontCssVar(brand.fontFamily)

  const rootRule = `--radius: ${radiusPx}px; --space-scale: ${spaceScale}; --font-display: var(${fontDisplayVar});`
  const htmlRule = `html { font-size: calc(100% * ${fontScale}); }`
  // Standard "kill all CSS motion" trick — removes animation/transition
  // duration everywhere without hiding anything, for the admin's Enable
  // Animations toggle.
  const motionRule = brand.enableAnimations
    ? ''
    : `* { animation-duration: 0.001ms !important; animation-iteration-count: 1 !important; transition-duration: 0.001ms !important; scroll-behavior: auto !important; }`

  let colorCss = ''
  if (color) {
    // Same brand hue, but adapted per theme so it always has strong contrast
    // against that theme's background — a literal color forced into both
    // themes would go invisible in whichever theme it doesn't suit.
    const lightModePrimary = darkShade(color, 25)
    const darkModePrimary = lightShade(color, 85)

    const lightRule = `--primary: ${lightModePrimary}; --primary-foreground: #fafafa; --ring: ${lightModePrimary};`
    const darkRule = `--primary: ${darkModePrimary}; --primary-foreground: #171717; --ring: ${darkModePrimary};`
    colorCss = `:root, [data-theme='light'] { ${lightRule} } [data-theme='dark'] { ${darkRule} }`
  }

  let secondaryCss = ''
  if (brand.secondaryColor) {
    // A soft tint (not a solid brand color) — used for badges, secondary
    // buttons, and hover fills, so it stays subtle rather than competing
    // with the primary color. Text on top of it keeps the normal
    // foreground color rather than a brand-tinted one, for readability.
    const lightModeSecondary = lightShade(brand.secondaryColor, 94)
    const darkModeSecondary = darkShade(brand.secondaryColor, 22)

    const lightRule = `--secondary: ${lightModeSecondary}; --secondary-foreground: var(--foreground); --accent: ${lightModeSecondary}; --accent-foreground: var(--foreground);`
    const darkRule = `--secondary: ${darkModeSecondary}; --secondary-foreground: var(--foreground); --accent: ${darkModeSecondary}; --accent-foreground: var(--foreground);`
    secondaryCss = `:root, [data-theme='light'] { ${lightRule} } [data-theme='dark'] { ${darkRule} }`
  }

  const css = `:root { ${rootRule} } ${colorCss} ${secondaryCss} ${htmlRule} ${motionRule}`

  return <style dangerouslySetInnerHTML={{ __html: css }} />
}
