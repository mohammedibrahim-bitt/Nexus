# Handoff notes — tenant-admin role & RBAC refactor

Written for whoever picks this project up next. `README.md` is the
authoritative, general-purpose doc for this repo — read it first if you
haven't. This file covers one specific piece of work that landed on
`main` in commit `c6c4b87` (2026-08-06) and isn't in the README yet: the
role system was restructured from a single `admin` role to a two-tier
`super_admin` / tenant-scoped `admin` model. If you're touching
permissions, the Users collection, or any tenant-scoped collection's
`access` config, read this first — the failure mode when you get it wrong
is silent cross-tenant data leakage, not a crash.

## The role model

Five roles on `users.role`, in order of privilege:

| Role | Scope | Notes |
| --- | --- | --- |
| `super_admin` | Platform-wide, every tenant | The old `admin` role, renamed. Bypasses tenant scoping entirely — see `userHasAccessToAllTenants` in `src/plugins/index.ts`. |
| `admin` | One tenant (or a few, via the `tenants` array) | **New role.** Full CRUD on every tenant-scoped collection, but only within tenant(s) they're assigned to. Cannot create/delete Tenants, cannot touch another tenant's data, cannot grant `super_admin`, cannot change their own role. |
| `author` | Own tenant | Unchanged — writes/edits their own posts. |
| `reviewer` | Own tenant | Unchanged — approves/reviews posts, moderates reviews. |
| `reader` | Own tenant | Unchanged — the self-signup default. |

**Naming note:** `admin` the *role* is now tenant-scoped. `super_admin` is
what used to be called `admin`. If you're grepping for "admin" expecting
the old unrestricted role, you want `super_admin`.

### Where the logic lives

- **`src/access/permissions.ts`** — the one place role-group checks are
  defined. `isSuperAdmin(user)`, `isTenantManagerRole(user)` (true for
  `super_admin` OR `admin`), `userTenantIds(user)` (wraps the multi-tenant
  plugin's `getUserTenantIDs`), `usersSharingTenantWhere(user)`. Every
  access function in `src/access/` that needs a role check calls into
  this file rather than re-implementing `user.role === '...'` inline —
  if you add a new role tier, this is the only file that should need a
  new branch.
- **`src/access/isSuperAdmin.ts`**, **`isTenantManager.ts`** — `Access`-shaped
  wrappers around the two predicates above, for collections that just
  need a plain boolean gate (Tenants create/delete → `isSuperAdmin`;
  Pages/Settings/Header/Footer/ContentSources/SeoResearchRules →
  `isTenantManager`).
- **`src/hooks/enforceTenantOwnership.ts`** — a `beforeChange` hook, wired
  into every tenant-scoped collection that takes a plain `tenant`
  relationship field (Posts, Pages, Categories, Tags, ContentSources,
  SeoResearchRules, SeoResearchRuns, Settings, Header, Footer, Forms).
  **Read the comment at the top of this file before touching `create`
  access on any tenant-scoped collection** — it explains a real gap in
  `@payloadcms/plugin-multi-tenant`'s `withTenantAccess`: it adds a
  `Where` filter for read/update/delete, but Payload's `executeAccess`
  only checks truthiness for `create`, and a `Where` object is truthy —
  so without this hook, a tenant-scoped user's `create` access silently
  allows setting `tenant` to *any* tenant, not just their own. This was
  a real, verified vulnerability before this hook existed (see the
  commit for how it was found). If you add a new tenant-scoped
  collection, wire this hook into its `hooks.beforeChange`, or it has
  the same hole.
- **`src/collections/Users/hooks/enforceTenantAdminBoundaries.ts`** — a
  second `beforeChange` hook, Users-only. Handles the cross-field
  invariants a plain `Access` function can't express: blocks a
  tenant-admin from granting `super_admin`, from changing their own role
  (including to the role they already have — prevents both
  self-promotion and self-lockout), and from assigning a user to a
  tenant they don't themselves belong to.
- **`src/access/isSuperAdminOrTenantAdmin.ts`** — Users' `delete` access.
  Deliberately has no "self" carve-out (unlike `isAdminOrSelf`, used for
  `update`) — you can edit your own profile, but even a super_admin
  shouldn't be able to delete their own account through the normal API.

### Users is *not* a tenant-scoped collection

This is the one place in the codebase where "tenant-scoped" doesn't mean
what it means everywhere else. `posts`, `pages`, etc. are registered
with `multiTenantPlugin`'s `collections` map and get a single `tenant`
relationship + automatic `withTenantAccess` filtering. `users` is
**not** in that map — it has its own `tenants` **array** field (added
automatically by the plugin as `tenantsArrayField`, shape
`{ tenant: number, id: string }[]`), meaning one user can belong to
multiple tenants, and none of the automatic `withTenantAccess` filtering
applies to it. Its own access functions (`isAdminOrSelf`,
`isStaffOrSelf`, `isSuperAdminOrTenantAdmin`) do the tenant-matching by
hand via `usersSharingTenantWhere()`.

If you ever need "which tenants can this user act in" vs. "which tenant
does this document belong to" — those are two different fields
(`user.tenants[].tenant` vs. `doc.tenant`) and two different helpers
(`userTenantIds()` vs. `tenantWhere()` from the README's multi-tenancy
section). Don't conflate them.

## Testing this

- **Unit/integration**: `tests/int/tenant-admin-role.int.spec.ts` — 24
  tests directly exercising the access functions and both `beforeChange`
  hooks in isolation, no server/browser needed. Run with
  `npm run test:int`. These are fast and deterministic — if you change
  anything in `permissions.ts`, `enforceTenantOwnership.ts`, or
  `enforceTenantAdminBoundaries.ts`, run these first.
- **E2e**: `tests/e2e/multi-tenant.e2e.spec.ts`, the `Tenant-admin role`
  describe block (5 tests: nav visibility, own-tenant create succeeds,
  cross-tenant create rejected, tenant creation rejected, self-promotion
  rejected). Looks up whatever two tenants actually exist in the dev DB
  rather than assuming a specific slug, so it doesn't depend on seed
  data beyond "at least two tenants exist."

### A real, reproducible flake in this environment — read before you distrust a failure

Playwright e2e runs against the local dev server in this environment
have shown a genuine, intermittent race: `tests/helpers/login.ts`
performs a real browser login (fill form, submit, wait for the admin
dashboard to render), and immediately after, callers sometimes issue
`page.request.*` calls (e.g. in `test.beforeAll`) expecting those
requests to carry the session cookie the login just established. On a
slow/first-hit request, the `payload-token` cookie has occasionally not
yet landed in the browser context's cookie jar by the time `login()`
returns, so the very next `page.request` call goes out unauthenticated
and gets a 401/403 that looks like a permissions bug but isn't one.
`login()` now polls `page.context().cookies()` for the token before
returning (see the comment in `login.ts`) — this narrowed the window a
lot but didn't eliminate it entirely; a full 5-test run occasionally
still shows one `beforeAll`/`afterAll` login timing out on the
dashboard-visibility check itself (30s timeout), which cascades to
skipping the rest of that describe block.

**Two important things this is not:**

1. It is not new to this session — the wider e2e suite in this file
   (`Tenant isolation`, `Tenant creation is admin-only`) already had
   documented dependencies on backend latency before this work started.
2. It is not evidence the RBAC logic itself is wrong. Every time an e2e
   run hit this, the actual security-relevant behavior (own-tenant
   create allowed, cross-tenant create/tenant-create/self-promote all
   403) was independently re-verified with plain `curl` against the
   live dev server, bypassing Playwright/Chromium entirely, and matched
   expectations every single time. If you see an e2e failure here, reach
   for a curl repro (login → capture cookie → hit the endpoint) before
   assuming the access-control code regressed — it's the faster and
   more reliable way to tell environment flake from a real bug in this
   specific suite.

If you want to make this more robust rather than just re-running it: the
highest-leverage next step is probably reducing how many real browser
logins the `Tenant-admin role` describe block performs (it currently
logs in fresh — full page navigation, not just cookie reuse — in every
one of its 5 tests plus `beforeAll`/`afterAll`), e.g. by authenticating
once via `page.request.post('/api/users/login')` directly (no browser
navigation) for the API-only tests, and reserving the full browser
`login()` helper for the one test that actually needs to render
`/admin` (the nav-visibility check).

## Migration

`src/migrations/20260805_195923_add_tenant_admin_role.ts` renames the
`admin` enum value to `super_admin` and adds a new `admin` value back —
already applied to the dev database this was built against. If you're
setting up a fresh database, `npm run payload migrate` picks it up
normally. If you're pulling this into a database that was previously
running the old single-`admin`-role code in dev mode (schema auto-push),
read the migration file's own comments — it has a defensive check for
the case where dev-mode push already added the enum label independently
of the migration history, which is a known failure mode documented in
the README's [migrations troubleshooting section](README.md#troubleshooting-payload-migrate-hangs-with-zero-output).
