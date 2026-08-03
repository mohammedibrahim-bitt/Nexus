/**
 * Tenant constants with NO imports, deliberately.
 *
 * `src/middleware.ts` runs in the Edge Runtime, which can't load Node builtins
 * (`path`, `url`, `crypto`) or native deps like sharp. Importing these from
 * `getTenant.ts` would drag the whole Payload config into the middleware
 * bundle and break the build, so they live in their own leaf module that both
 * the Edge middleware and the Node-side utilities can safely import.
 */

/**
 * The tenant representing the original, pre-multi-tenancy site. The migration
 * backfilled every existing row to it, and it's the fallback when a request
 * can't be attributed to a subdomain (e.g. plain `localhost:3000`).
 */
export const DEFAULT_TENANT_SLUG = 'default'

/** Hosts that never carry a tenant label. */
export const APEX_HOSTS = new Set(['localhost', '127.0.0.1', '0.0.0.0'])

/** Subdomains reserved for first-party surfaces rather than tenants. */
export const RESERVED_SUBDOMAINS = ['www', 'admin', 'api', 'app', 'static', 'assets']
