import type { EmailAdapter } from 'payload'

/**
 * Wraps a real email adapter (Resend) so a sandboxed/unverified-domain
 * account doesn't break the app in local development.
 *
 * A Resend account without a verified domain rejects mail in more than one
 * way depending on the recipient — "only send to your own address" for real
 * domains, a separate "invalid `to` field" for blocklisted placeholder
 * domains like example.com, etc. Rather than chase each specific message,
 * this treats ANY send failure as non-fatal outside production: log it and
 * continue, so no email-provider hiccup can ever block signup/password-reset
 * locally. (autoVerifyInDev is the matching half of this — accounts don't
 * need the email's link at all in dev.)
 *
 * Production is untouched: this only wraps the adapter when
 * `NODE_ENV !== 'production'`, so verified-domain behavior in production is
 * exactly the underlying adapter's, unwrapped, with real failures still
 * throwing as normal.
 */
export const devSafeEmailAdapter = (realAdapter: EmailAdapter): EmailAdapter => {
  if (process.env.NODE_ENV === 'production') return realAdapter

  return (args) => {
    const initialized = realAdapter(args)

    return {
      ...initialized,
      sendEmail: async (message) => {
        try {
          return await initialized.sendEmail(message)
        } catch (err) {
          args.payload.logger.warn(
            `[email] Send failed in dev — continuing anyway instead of blocking the request. ` +
              `This is almost always a Resend sandbox limitation (no verified domain yet); see resend.com/domains to fix for real.\n` +
              `  Error: ${err instanceof Error ? err.message : String(err)}\n` +
              `  To: ${JSON.stringify(message.to)}\n` +
              `  Subject: ${message.subject}\n` +
              `  Body: ${typeof message.html === 'string' ? message.html : message.text}`,
          )

          return undefined
        }
      },
    }
  }
}
