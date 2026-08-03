import { describe, expect, it } from 'vitest'

import {
  extractCssAssets,
  extractHtmlAssets,
  findResidualSourceRefs,
  parseSrcset,
  resolveAgainstSource,
  rewriteRefs,
} from '@/utilities/clone/assetUrls'
import { unwrapNextImageDeep, unwrapNextImageUrl } from '@/utilities/clone/nextImage'
import { buildAssetPath } from '@/utilities/clone/storage'

const SRC = 'https://client-site.com/'

describe('next/image unwrapping', () => {
  it('decodes the real image URL out of the optimizer proxy', () => {
    const proxied = '/_next/image?url=%2Fimages%2Fhero.png&w=1920&q=75'

    expect(unwrapNextImageUrl(proxied, SRC)).toBe('https://client-site.com/images/hero.png')
  })

  it('decodes an absolute (e.g. CDN-hosted) target', () => {
    const proxied =
      '/_next/image?url=https%3A%2F%2Fcdn.example.com%2Fa%2Fb.jpg&w=640&q=80'

    expect(unwrapNextImageUrl(proxied, SRC)).toBe('https://cdn.example.com/a/b.jpg')
  })

  it('leaves ordinary image URLs untouched', () => {
    expect(unwrapNextImageUrl('/images/plain.png', SRC)).toBe('/images/plain.png')
    expect(unwrapNextImageUrl('https://client-site.com/x.svg', SRC)).toBe(
      'https://client-site.com/x.svg',
    )
  })

  it('terminates on a self-referential proxy instead of looping', () => {
    const selfRef = '/_next/image?url=%2F_next%2Fimage%3Furl%3D%252Fa.png&w=1&q=1'

    expect(() => unwrapNextImageDeep(selfRef, SRC)).not.toThrow()
  })
})

describe('resolving refs against the SOURCE origin', () => {
  // The trap: these look "internal" and would silently resolve against the new
  // subdomain at serve time if only domain-qualified URLs were rewritten.
  it('resolves next/font static media against the source, not the new host', () => {
    expect(resolveAgainstSource('/_next/static/media/font.woff2', SRC)).toBe(
      'https://client-site.com/_next/static/media/font.woff2',
    )
  })

  it('resolves root-relative and path-relative refs', () => {
    expect(resolveAgainstSource('/logo.svg', SRC)).toBe('https://client-site.com/logo.svg')
    expect(resolveAgainstSource('images/a.png', 'https://client-site.com/about/')).toBe(
      'https://client-site.com/about/images/a.png',
    )
  })

  it('resolves protocol-relative refs', () => {
    expect(resolveAgainstSource('//cdn.example.com/x.js', SRC)).toBe('https://cdn.example.com/x.js')
  })

  it('skips refs that are not fetchable assets', () => {
    for (const ref of ['#anchor', 'data:image/png;base64,AAA', 'mailto:a@b.c', 'javascript:void 0', '']) {
      expect(resolveAgainstSource(ref, SRC)).toBeNull()
    }
  })

  it('unwraps next/image while resolving', () => {
    expect(resolveAgainstSource('/_next/image?url=%2Fhero.png&w=16&q=75', SRC)).toBe(
      'https://client-site.com/hero.png',
    )
  })
})

describe('extracting assets from HTML', () => {
  const html = `
    <link rel="stylesheet" href="/assets/main.css">
    <link rel="icon" href="/favicon.ico">
    <img src="/img/a.png">
    <img srcset="/img/b.png 1x, /img/c.png 2x">
    <video poster="/img/poster.jpg"></video>
    <div style="background-image:url('/img/bg.jpg')"></div>
    <a href="/about">not an asset</a>
  `

  it('finds every asset reference, and does not follow anchors', () => {
    const urls = extractHtmlAssets(html, SRC).map((a) => a.absoluteUrl)

    expect(urls).toContain('https://client-site.com/assets/main.css')
    expect(urls).toContain('https://client-site.com/favicon.ico')
    expect(urls).toContain('https://client-site.com/img/a.png')
    expect(urls).toContain('https://client-site.com/img/b.png')
    expect(urls).toContain('https://client-site.com/img/c.png')
    expect(urls).toContain('https://client-site.com/img/poster.jpg')
    expect(urls).toContain('https://client-site.com/img/bg.jpg')
    expect(urls).not.toContain('https://client-site.com/about')
  })

  it('parses srcset candidates', () => {
    expect(parseSrcset('/a.png 1x, /b.png 2x, /c.png 900w')).toEqual(['/a.png', '/b.png', '/c.png'])
  })
})

describe('extracting assets from CSS', () => {
  it('resolves url() against the STYLESHEET, not the page', () => {
    const css = `@font-face { src: url(../fonts/x.woff2) format('woff2'); }`
    const cssUrl = 'https://client-site.com/assets/css/main.css'

    // Resolved against the page this would wrongly be /fonts/x.woff2
    expect(extractCssAssets(css, cssUrl)[0].absoluteUrl).toBe(
      'https://client-site.com/assets/fonts/x.woff2',
    )
  })

  it('handles quoted and unquoted url() forms', () => {
    const css = `a{background:url("/a.png")}b{background:url('/b.png')}c{background:url(/c.png)}`

    expect(extractCssAssets(css, SRC).map((a) => a.absoluteUrl)).toEqual([
      'https://client-site.com/a.png',
      'https://client-site.com/b.png',
      'https://client-site.com/c.png',
    ])
  })
})

describe('rewriting references', () => {
  it('replaces refs exactly as they appeared in the markup', () => {
    const html = `<img src="/img/a.png"><link href="/assets/main.css">`
    const map = new Map([
      ['/img/a.png', 'https://storage.test/1/assets/aaa-a.png'],
      ['/assets/main.css', 'https://storage.test/1/assets/bbb-main.css'],
    ])

    const out = rewriteRefs(html, map)

    expect(out).toContain('https://storage.test/1/assets/aaa-a.png')
    expect(out).toContain('https://storage.test/1/assets/bbb-main.css')
    expect(out).not.toContain('/img/a.png"')
  })

  it('does not let a short ref clobber a longer one containing it', () => {
    const css = `a{background:url(/img/a.png?v=2)}b{background:url(/img/a.png)}`
    const map = new Map([
      ['/img/a.png', 'https://storage.test/SHORT.png'],
      ['/img/a.png?v=2', 'https://storage.test/LONG.png'],
    ])

    const out = rewriteRefs(css, map)

    expect(out).toContain('https://storage.test/LONG.png')
    expect(out).toContain('https://storage.test/SHORT.png')
    // The versioned ref must not have become SHORT.png + a dangling "?v=2"
    expect(out).not.toContain('SHORT.png?v=2')
  })

  it('leaves unmapped refs alone', () => {
    const html = `<img src="/unmapped.png">`

    expect(rewriteRefs(html, new Map())).toBe(html)
  })
})

describe('residual source-domain detection', () => {
  it('flags any surviving link back to the original site', () => {
    const html = `<img src="https://storage.test/ok.png"><script src="https://client-site.com/app.js"></script>`

    expect(findResidualSourceRefs(html, SRC)).toEqual(['https://client-site.com/app.js'])
  })

  it('matches regardless of the www prefix', () => {
    const html = `<img src="https://www.client-site.com/x.png">`

    expect(findResidualSourceRefs(html, SRC)).toHaveLength(1)
  })

  it('returns empty for a fully self-contained shell', () => {
    const html = `<img src="https://storage.test/1/assets/a.png"><link href="https://storage.test/1/assets/b.css">`

    expect(findResidualSourceRefs(html, SRC)).toEqual([])
  })
})

describe('storage paths', () => {
  it('is stable for the same URL, so a re-sync overwrites instead of duplicating', () => {
    expect(buildAssetPath(7, 'https://client-site.com/logo.png')).toBe(
      buildAssetPath(7, 'https://client-site.com/logo.png'),
    )
  })

  it('distinguishes same-named files from different paths', () => {
    const a = buildAssetPath(7, 'https://client-site.com/a/logo.png')
    const b = buildAssetPath(7, 'https://client-site.com/b/logo.png')

    expect(a).not.toBe(b)
    expect(a.endsWith('logo.png')).toBe(true)
  })

  it('scopes assets under the tenant', () => {
    expect(buildAssetPath(42, 'https://client-site.com/x.png').startsWith('42/assets/')).toBe(true)
  })

  it('sanitises hostile filenames', () => {
    const p = buildAssetPath(1, 'https://client-site.com/../../etc/pa%20ss wd.png')

    expect(p.startsWith('1/assets/')).toBe(true)
    expect(p).not.toContain('..')
  })
})
