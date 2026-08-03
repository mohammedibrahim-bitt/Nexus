'use client'

import React, { useCallback, useState } from 'react'
import { Button, toast, useDocumentInfo, useFormFields } from '@payloadcms/ui'
import { useRouter } from 'next/navigation'

import './index.scss'

type CheckResponse = {
  checkedRecord?: string
  error?: string
  foundRecords?: string[]
  verified?: boolean
}

/**
 * Instructions + on-demand "Check now" for the DNS TXT ownership proof.
 *
 * Deliberately a manual recheck rather than a spinner that waits: propagation
 * takes minutes to hours, so a blocking wait would just time out. The button
 * hits the admin-only verify route, which is also the real enforcement point
 * — this panel is convenience, not security.
 */
export const DnsVerificationPanel: React.FC = () => {
  const { id } = useDocumentInfo()
  const router = useRouter()

  const sourceDomain = useFormFields(([fields]) => fields?.sourceDomain?.value as string | undefined)
  const token = useFormFields(
    ([fields]) => fields?.dnsVerificationToken?.value as string | undefined,
  )
  const verified = useFormFields(([fields]) => fields?.dnsVerified?.value as boolean | undefined)

  const [checking, setChecking] = useState(false)
  const [result, setResult] = useState<CheckResponse | null>(null)

  const onCheck = useCallback(async () => {
    if (checking || !id) return

    setChecking(true)
    setResult(null)

    try {
      const res = await fetch('/api/tenants/verify-dns', {
        body: JSON.stringify({ tenantId: id }),
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      })

      const data: CheckResponse = await res.json()
      setResult(data)

      if (data.verified) {
        toast.success('Domain verified — the clone pipeline is now unlocked for this tenant.')
        // Pull the persisted dnsVerified/dnsVerifiedAt back into the form.
        router.refresh()
      } else {
        toast.error(data.error || 'Not verified yet.')
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Verification request failed.'
      setResult({ error: message, verified: false })
      toast.error(message)
    } finally {
      setChecking(false)
    }
  }, [checking, id, router])

  if (!id) {
    return (
      <div className="dnsVerification">
        <p className="dnsVerification__instructions">
          Save this tenant first — the verification token is generated on creation.
        </p>
      </div>
    )
  }

  if (!sourceDomain) {
    return (
      <div className="dnsVerification">
        <p className="dnsVerification__instructions">
          Set a <strong>Brand Source URL</strong> above and save. The domain to verify is derived
          from it.
        </p>
      </div>
    )
  }

  return (
    <div className="dnsVerification">
      <div className="dnsVerification__status">
        <span
          className={`dnsVerification__dot dnsVerification__dot--${verified ? 'verified' : 'pending'}`}
        />
        {verified ? 'Domain verified' : 'Not verified yet'}
      </div>

      <p className="dnsVerification__instructions">
        To prove the client controls <strong>{sourceDomain}</strong>, have them add this TXT record
        at their DNS provider. Changes can take minutes to hours to propagate — use “Check now”
        once it’s published.
      </p>

      <div className="dnsVerification__record">
        <span className="dnsVerification__key">Type</span>
        <span className="dnsVerification__value">TXT</span>
        <span className="dnsVerification__key">Name</span>
        <span className="dnsVerification__value">_nexus-verify.{sourceDomain}</span>
        <span className="dnsVerification__key">Value</span>
        <span className="dnsVerification__value">{token || '(save to generate)'}</span>
      </div>

      <div className="dnsVerification__actions">
        <Button buttonStyle="secondary" disabled={checking} onClick={onCheck} size="small">
          {checking ? 'Checking…' : 'Check now'}
        </Button>

        {result && (
          <p
            className={`dnsVerification__result dnsVerification__result--${result.verified ? 'ok' : 'error'}`}
          >
            {result.verified ? 'TXT record matched.' : result.error}
          </p>
        )}
      </div>
    </div>
  )
}
