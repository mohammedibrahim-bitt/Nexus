import React from 'react'

/**
 * Minimal shell for the clone preview.
 *
 * Deliberately its own route group rather than living under `(payload)`:
 * Payload's admin layout enforces `access.admin` and throws `Forbidden` for a
 * logged-in non-admin, which surfaces as a 500 before the page's own check can
 * return a clean 404. Isolating it here means the page owns its access control
 * outright — and it stays out of the tenant middleware because the path starts
 * with `admin`.
 *
 * No global stylesheet on purpose: the preview renders third-party markup in a
 * sandboxed iframe, and the site's own CSS would only interfere.
 */
export default function ClonePreviewLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  )
}
