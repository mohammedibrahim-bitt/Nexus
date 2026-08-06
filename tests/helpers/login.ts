import type { Page } from '@playwright/test'
import { expect } from '@playwright/test'

export interface LoginOptions {
  page: Page
  serverURL?: string
  user: {
    email: string
    password: string
  }
}

/**
 * Logs the user into the admin panel via the login page.
 */
export async function login({
  page,
  serverURL = 'http://localhost:3000',
  user,
}: LoginOptions): Promise<void> {
  await page.goto(`${serverURL}/admin/login`)

  await page.fill('#field-email', user.email)
  await page.fill('#field-password', user.password)
  await page.click('button[type="submit"]')

  // Exact match, not a glob prefix — `/admin` would otherwise also match
  // staying on `/admin/login` after a failed attempt, masking a real login
  // failure as a false-positive pass.
  await page.waitForURL((url) => url.pathname === '/admin', { timeout: 30_000 })

  // This dev server's first hit on a given route/session can be slow (seen
  // throughout this project — Turbopack/Payload cold-start, not the login
  // flow itself), so this needs more room than Playwright's 5s default.
  const dashboardArtifact = page.locator('span[title="Dashboard"]')
  await expect(dashboardArtifact).toBeVisible({ timeout: 30_000 })

  // `page.request` shares the browser context's cookie jar, but there's an
  // intermittent race in this environment where a `page.request` call made
  // immediately after login fires before the `payload-token` cookie set by
  // the login response has actually landed in that jar — the request goes
  // out unauthenticated and callers relying on `page.request` right after
  // `login()` (e.g. beforeAll/afterAll API setup) get a 401/403. Poll for
  // the cookie explicitly so `login()` never returns before it's usable.
  await expect(async () => {
    const cookies = await page.context().cookies()
    const hasToken = cookies.some((c) => c.name === 'payload-token' && c.value)
    expect(hasToken).toBe(true)
  }).toPass({ timeout: 10_000 })
}
