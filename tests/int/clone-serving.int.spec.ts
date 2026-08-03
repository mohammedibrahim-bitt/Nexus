import type { Tenant } from '@/payload-types'

import { describe, expect, it } from 'vitest'

import { describeQaOutcome, meetsQaThreshold } from '@/utilities/clone/qa'
import { injectBlogLink, prepareShellForServing, shouldServeShell } from '@/utilities/clone/serveShell'

const tenant = (over: Partial<Tenant>): Tenant =>
  ({
    createdAt: '',
    id: 1,
    name: 'Acme',
    slug: 'acme',
    updatedAt: '',
    ...over,
  }) as Tenant

describe('shouldServeShell — the live-serving gate', () => {
  it('serves only a published shell', () => {
    expect(
      shouldServeShell(tenant({ cloneStatus: 'published', shellHtmlPath: '1/shell/index.html' })),
    ).toBe(true)
  })

  // The headline safety property: an approved-pending shell exists in storage
  // but must never reach a visitor.
  it('never serves a shell awaiting review', () => {
    expect(
      shouldServeShell(
        tenant({ cloneStatus: 'pending_review', shellHtmlPath: '1/shell/index.html' }),
      ),
    ).toBe(false)
  })

  it('never serves a shell for a brand-only tenant', () => {
    expect(
      shouldServeShell(tenant({ cloneStatus: 'brand_only', shellHtmlPath: '1/shell/index.html' })),
    ).toBe(false)
  })

  it('never serves while a scrape is mid-flight, or after one failed', () => {
    for (const cloneStatus of ['scraping', 'failed', 'none'] as const) {
      expect(shouldServeShell(tenant({ cloneStatus, shellHtmlPath: '1/shell/index.html' }))).toBe(
        false,
      )
    }
  })

  it('does not serve when published but the shell is gone', () => {
    expect(shouldServeShell(tenant({ cloneStatus: 'published', shellHtmlPath: null }))).toBe(false)
  })

  it('handles a missing tenant', () => {
    expect(shouldServeShell(null)).toBe(false)
    expect(shouldServeShell(undefined)).toBe(false)
  })
})

describe('QA threshold', () => {
  it('passes at or above the threshold', () => {
    expect(meetsQaThreshold(85, 85)).toBe(true)
    expect(meetsQaThreshold(99, 85)).toBe(true)
  })

  it('fails below it', () => {
    expect(meetsQaThreshold(84, 85)).toBe(false)
    expect(meetsQaThreshold(0, 85)).toBe(false)
  })

  it('honours a per-tenant threshold rather than a hardcoded one', () => {
    expect(meetsQaThreshold(70, 60)).toBe(true)
    expect(meetsQaThreshold(70, 95)).toBe(false)
  })

  it('recommends the fallback in the message when below threshold', () => {
    expect(describeQaOutcome(40, 85)).toMatch(/below the 85% threshold/i)
    expect(describeQaOutcome(40, 85)).toMatch(/brand-only/i)
    expect(describeQaOutcome(90, 85)).toMatch(/awaiting admin approval/i)
  })
})

describe('injectBlogLink', () => {
  it('adds /blog into a nav and inherits the sibling link styling', () => {
    const html = `<nav><a href="/" class="nav-link">Home</a><a href="/about" class="nav-link">About</a></nav>`
    const { html: out, injected } = injectBlogLink(html)

    expect(injected).toBe(true)
    expect(out).toContain('href="/blog"')
    expect(out).toContain('class="nav-link">Blog</a>')
  })

  it('leaves an ambiguous nav untouched rather than mangling it', () => {
    // No anchors to pattern-match against — per spec, leave it alone and rely
    // on /blog being reachable directly.
    const html = `<nav><div class="obfuscated-xyz"></div></nav>`
    const { html: out, injected } = injectBlogLink(html)

    expect(injected).toBe(false)
    expect(out).toBe(html)
  })

  it('is a no-op when there is no nav at all', () => {
    const html = `<div><p>no nav here</p></div>`

    expect(injectBlogLink(html).injected).toBe(false)
  })
})

describe('prepareShellForServing', () => {
  it('strips <base>, which would send every relative URL back to the source', () => {
    const html = `<head><base href="https://client-site.com/"><title>x</title></head>`
    const out = prepareShellForServing(html, 'https://client-site.com/')

    expect(out).not.toContain('<base')
    expect(out).toContain('<title>x</title>')
  })

  it('leaves markup without a base tag alone', () => {
    const html = `<head><title>x</title></head>`

    expect(prepareShellForServing(html, 'https://client-site.com/')).toBe(html)
  })
})
