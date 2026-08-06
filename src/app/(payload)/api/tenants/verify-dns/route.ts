import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { headers as getHeaders } from 'next/headers'
import { NextResponse } from 'next/server'
import dns from 'dns'

import { DNS_VERIFY_SUBDOMAIN, flattenTxtRecords, txtRecordsMatchToken } from '@/collections/Tenants'

/**
 * Checks whether a tenant's source domain carries the TXT record proving the
 * client controls it, and records the result on the tenant.
 *
 * Called on demand from the admin UI ("Check now") rather than blocking on a
 * wait, because DNS propagation is minutes-to-hours — a synchronous wait would
 * either time out or lie.
 *
 * SECURITY: admin-only, re-checked here server-side. This is the gate the
 * clone pipeline depends on, so it must never trust the caller.
 */
export async function POST(request: Request) {
  const payload = await getPayload({ config: configPromise })
  const headers = await getHeaders()
  const { user } = await payload.auth({ headers })

  if (!user || user.collection !== 'users' || user.role !== 'super_admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  let tenantId: number | string | undefined
  try {
    const body = await request.json()
    tenantId = body?.tenantId
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (!tenantId) {
    return NextResponse.json({ error: 'A tenantId is required.' }, { status: 400 })
  }

  const tenant = await payload.findByID({
    id: tenantId,
    collection: 'tenants',
    depth: 0,
    disableErrors: true,
  })

  if (!tenant) {
    return NextResponse.json({ error: 'Tenant not found.' }, { status: 404 })
  }

  if (!tenant.sourceDomain) {
    return NextResponse.json(
      { error: 'Set a Brand Source URL on this tenant first — there is no domain to verify.' },
      { status: 400 },
    )
  }

  if (!tenant.dnsVerificationToken) {
    return NextResponse.json(
      { error: 'This tenant has no verification token. Re-save it to generate one.' },
      { status: 400 },
    )
  }

  const recordName = `${DNS_VERIFY_SUBDOMAIN}.${tenant.sourceDomain}`

  let records: string[][] = []
  try {
    records = await dns.promises.resolveTxt(recordName)
  } catch (err) {
    const code = (err as NodeJS.ErrnoException)?.code

    // ENOTFOUND/ENODATA are the normal "record isn't published (yet)" cases —
    // report them as an un-verified result, not a server error, since the
    // usual cause is propagation still in flight.
    const notPublished = code === 'ENOTFOUND' || code === 'ENODATA'

    await payload.update({
      id: tenant.id,
      collection: 'tenants',
      context: { disableRevalidate: true },
      data: { dnsVerified: false },
      overrideAccess: true,
    })

    return NextResponse.json({
      checkedRecord: recordName,
      error: notPublished
        ? `No TXT record found at ${recordName} yet. DNS changes can take minutes to hours to propagate — try again shortly.`
        : `DNS lookup failed: ${code || (err instanceof Error ? err.message : 'unknown error')}`,
      verified: false,
    })
  }

  const flattened = flattenTxtRecords(records)
  const matched = txtRecordsMatchToken(records, tenant.dnsVerificationToken)

  await payload.update({
    id: tenant.id,
    collection: 'tenants',
    context: { disableRevalidate: true },
    data: {
      dnsVerified: matched,
      ...(matched ? { dnsVerifiedAt: new Date().toISOString() } : {}),
    },
    // dnsVerified/dnsVerifiedAt are field-access-locked against manual edits,
    // so this server-side write is deliberately the one path allowed to set them.
    overrideAccess: true,
  })

  payload.logger.info(
    `[dns-verify] ${tenant.slug} (${recordName}) -> ${matched ? 'VERIFIED' : 'no match'}`,
  )

  return NextResponse.json({
    checkedRecord: recordName,
    foundRecords: flattened,
    verified: matched,
    ...(matched
      ? {}
      : {
          error: `Found ${flattened.length} TXT record(s) at ${recordName}, but none matched this tenant's token.`,
        }),
  })
}
