const hexToRgb = (hex: string): [number, number, number] => {
  const normalized = hex.replace('#', '')
  const full =
    normalized.length === 3
      ? normalized
          .split('')
          .map((c) => c + c)
          .join('')
      : normalized

  return [
    parseInt(full.slice(0, 2), 16),
    parseInt(full.slice(2, 4), 16),
    parseInt(full.slice(4, 6), 16),
  ]
}

const rgbToHsl = (r: number, g: number, b: number): [number, number, number] => {
  r /= 255
  g /= 255
  b /= 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0
  let s = 0
  const l = (max + min) / 2

  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)

    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0)
        break
      case g:
        h = (b - r) / d + 2
        break
      case b:
        h = (r - g) / d + 4
        break
    }
    h /= 6
  }

  return [h * 360, s * 100, l * 100]
}

const hslToHex = (h: number, s: number, l: number): string => {
  h /= 360
  s /= 100
  l /= 100

  let r: number
  let g: number
  let b: number

  if (s === 0) {
    r = g = b = l
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1
      if (t > 1) t -= 1
      if (t < 1 / 6) return p + (q - p) * 6 * t
      if (t < 1 / 2) return q
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
      return p
    }

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s
    const p = 2 * l - q
    r = hue2rgb(p, q, h + 1 / 3)
    g = hue2rgb(p, q, h)
    b = hue2rgb(p, q, h - 1 / 3)
  }

  const toHex = (c: number) =>
    Math.round(c * 255)
      .toString(16)
      .padStart(2, '0')

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

/**
 * Returns a dark, low-lightness shade of the given hex color — same hue/saturation,
 * clamped to a lightness that reads as a "near-black brand tint" background.
 *
 * `maxSaturation` defaults to 45 (a muted tint, right for background fills).
 * Raise it for foreground accents, where over-desaturating collapses every
 * brand colour into the same near-grey and loses the brand entirely.
 */
export const darkShade = (hex: string, lightness = 13, maxSaturation = 45): string => {
  try {
    const [r, g, b] = hexToRgb(hex)
    const [h, s] = rgbToHsl(r, g, b)
    return hslToHex(h, Math.min(s, maxSaturation), lightness)
  } catch {
    return '#111111'
  }
}

/**
 * Returns a light, high-lightness shade of the given hex color — same hue/saturation,
 * clamped to a lightness that reads clearly against a dark background.
 *
 * See `darkShade` for the `maxSaturation` rationale.
 */
export const lightShade = (hex: string, lightness = 85, maxSaturation = 45): string => {
  try {
    const [r, g, b] = hexToRgb(hex)
    const [h, s] = rgbToHsl(r, g, b)
    return hslToHex(h, Math.min(s, maxSaturation), lightness)
  } catch {
    return '#f5f5f5'
  }
}
