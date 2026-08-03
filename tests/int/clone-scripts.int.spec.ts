import { describe, expect, it } from 'vitest'

import { stripScripts } from '@/utilities/clone/scripts'

const SRC = 'https://client-site.com/'

describe('stripScripts', () => {
  describe('removes what is unsafe or dead in a static clone', () => {
    it('removes third-party analytics by src', () => {
      const html = `<script src="https://www.googletagmanager.com/gtag/js?id=G-X"></script><p>hi</p>`
      const result = stripScripts(html, SRC)

      expect(result.html).not.toContain('googletagmanager')
      expect(result.html).toContain('<p>hi</p>')
      expect(result.removed).toHaveLength(1)
      expect(result.removed[0].reason).toMatch(/third-party/i)
    })

    it('removes inline trackers that have no src to match on', () => {
      const html = `<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}</script>`

      expect(stripScripts(html, SRC).removed).toHaveLength(1)
    })

    it('removes chat/support widgets', () => {
      const html = `<script src="https://widget.intercom.io/widget/abc"></script>`

      expect(stripScripts(html, SRC).removed[0].reason).toMatch(/third-party/i)
    })

    it('removes framework runtime that would fail to hydrate', () => {
      const html = `<script src="/_next/static/chunks/main-abc.js"></script>`
      const result = stripScripts(html, SRC)

      expect(result.html).not.toContain('_next/static')
      expect(result.removed[0].reason).toMatch(/framework runtime/i)
    })

    it('removes __NEXT_DATA__ hydration payload', () => {
      const html = `<script id="__NEXT_DATA__" type="application/json">{"props":{}}</script>`

      expect(stripScripts(html, SRC).removed).toHaveLength(1)
    })

    it("removes the source site's own bundles, which 404 at the new origin", () => {
      const html = `<script src="https://client-site.com/js/app.js"></script>`
      const result = stripScripts(html, SRC)

      expect(result.html).not.toContain('client-site.com/js/app.js')
      expect(result.removed[0].reason).toMatch(/source domain/i)
    })

    it('matches the source domain regardless of www', () => {
      const html = `<script src="https://www.client-site.com/js/app.js"></script>`

      expect(stripScripts(html, SRC).removed).toHaveLength(1)
    })
  })

  describe('flags rather than deletes anything it cannot positively identify', () => {
    it('keeps a likely mobile-nav toggle and reports it', () => {
      const html = `<script>document.querySelector('.hamburger').addEventListener('click',()=>document.body.classList.toggle('nav-open'))</script>`
      const result = stripScripts(html, SRC)

      // The whole point: deleting the nav is worse than leaving a dead script.
      expect(result.html).toContain('hamburger')
      expect(result.removed).toHaveLength(0)
      expect(result.flagged).toHaveLength(1)
      expect(result.flagged[0].reason).toMatch(/structurally important/i)
    })

    it('keeps and flags an unrecognised inline script', () => {
      const html = `<script>var x = 1 + 1;</script>`
      const result = stripScripts(html, SRC)

      expect(result.html).toContain('var x = 1 + 1')
      expect(result.flagged[0].reason).toMatch(/unrecognised inline/i)
    })

    it('keeps and flags an external script from an unknown third host', () => {
      const html = `<script src="https://cdn.jsdelivr.net/npm/swiper/swiper.min.js"></script>`
      const result = stripScripts(html, SRC)

      expect(result.html).toContain('jsdelivr')
      expect(result.flagged).toHaveLength(1)
      expect(result.removed).toHaveLength(0)
    })
  })

  describe('preserves non-executable content', () => {
    it('never touches JSON-LD structured data', () => {
      const html = `<script type="application/ld+json">{"@type":"Organization","name":"Acme"}</script>`
      const result = stripScripts(html, SRC)

      expect(result.html).toContain('"@type":"Organization"')
      expect(result.removed).toHaveLength(0)
      expect(result.flagged).toHaveLength(0)
    })
  })

  describe('reporting', () => {
    it('separates removed from flagged across a realistic page', () => {
      const html = `
        <script src="https://www.google-analytics.com/analytics.js"></script>
        <script src="/_next/static/chunks/framework.js"></script>
        <script src="https://client-site.com/api/config.js"></script>
        <script type="application/ld+json">{"@type":"WebSite"}</script>
        <script>document.getElementById('menu').addEventListener('click', toggle)</script>
      `
      const { flagged, html: out, removed } = stripScripts(html, SRC)

      expect(removed).toHaveLength(3)
      expect(flagged).toHaveLength(1)
      expect(out).toContain('ld+json')
      expect(out).toContain("getElementById('menu')")
    })

    it('truncates long bundles in the snippet instead of dumping them', () => {
      const html = `<script>${'a'.repeat(5000)}</script>`
      const { flagged } = stripScripts(html, SRC)

      expect(flagged[0].snippet.length).toBeLessThan(200)
      expect(flagged[0].snippet.endsWith('…')).toBe(true)
    })

    it('leaves script-free HTML untouched', () => {
      const html = `<html><body><h1>No scripts</h1></body></html>`
      const result = stripScripts(html, SRC)

      expect(result.html).toBe(html)
      expect(result.removed).toHaveLength(0)
      expect(result.flagged).toHaveLength(0)
    })
  })
})
