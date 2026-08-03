import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { headers as getHeaders } from 'next/headers'
import { NextResponse } from 'next/server'

import { runSeoResearch } from '@/utilities/seoResearch/runSeoResearch'

export async function POST(req: Request) {
  const payload = await getPayload({ config: configPromise })
  const headers = await getHeaders()
  const { user } = await payload.auth({ headers })

  if (!user || user.collection !== 'users') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Bring-your-own-keys: this feature has no shared/site-wide fallback key,
  // so every user runs it against their own SerpApi key and their own choice
  // of AI provider/key, set on their own profile. The Users collection's
  // afterRead field hook already decrypts these for the owning user, so they
  // arrive here as plaintext.
  const serpApiKey = user.serpApiKey
  const aiApiKey = user.aiApiKey
  const aiProvider = user.aiProvider

  if (!serpApiKey || !aiApiKey || !aiProvider) {
    return NextResponse.json(
      {
        error:
          'Add your own SerpApi key and an AI provider + API key on your dashboard profile page before running research.',
      },
      { status: 400 },
    )
  }

  let keyword: string | undefined
  let requestedTenantId: number | string | undefined
  try {
    const body = await req.json()
    keyword = typeof body?.keyword === 'string' ? body.keyword.trim() : undefined
    requestedTenantId = body?.tenantId
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  if (!keyword) {
    return NextResponse.json({ error: 'A keyword is required.' }, { status: 400 })
  }

  /*
   * Every run — and the draft post it produces — belongs to exactly one tenant.
   * Non-admins may only research for a tenant they're assigned to; an admin can
   * name any tenant explicitly (userHasAccessToAllTenants covers them).
   */
  const assignedTenantIds = (user.tenants || [])
    .map((row) => (typeof row.tenant === 'object' ? row.tenant?.id : row.tenant))
    .filter((id): id is number => typeof id === 'number')

  const tenantId: number | undefined =
    requestedTenantId !== undefined ? Number(requestedTenantId) : assignedTenantIds[0]

  if (requestedTenantId !== undefined && user.role !== 'admin' && !assignedTenantIds.includes(Number(requestedTenantId))) {
    return NextResponse.json({ error: 'You are not assigned to that tenant.' }, { status: 403 })
  }

  if (!tenantId) {
    return NextResponse.json(
      { error: 'No tenant is assigned to your account, so there is nowhere to file the draft.' },
      { status: 400 },
    )
  }

  const run = await payload.create({
    collection: 'seo-research-runs',
    data: { keyword, status: 'queued', tenant: tenantId, triggeredBy: user.id },
  })

  // Runs the pipeline in-process. This deployment runs on a long-lived Node
  // process (Docker), not a serverless function, so a multi-minute request
  // is acceptable — the admin UI polls the run doc's status rather than
  // blocking on this response, so a slow run doesn't hang the browser tab.
  runSeoResearch(payload, run.id, {
    aiApiKey,
    aiProvider,
    authorId: Number(user.id),
    serpApiKey,
    tenantId,
  }).catch((err) => {
    payload.logger.error(`[seoResearch] unhandled error for run ${run.id}: ${err}`)
  })

  return NextResponse.json({ runId: run.id })
}
