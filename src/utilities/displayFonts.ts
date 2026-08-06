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
  { cssVar: '--font-outfit', label: 'Outfit (geometric sans, default)', value: 'outfit' },
  { cssVar: '--font-space-grotesk', label: 'Space Grotesk', value: 'space-grotesk' },
  { cssVar: '--font-poppins', label: 'Poppins', value: 'poppins' },
  { cssVar: '--font-sora', label: 'Sora', value: 'sora' },
  { cssVar: '--font-inter-display', label: 'Inter (minimal)', value: 'inter' },
  { cssVar: '--font-newsreader', label: 'Newsreader (editorial serif)', value: 'newsreader' },
  { cssVar: '--font-playfair-display', label: 'Playfair Display (serif)', value: 'playfair-display' },
]

export const DEFAULT_DISPLAY_FONT = 'outfit'

export const getDisplayFontCssVar = (value: string | null | undefined): string =>
  DISPLAY_FONT_OPTIONS.find((f) => f.value === value)?.cssVar || '--font-outfit'
