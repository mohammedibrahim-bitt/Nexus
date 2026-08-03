'use client'

import React, { useCallback, useState } from 'react'
import { Button, toast, useDocumentInfo, useFormFields } from '@payloadcms/ui'
import { useRouter } from 'next/navigation'

import './index.scss'

type FlaggedScript = { reason: string; snippet: string; src?: string }

/**
 * Clone controls: run/re-sync, preview, approve, or fall back to brand-only.
 *
 * Mirrors the server's gating so the admin isn't offered actions that would be
 * rejected — but the routes re-check everything themselves; this is only
 * convenience.
 */
export const ClonePanel: React.FC = () => {
  const { id } = useDocumentInfo()
  const router = useRouter()

  // Each call is a top-level hook — wrapping useFormFields in a helper would
  // violate the rules of hooks.
  const dnsVerified = useFormFields(([f]) => f?.dnsVerified?.value as boolean | undefined)
  const status = useFormFields(([f]) => f?.cloneStatus?.value as string | undefined)
  const mode = useFormFields(([f]) => f?.cloneMode?.value as string | undefined)
  const qaScore = useFormFields(([f]) => f?.qaScore?.value as number | undefined)
  const qaThreshold = useFormFields(([f]) => f?.qaThreshold?.value as number | undefined)
  const lastClonedAt = useFormFields(([f]) => f?.lastClonedAt?.value as string | undefined)
  const cloneLog = useFormFields(([f]) => f?.cloneLog?.value as string | undefined)
  const flaggedScripts = useFormFields(
    ([f]) => f?.flaggedScripts?.value as FlaggedScript[] | undefined,
  )

  const [busy, setBusy] = useState<null | string>(null)
  const [error, setError] = useState<null | string>(null)

  const call = useCallback(
    async (label: string, url: string, body: Record<string, unknown>) => {
      if (busy) return

      setBusy(label)
      setError(null)

      try {
        const res = await fetch(url, {
          body: JSON.stringify({ tenantId: id, ...body }),
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          method: 'POST',
        })
        const data = await res.json()

        if (!res.ok) {
          setError(data?.error || `${label} failed.`)
          toast.error(data?.error || `${label} failed.`)
          return
        }

        if (typeof data.qaScore === 'number') {
          toast.success(
            data.belowThreshold
              ? `Clone finished at ${data.qaScore}% — below threshold. ${data.recommendation}`
              : `Clone finished at ${data.qaScore}%. ${data.recommendation}`,
          )
        } else {
          toast.success(`${label} complete.`)
        }

        router.refresh()
      } catch (err) {
        const message = err instanceof Error ? err.message : `${label} failed.`
        setError(message)
        toast.error(message)
      } finally {
        setBusy(null)
      }
    },
    [busy, id, router],
  )

  if (!id) {
    return (
      <div className="clonePanel">
        <p className="clonePanel__blocked">Save this tenant before cloning its source site.</p>
      </div>
    )
  }

  // The server enforces this too — see the 403 in the clone route.
  if (!dnsVerified) {
    return (
      <div className="clonePanel">
        <p className="clonePanel__blocked">
          Cloning is blocked until domain ownership is verified above. This is enforced server-side,
          not just hidden here.
        </p>
      </div>
    )
  }

  const belowThreshold =
    typeof qaScore === 'number' && typeof qaThreshold === 'number' && qaScore < qaThreshold

  return (
    <div className="clonePanel">
      <div className="clonePanel__row">
        <span className="clonePanel__key">Status</span>
        <span className="clonePanel__value">{status || 'none'}</span>

        <span className="clonePanel__key">Mode</span>
        <span className="clonePanel__value">{mode || 'brand_only'}</span>

        <span className="clonePanel__key">Last clone</span>
        <span className="clonePanel__value">
          {lastClonedAt ? new Date(lastClonedAt).toLocaleString() : 'never'}
        </span>

        <span className="clonePanel__key">QA score</span>
        <span className="clonePanel__value">
          {typeof qaScore === 'number' ? `${qaScore}% (threshold ${qaThreshold ?? 85}%)` : '—'}
        </span>
      </div>

      {belowThreshold && (
        <div className="clonePanel__warning">
          Full clone quality is low — recommend falling back to brand-only mode, which applies just
          the source site’s colour, logo and fonts to the standard Nexus templates.
        </div>
      )}

      {cloneLog && (
        <details className="clonePanel__flagged">
          <summary>Clone log</summary>
          <code>{cloneLog}</code>
        </details>
      )}

      {Array.isArray(flaggedScripts) && flaggedScripts.length > 0 && (
        <details className="clonePanel__flagged">
          <summary>
            {flaggedScripts.length} script(s) kept for review — not deleted automatically
          </summary>
          {flaggedScripts.map((s, i) => (
            <code key={i}>
              {s.src ? `[${s.src}] ` : ''}
              {s.reason} — {s.snippet}
            </code>
          ))}
        </details>
      )}

      <div className="clonePanel__actions">
        <Button
          buttonStyle="secondary"
          disabled={Boolean(busy)}
          onClick={() => call('Clone', '/api/tenants/clone', {})}
          size="small"
        >
          {busy === 'Clone'
            ? 'Cloning… (this can take a minute)'
            : status === 'none'
              ? 'Clone site'
              : 'Re-sync clone'}
        </Button>

        {status === 'pending_review' && (
          <>
            <a
              className="btn btn--style-secondary btn--size-small"
              href={`/admin-preview/${id}`}
              rel="noopener noreferrer"
              target="_blank"
            >
              Preview
            </a>

            <Button
              buttonStyle="primary"
              disabled={Boolean(busy)}
              onClick={() =>
                call('Approve', '/api/tenants/clone/decide', { decision: 'approve' })
              }
              size="small"
            >
              {busy === 'Approve' ? 'Publishing…' : 'Approve & publish'}
            </Button>
          </>
        )}

        {(status === 'pending_review' || status === 'published') && (
          <Button
            buttonStyle="secondary"
            disabled={Boolean(busy)}
            onClick={() => call('Fallback', '/api/tenants/clone/decide', { decision: 'fallback' })}
            size="small"
          >
            {busy === 'Fallback' ? 'Switching…' : 'Use brand-only instead'}
          </Button>
        )}
      </div>

      {error && <p className="clonePanel__error">{error}</p>}
    </div>
  )
}
