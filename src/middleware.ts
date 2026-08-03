import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Import only from the leaf constants module — anything that reaches
// payload.config.ts pulls Node builtins into the Edge bundle and fails to build.
import { APEX_HOSTS, DEFAULT_TENANT_SLUG, RESERVED_SUBDOMAINS } from '@/utilities/tenantConstants'

/**
 * Maps `{tenant}.{domain}/path` onto the `/[tenantDomain]/path` route segment
 * under src/app/(frontend), so every page receives its tenant as a route param
 * rather than having to read the Host header itself.
 *
 * A rewrite (not a redirect) — the visitor's URL stays on the subdomain.
 *
 * This resolves the label syntactically and does NOT check that the tenant
 * exists; a bad subdomain rewrites to a segment whose data fetches return
 * nothing and render notFound(). Validating here would mean a database round
 * trip on literally every request, including static assets.
 */

const RESERVED = new Set(RESERVED_SUBDOMAINS)

function tenantFromHost(host: string): string {
  const hostname = host.split(':')[0].toLowerCase()

  if (APEX_HOSTS.has(hostname)) return DEFAULT_TENANT_SLUG

  const labels = hostname.split('.')

  // `example.com` / `localhost` — no label left over for a tenant.
  // `acme.localhost` has two labels and IS a tenant, so localhost is special-cased.
  const isLocal = labels[labels.length - 1] === 'localhost'
  const minLabels = isLocal ? 2 : 3

  if (labels.length < minLabels) return DEFAULT_TENANT_SLUG

  const candidate = labels[0]

  return RESERVED.has(candidate) ? DEFAULT_TENANT_SLUG : candidate
}

export function middleware(request: NextRequest) {
  const host = request.headers.get('host') || ''
  const tenant = tenantFromHost(host)
  const { pathname, search } = request.nextUrl

  // Already rewritten (or a direct hit on the segment) — don't double-prefix.
  if (pathname.startsWith(`/${tenant}/`) || pathname === `/${tenant}`) {
    return NextResponse.next()
  }

  return NextResponse.rewrite(new URL(`/${tenant}${pathname}${search}`, request.url))
}

export const config = {
  /*
   * Skip everything that isn't a tenant page:
   *  - admin, api        Payload's own surfaces, under src/app/(payload)
   *  - next              live-preview / seed routes kept at the group root
   *  - og                OG image endpoint, referenced by absolute URL
   *  - _next, static     framework and asset paths
   *  - favicon/robots…   root-level files that must resolve at the apex
   */
  matcher: [
    '/((?!admin|api|next|og|_next/static|_next/image|favicon\\.ico|favicon\\.svg|robots\\.txt|sitemap.*\\.xml|media|.*\\..*).*)',
  ],
}
