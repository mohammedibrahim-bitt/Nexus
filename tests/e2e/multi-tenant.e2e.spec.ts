import { expect, test } from '@playwright/test'

import { login } from '../helpers/login'

/**
 * Multi-tenancy end-to-end coverage:
 *  - content isolation between subdomains
 *  - admin-only enforcement of tenant creation (UI *and* API)
 *  - brand sync running at create time rather than on the next poll
 *
 * Subdomains resolve locally because `*.localhost` maps to 127.0.0.1 — the
 * middleware reads the Host header, so `acme.localhost:3000` is a real request
 * against the same dev server.
 */

const SERVER = 'http://localhost:3000'
const DEFAULT_HOST = 'http://localhost:3000'
const ACME_HOST = 'http://acme.localhost:3000'

const ADMIN = { email: 'admin@example.com', password: 'Admin123!' }

// Seeded in the default tenant.
const DEFAULT_TENANT_POST = 'One Piece'
// Seeded in the acme tenant only.
const ACME_ONLY_POST = 'ACME ONLY POST'

test.describe('Tenant isolation', () => {
  test("a post in tenant A is not rendered on tenant B's subdomain", async ({ page }) => {
    await page.goto(`${DEFAULT_HOST}/posts`)
    await expect(page.locator('body')).toContainText(DEFAULT_TENANT_POST)
    // The other tenant's article must not leak in.
    await expect(page.locator('body')).not.toContainText(ACME_ONLY_POST)

    await page.goto(`${ACME_HOST}/posts`)
    await expect(page.locator('body')).toContainText(ACME_ONLY_POST)
    await expect(page.locator('body')).not.toContainText(DEFAULT_TENANT_POST)
  })

  test('each subdomain renders its own branding', async ({ page }) => {
    await page.goto(`${DEFAULT_HOST}/posts`)
    await expect(page).toHaveTitle(/Nexus/)

    await page.goto(`${ACME_HOST}/posts`)
    await expect(page).toHaveTitle(/Acme Insights/)
  })

  test('search results are scoped to the current tenant', async ({ page }) => {
    await page.goto(`${DEFAULT_HOST}/search`)
    await expect(page.locator('body')).not.toContainText(ACME_ONLY_POST)

    await page.goto(`${ACME_HOST}/search`)
    await expect(page.locator('body')).toContainText(ACME_ONLY_POST)
  })

  test('an unknown subdomain 404s instead of falling back to another tenant', async ({ page }) => {
    const res = await page.goto('http://nosuchtenant.localhost:3000/posts')
    expect(res?.status()).toBe(404)
  })
})

test.describe('Tenant creation is admin-only', () => {
  test('the API route rejects an unauthenticated caller', async ({ request }) => {
    const res = await request.post(`${SERVER}/api/tenants/create-from-url`, {
      data: { name: 'Sneaky', slug: 'sneaky', sourceUrl: 'https://example.com' },
    })

    // 403 from our own role check; never 2xx.
    expect(res.status()).toBe(403)
    expect(res.ok()).toBeFalsy()
  })

  test('the API route rejects a non-admin (reader) session', async ({ browser }) => {
    const context = await browser.newContext()
    const page = await context.newPage()

    // Self-registration always yields the `reader` role — see Users.access.
    const email = `reader-${Date.now()}@example.com`
    await page.goto(`${SERVER}/signup`)
    await page.fill('#email', email)
    await page.fill('#password', 'Reader123!')
    await page.click('button[type="submit"]')
    await page.waitForTimeout(2000)

    const res = await context.request.post(`${SERVER}/api/tenants/create-from-url`, {
      data: { name: 'Reader Co', slug: `reader-${Date.now()}` },
    })

    expect(res.status()).toBe(403)

    await context.close()
  })

  test('a non-admin does not see Tenants in the admin nav', async ({ browser }) => {
    const context = await browser.newContext()
    const page = await context.newPage()

    const email = `reader2-${Date.now()}@example.com`
    await page.goto(`${SERVER}/signup`)
    await page.fill('#email', email)
    await page.fill('#password', 'Reader123!')
    await page.click('button[type="submit"]')
    await page.waitForTimeout(2000)

    // Readers can't open /admin at all (Users.access.admin === isTenantManager,
    // which readers never satisfy), so the Tenants link is unreachable either way.
    await page.goto(`${SERVER}/admin`)
    await expect(page.locator('nav')).not.toContainText('Tenants')

    await context.close()
  })

  test('an admin sees the Tenants nav item and the Create-from-URL panel', async ({ page }) => {
    await login({ page, user: ADMIN })

    await page.goto(`${SERVER}/admin/collections/tenants`)

    await expect(page.locator('.createTenantFromURL')).toBeVisible()
    await expect(page.locator('.createTenantFromURL')).toContainText('Create a tenant from a URL')
  })
})

test.describe('Tenant-admin role', () => {
  test.describe.configure({ timeout: 60_000 })

  // Deliberately does not assume a specific tenant slug exists (e.g. the
  // 'acme' fixture the "Tenant isolation" suite above assumes) — it looks up
  // whatever two tenants are actually present and uses those, so it stays
  // correct regardless of which tenants happen to be seeded.
  const TENANT_ADMIN = {
    email: `tenant-admin-${Date.now()}@example.com`,
    password: 'TenantAdmin123!',
  }

  let ownTenantId: number
  let otherTenantId: number
  let tenantAdminUserId: number
  let createdPostId: number | undefined

  test.beforeAll(async ({ browser }) => {
    test.setTimeout(60_000)
    const context = await browser.newContext()
    const page = await context.newPage()
    await login({ page, user: ADMIN })

    const tenants = await page.request.get(`${SERVER}/api/tenants?limit=50&depth=0`)
    expect(tenants.ok(), `GET /api/tenants failed: ${tenants.status()} ${await tenants.text()}`).toBeTruthy()
    const tenantsBody = await tenants.json()
    const [first, second] = tenantsBody.docs as Array<{ id: number; slug: string }>
    expect(first, 'at least two tenants must exist for this suite').toBeTruthy()
    expect(second, 'at least two tenants must exist for this suite').toBeTruthy()
    ownTenantId = first.id
    otherTenantId = second.id

    const created = await page.request.post(`${SERVER}/api/users`, {
      data: {
        name: 'E2E Tenant Admin',
        email: TENANT_ADMIN.email,
        password: TENANT_ADMIN.password,
        role: 'admin',
        tenants: [{ tenant: ownTenantId }],
        _verified: true,
      },
    })
    expect(created.ok()).toBeTruthy()
    tenantAdminUserId = (await created.json()).doc.id

    await context.close()
  })

  test.afterAll(async ({ browser }) => {
    test.setTimeout(60_000)
    const context = await browser.newContext()
    const page = await context.newPage()
    await login({ page, user: ADMIN })

    if (createdPostId) {
      await page.request.delete(`${SERVER}/api/posts/${createdPostId}`)
    }
    await page.request.delete(`${SERVER}/api/users/${tenantAdminUserId}`)

    await context.close()
  })

  test('a tenant-admin can open /admin and does not see Tenants in the nav', async ({ page }) => {
    await login({ page, user: TENANT_ADMIN })

    // The admin shell has more than one <nav> (sidebar + step/breadcrumb
    // nav), so a bare `nav` locator is ambiguous — this scopes to the
    // sidebar specifically, the one that lists collection links.
    const sidebar = page.locator('nav.nav__wrap')
    await expect(sidebar).not.toContainText('Tenants')
    await expect(sidebar).toContainText('Posts')
    await expect(sidebar).toContainText('Users')
  })

  test('a tenant-admin can create a post scoped to their own tenant', async ({ page }) => {
    await login({ page, user: TENANT_ADMIN })

    const res = await page.request.post(`${SERVER}/api/posts`, {
      data: {
        title: 'E2E Tenant Admin Post',
        slug: `e2e-tenant-admin-post-${Date.now()}`,
        tenant: ownTenantId,
        _status: 'draft',
        content: {
          root: {
            type: 'root',
            format: '',
            indent: 0,
            version: 1,
            direction: 'ltr',
            children: [
              {
                type: 'paragraph',
                format: '',
                indent: 0,
                version: 1,
                direction: 'ltr',
                children: [{ mode: 'normal', text: 'ok', type: 'text', style: '', detail: 0, format: 0, version: 1 }],
              },
            ],
          },
        },
      },
    })

    expect(res.ok()).toBeTruthy()
    const body = await res.json()
    // The REST create response returns the tenant relationship populated
    // (default depth), not a bare ID — compare the id field either way.
    const returnedTenantId =
      typeof body.doc.tenant === 'object' ? body.doc.tenant.id : body.doc.tenant
    expect(returnedTenantId).toBe(ownTenantId)
    createdPostId = body.doc.id
  })

  test('a tenant-admin is rejected when trying to create content in another tenant', async ({ page }) => {
    await login({ page, user: TENANT_ADMIN })

    const res = await page.request.post(`${SERVER}/api/posts`, {
      data: {
        title: 'Cross Tenant E2E Attempt',
        slug: `cross-tenant-e2e-attempt-${Date.now()}`,
        tenant: otherTenantId,
        _status: 'draft',
        content: {
          root: { type: 'root', format: '', indent: 0, version: 1, direction: 'ltr', children: [] },
        },
      },
    })

    expect(res.status()).toBe(403)
  })

  test('a tenant-admin cannot create a Tenant', async ({ page }) => {
    await login({ page, user: TENANT_ADMIN })

    const res = await page.request.post(`${SERVER}/api/tenants`, {
      data: { name: 'Sneaky From Tenant Admin', slug: `sneaky-${Date.now()}` },
    })

    expect(res.status()).toBe(403)
  })

  test('a tenant-admin cannot promote themselves to Super Admin', async ({ page }) => {
    await login({ page, user: TENANT_ADMIN })

    const res = await page.request.patch(`${SERVER}/api/users/${tenantAdminUserId}`, {
      data: { role: 'super_admin' },
    })

    expect(res.status()).toBe(403)
  })
})

test.describe('Brand sync on create', () => {
  test("a tenant created with a sourceUrl has its Settings branded immediately", async ({ page }) => {
    await login({ page, user: ADMIN })

    const slug = `brandsync-${Date.now()}`

    // example.com serves a <title>, which the HTML fallback path of the brand
    // resolver reads as the site name — so a successful sync is observable
    // without depending on a third-party brand.json.
    const created = await page.request.post(`${SERVER}/api/tenants/create-from-url`, {
      data: { name: 'Brand Sync Test', slug, sourceUrl: 'https://example.com' },
    })

    expect(created.ok()).toBeTruthy()
    const body = await created.json()
    expect(body.tenant.slug).toBe(slug)

    // The Settings doc must exist for the new tenant right away — no waiting
    // for the 5-minute revalidate window.
    const settings = await page.request.get(
      `${SERVER}/api/settings?where[tenant][equals]=${body.tenant.id}&limit=1`,
    )
    const settingsBody = await settings.json()

    expect(settingsBody.totalDocs).toBe(1)
    expect(settingsBody.docs[0].brandSyncUrl).toBe('https://example.com')
    // Either the synced name or the fallback, but never empty.
    expect(settingsBody.docs[0].siteName).toBeTruthy()

    // Cleanup so repeated local runs stay idempotent.
    await page.request.delete(`${SERVER}/api/tenants/${body.tenant.id}`)
  })
})
