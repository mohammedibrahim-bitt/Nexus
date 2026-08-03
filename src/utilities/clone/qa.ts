import type { Browser } from 'playwright'

import { PNG } from 'pngjs'

import { uploadTenantAsset } from './storage'

/**
 * Phase 3 quality gate: render the rewritten shell, screenshot it, and
 * pixel-diff against the live-source screenshot taken during the scrape.
 *
 * The score is advisory, not a gate on its own — it catches "the CSS didn't
 * come through" but says nothing about whether the mobile nav still opens.
 * That's why nothing auto-publishes regardless of score.
 */

export type QaResult = {
  diffScreenshotPath: string
  /** 0–100. Percentage of pixels that match. */
  score: number
  shellScreenshotPath: string
}

/**
 * Scales two PNGs to a shared canvas size.
 *
 * Cloned shells rarely match the source's exact height (a dropped element
 * shortens the page), and pixelmatch requires identical dimensions. Comparing
 * the overlapping region on a common canvas — rather than bailing — keeps the
 * score meaningful instead of throwing on any height difference.
 */
const normalise = (a: PNG, b: PNG): { a: PNG; b: PNG; height: number; width: number } => {
  const width = Math.min(a.width, b.width)
  const height = Math.min(a.height, b.height)

  const crop = (src: PNG): PNG => {
    if (src.width === width && src.height === height) return src

    const out = new PNG({ height, width })
    PNG.bitblt(src, out, 0, 0, width, height, 0, 0)
    return out
  }

  return { a: crop(a), b: crop(b), height, width }
}

/**
 * Renders stored shell HTML in a headless browser and scores it against the
 * source screenshot.
 *
 * `shellUrl` is the public Storage URL of the rewritten HTML, so the browser
 * loads it exactly as a visitor would — proving the rewritten asset URLs
 * actually resolve, which reading the file off disk would not.
 */
export async function runShellQa(args: {
  shellUrl: string
  sourceScreenshot: Buffer
  tenantId: number | string
}): Promise<QaResult> {
  const { shellUrl, sourceScreenshot, tenantId } = args

  const { default: pixelmatch } = await import('pixelmatch')
  const { chromium } = await import('playwright')

  let browser: Browser | undefined

  try {
    browser = await chromium.launch({ headless: true })
    const context = await browser.newContext({ viewport: { height: 1080, width: 1440 } })
    const page = await context.newPage()

    await page.goto(shellUrl, { timeout: 60_000, waitUntil: 'networkidle' })
    // Give webfonts and any surviving CSS transitions a moment to settle.
    await page.waitForTimeout(1500)

    const shellScreenshot = await page.screenshot({ fullPage: true, type: 'png' })

    await browser.close()
    browser = undefined

    const sourcePng = PNG.sync.read(sourceScreenshot)
    const shellPng = PNG.sync.read(shellScreenshot)
    const { a: src, b: shell, height, width } = normalise(sourcePng, shellPng)

    const diff = new PNG({ height, width })
    const mismatched = pixelmatch(src.data, shell.data, diff.data, width, height, {
      threshold: 0.15,
    })

    const total = width * height
    const score = total === 0 ? 0 : Math.round(((total - mismatched) / total) * 100)

    const shellScreenshotPath = `${tenantId}/qa/shell.png`
    const diffScreenshotPath = `${tenantId}/qa/diff.png`

    await uploadTenantAsset({
      contentType: 'image/png',
      data: shellScreenshot,
      storagePath: shellScreenshotPath,
    })
    await uploadTenantAsset({
      contentType: 'image/png',
      data: PNG.sync.write(diff),
      storagePath: diffScreenshotPath,
    })

    return { diffScreenshotPath, score, shellScreenshotPath }
  } finally {
    if (browser) await browser.close().catch(() => undefined)
  }
}

/** Whether a score clears the tenant's configured bar. */
export const meetsQaThreshold = (score: number, threshold: number): boolean => score >= threshold

/** Human-readable summary for the clone log / admin UI. */
export const describeQaOutcome = (score: number, threshold: number): string =>
  meetsQaThreshold(score, threshold)
    ? `Clone quality ${score}% (threshold ${threshold}%) — awaiting admin approval.`
    : `Clone quality ${score}% is below the ${threshold}% threshold — brand-only fallback recommended.`
