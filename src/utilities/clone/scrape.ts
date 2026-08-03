import type { Browser, Page } from 'playwright'

import {
  extractCssAssets,
  extractHtmlAssets,
  findResidualSourceRefs,
  rewriteRefs,
  type DiscoveredAsset,
} from './assetUrls'
import { stripScripts, type ScriptDecision } from './scripts'
import { buildAssetPath, uploadTenantAsset, uploadTenantText } from './storage'

/**
 * Homepage-only capture of a source site, rewritten into a self-contained
 * static shell.
 *
 * Explicitly NOT a crawler: no sitemap traversal, no internal-link discovery.
 * The homepage becomes the shell; /blog is where the real content lives.
 */

/** Cap on assets pulled per clone — a runaway page shouldn't fill the bucket. */
const MAX_ASSETS = 300
/** Anything larger is almost certainly a video, not a shell asset. */
const MAX_ASSET_BYTES = 15 * 1024 * 1024
const ASSET_FETCH_TIMEOUT_MS = 20_000
const NAV_TIMEOUT_MS = 60_000

export type ScrapeResult = {
  assetCount: number
  flaggedScripts: ScriptDecision[]
  removedScripts: ScriptDecision[]
  residualSourceRefs: string[]
  shellHtmlPath: string
  sourceScreenshotPath: string
}

/**
 * Scrolls the full page height in increments, pausing after EACH one.
 *
 * The pause matters more than the scroll: lazy images swap `data-src` → `src`
 * via IntersectionObserver, and scroll-triggered animations (Framer Motion,
 * GSAP ScrollTrigger, AOS) need their transition to actually finish. Snapshot
 * too early and you capture unloaded images and elements frozen mid-transition
 * at `opacity: 0` or translated off-position.
 */
async function autoScroll(page: Page, opts: { settleMs: number; step: number }): Promise<void> {
  const height = await page.evaluate(() => document.body.scrollHeight)
  const viewport = page.viewportSize()?.height ?? 800

  for (let y = 0; y < height; y += opts.step) {
    await page.evaluate((top) => window.scrollTo({ behavior: 'instant', top }), y)
    await page.waitForTimeout(opts.settleMs)
  }

  // Bottom, then back to top — some headers/animations only settle on the way up.
  await page.evaluate(() => window.scrollTo({ behavior: 'instant', top: document.body.scrollHeight }))
  await page.waitForTimeout(opts.settleMs)
  await page.evaluate(() => window.scrollTo({ behavior: 'instant', top: 0 }))
  await page.waitForTimeout(opts.settleMs)

  void viewport
}

/** Best-effort network quiet; a page with polling never truly idles. */
async function settleNetwork(page: Page, timeoutMs = 10_000): Promise<void> {
  try {
    await page.waitForLoadState('networkidle', { timeout: timeoutMs })
  } catch {
    // Ignore — some sites keep a socket open forever.
  }
}

async function fetchAsset(
  url: string,
): Promise<null | { contentType: string; data: Buffer }> {
  try {
    const res = await fetch(url, {
      redirect: 'follow',
      signal: AbortSignal.timeout(ASSET_FETCH_TIMEOUT_MS),
    })

    if (!res.ok) return null

    const length = Number(res.headers.get('content-length') || 0)
    if (length > MAX_ASSET_BYTES) return null

    const buf = Buffer.from(await res.arrayBuffer())
    if (buf.byteLength > MAX_ASSET_BYTES) return null

    return { contentType: res.headers.get('content-type') || 'application/octet-stream', data: buf }
  } catch {
    return null
  }
}

/**
 * Captures `sourceUrl` and stores a rewritten, self-contained shell.
 *
 * Requires a working Playwright browser binary. Callers surface the launch
 * error verbatim, since "run npx playwright install" is the actionable fix.
 */
export async function scrapeSiteToShell(args: {
  scrollSettleMs?: number
  scrollStep?: number
  sourceUrl: string
  tenantId: number | string
}): Promise<ScrapeResult> {
  const { scrollSettleMs = 400, scrollStep = 600, sourceUrl, tenantId } = args

  // Imported lazily so merely loading this module (e.g. during a Next build)
  // doesn't require the browser to be installed.
  const { chromium } = await import('playwright')

  let browser: Browser | undefined

  try {
    browser = await chromium.launch({ headless: true })
    const context = await browser.newContext({
      // A desktop viewport — the shell is the desktop rendering of the site.
      viewport: { height: 1080, width: 1440 },
    })
    const page = await context.newPage()

    await page.goto(sourceUrl, { timeout: NAV_TIMEOUT_MS, waitUntil: 'domcontentloaded' })
    await settleNetwork(page)
    await autoScroll(page, { settleMs: scrollSettleMs, step: scrollStep })
    await settleNetwork(page)

    // Only now is the DOM representative of what a human would see.
    const renderedHtml = await page.content()

    const sourceScreenshot = await page.screenshot({ fullPage: true, type: 'png' })
    const sourceScreenshotPath = `${tenantId}/qa/source.png`
    await uploadTenantAsset({
      contentType: 'image/png',
      data: sourceScreenshot,
      storagePath: sourceScreenshotPath,
    })

    await browser.close()
    browser = undefined

    // ── Strip scripts before asset discovery: no point downloading a tracker's
    // own assets, and the flagged list feeds the review UI.
    const { flagged, html: scriptedHtml, removed } = stripScripts(renderedHtml, sourceUrl)

    // ── Discover assets from HTML, then follow stylesheets one level for the
    // fonts/images they reference (@font-face, background-image).
    const htmlAssets = extractHtmlAssets(scriptedHtml, sourceUrl)

    const refToStoredUrl = new Map<string, string>()
    const cssToRewrite: { asset: DiscoveredAsset; css: string }[] = []
    let uploaded = 0

    const isCss = (url: string, contentType: string) =>
      contentType.includes('text/css') || /\.css(\?|$)/i.test(url)

    for (const asset of htmlAssets) {
      if (uploaded >= MAX_ASSETS) break

      const fetched = await fetchAsset(asset.absoluteUrl)
      if (!fetched) continue

      if (isCss(asset.absoluteUrl, fetched.contentType)) {
        cssToRewrite.push({ asset, css: fetched.data.toString('utf8') })
        continue
      }

      const storagePath = buildAssetPath(tenantId, asset.absoluteUrl)
      const { publicUrl } = await uploadTenantAsset({
        contentType: fetched.contentType,
        data: fetched.data,
        storagePath,
      })

      refToStoredUrl.set(asset.originalRef, publicUrl)
      uploaded++
    }

    // ── Stylesheets: pull in what they reference, rewrite, then store.
    for (const { asset, css } of cssToRewrite) {
      const nested = extractCssAssets(css, asset.absoluteUrl)
      const cssRefMap = new Map<string, string>()

      for (const dep of nested) {
        if (uploaded >= MAX_ASSETS) break

        const fetched = await fetchAsset(dep.absoluteUrl)
        if (!fetched) continue

        const storagePath = buildAssetPath(tenantId, dep.absoluteUrl)
        const { publicUrl } = await uploadTenantAsset({
          contentType: fetched.contentType,
          data: fetched.data,
          storagePath,
        })

        cssRefMap.set(dep.originalRef, publicUrl)
        uploaded++
      }

      const rewrittenCss = rewriteRefs(css, cssRefMap)
      const cssPath = buildAssetPath(tenantId, asset.absoluteUrl)
      const { publicUrl } = await uploadTenantText({
        contentType: 'text/css',
        storagePath: cssPath,
        text: rewrittenCss,
      })

      refToStoredUrl.set(asset.originalRef, publicUrl)
      uploaded++
    }

    // ── Rewrite the HTML to point at stored copies.
    const rewrittenHtml = rewriteRefs(scriptedHtml, refToStoredUrl)

    // A self-contained shell should have nothing left pointing at the source.
    const residualSourceRefs = findResidualSourceRefs(rewrittenHtml, sourceUrl)

    const shellHtmlPath = `${tenantId}/shell/index.html`
    await uploadTenantText({
      contentType: 'text/html; charset=utf-8',
      storagePath: shellHtmlPath,
      text: rewrittenHtml,
    })

    return {
      assetCount: uploaded,
      flaggedScripts: flagged,
      removedScripts: removed,
      residualSourceRefs,
      shellHtmlPath,
      sourceScreenshotPath,
    }
  } finally {
    if (browser) await browser.close().catch(() => undefined)
  }
}
