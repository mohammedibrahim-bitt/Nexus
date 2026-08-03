import type { Metadata } from 'next'

import React from 'react'

import PageTemplate, { generateMetadata as pageMetadata } from './[slug]/page'
import { requireTenant } from '@/utilities/getTenant'
import {
  fetchShellHtml,
  injectBlogLink,
  prepareShellForServing,
  shouldServeShell,
} from '@/utilities/clone/serveShell'

type Args = { params: Promise<{ tenantDomain: string }> }

/**
 * Tenant root.
 *
 * A tenant whose clone is `published` renders that shell instead of the normal
 * Nexus home page. Every other status — including a `pending_review` shell
 * that already exists in storage — falls through to the standard templates, so
 * an unapproved clone can never appear live.
 */
export default async function TenantRoot({ params }: Args) {
  const { tenantDomain } = await params
  const tenant = await requireTenant(tenantDomain)

  if (shouldServeShell(tenant)) {
    const raw = await fetchShellHtml(tenant)

    if (raw) {
      const prepared = prepareShellForServing(raw, tenant.sourceUrl || '')
      const { html } = injectBlogLink(prepared)

      // The shell is a whole captured document, so it replaces the page
      // wholesale rather than rendering inside the Nexus layout.
      return <div dangerouslySetInnerHTML={{ __html: html }} suppressHydrationWarning />
    }
    // Storage unreachable — fall through to the normal templates rather than
    // serving a blank page.
  }

  return <PageTemplate params={params} />
}

export async function generateMetadata(args: Args): Promise<Metadata> {
  return pageMetadata(args)
}
