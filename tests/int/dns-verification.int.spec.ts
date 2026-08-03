import { describe, expect, it } from 'vitest'

import {
  DNS_VERIFY_PREFIX,
  DNS_VERIFY_SUBDOMAIN,
  flattenTxtRecords,
  generateDnsToken,
  hostnameFromUrl,
  txtRecordsMatchToken,
} from '@/collections/Tenants'

/**
 * Covers the DNS-ownership check's decision logic directly. The route itself
 * needs live DNS + an authenticated admin, so the part worth pinning down in a
 * unit test is what it does with whatever the resolver returns — especially
 * that it fails closed.
 */
describe('DNS verification', () => {
  const token = 'nexus-verify=0123456789abcdef0123456789abcdef'

  describe('token generation', () => {
    it('produces a prefixed 32-hex-char token', () => {
      const generated = generateDnsToken()

      expect(generated.startsWith(`${DNS_VERIFY_PREFIX}=`)).toBe(true)
      expect(generated.replace(`${DNS_VERIFY_PREFIX}=`, '')).toMatch(/^[a-f0-9]{32}$/)
    })

    it('is unique per call — tokens must not be guessable from another tenant', () => {
      const tokens = new Set(Array.from({ length: 50 }, () => generateDnsToken()))

      expect(tokens.size).toBe(50)
    })
  })

  describe('hostnameFromUrl', () => {
    it('extracts the bare hostname and strips www', () => {
      expect(hostnameFromUrl('https://www.listlio.com/panel')).toBe('listlio.com')
      expect(hostnameFromUrl('http://example.com')).toBe('example.com')
      expect(hostnameFromUrl('https://news.acme.co.uk/a/b?c=d')).toBe('news.acme.co.uk')
    })

    it('returns null for junk rather than throwing', () => {
      expect(hostnameFromUrl('not a url')).toBeNull()
      expect(hostnameFromUrl('')).toBeNull()
    })
  })

  describe('flattenTxtRecords', () => {
    it('joins multi-chunk records, since >255-byte TXT values arrive split', () => {
      expect(flattenTxtRecords([['nexus-verify=', 'abc123']])).toEqual(['nexus-verify=abc123'])
    })

    it('trims surrounding whitespace', () => {
      expect(flattenTxtRecords([['  padded  ']])).toEqual(['padded'])
    })
  })

  describe('txtRecordsMatchToken', () => {
    it('matches when the exact token is published', () => {
      expect(txtRecordsMatchToken([[token]], token)).toBe(true)
    })

    it('matches when the token is one of several unrelated records', () => {
      const records = [['v=spf1 include:_spf.google.com ~all'], ['some-other=value'], [token]]

      expect(txtRecordsMatchToken(records, token)).toBe(true)
    })

    it('matches a token split across chunks', () => {
      expect(txtRecordsMatchToken([['nexus-verify=0123456789abcdef', '0123456789abcdef']], token)).toBe(
        true,
      )
    })

    // The fail-closed cases — each of these must NOT verify.
    it('rejects a deliberately wrong token', () => {
      expect(txtRecordsMatchToken([['nexus-verify=deadbeefdeadbeefdeadbeefdeadbeef']], token)).toBe(
        false,
      )
    })

    it('rejects when no records exist at all', () => {
      expect(txtRecordsMatchToken([], token)).toBe(false)
    })

    it('rejects a record that merely CONTAINS the token', () => {
      // Substring matching would let an attacker satisfy the check by
      // publishing the victim's token inside a longer unrelated record.
      expect(txtRecordsMatchToken([[`prefix ${token} suffix`]], token)).toBe(false)
    })

    it("rejects another tenant's token", () => {
      expect(txtRecordsMatchToken([[generateDnsToken()]], token)).toBe(false)
    })
  })

  it('builds the record name the admin instructions tell the client to create', () => {
    expect(`${DNS_VERIFY_SUBDOMAIN}.listlio.com`).toBe('_nexus-verify.listlio.com')
  })
})
