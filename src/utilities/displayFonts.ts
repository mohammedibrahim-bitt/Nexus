export type DisplayFontOption = {
  cssVar: string
  label: string
  value: string
}

/**
 * Curated set of display fonts an admin can choose for headings/logo via
 * Settings > Appearance. Each is preloaded in the root layout via
 * next/font/google (self-hosted, no extra network requests); switching
 * between them just swaps which CSS variable `--font-display` points at.
 */
export const DISPLAY_FONT_OPTIONS: DisplayFontOption[] = [
  { cssVar: '--font-space-grotesk', label: 'Space Grotesk (default)', value: 'space-grotesk' },
  { cssVar: '--font-poppins', label: 'Poppins', value: 'poppins' },
  { cssVar: '--font-sora', label: 'Sora', value: 'sora' },
  { cssVar: '--font-outfit', label: 'Outfit', value: 'outfit' },
  { cssVar: '--font-playfair-display', label: 'Playfair Display (serif)', value: 'playfair-display' },
  { cssVar: '--font-inter-display', label: 'Inter (minimal)', value: 'inter' },
]

export const DEFAULT_DISPLAY_FONT = 'space-grotesk'

export const getDisplayFontCssVar = (value: string | null | undefined): string =>
  DISPLAY_FONT_OPTIONS.find((f) => f.value === value)?.cssVar || '--font-space-grotesk'
