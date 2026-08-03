import type { CollectionBeforeChangeHook } from 'payload'

// Self-registered accounts normally need to click a verification-email link
// before they can log in. Without a verified Resend domain, that email can
// only actually be delivered to the account owner's own address (see
// devSafeEmailAdapter) — so in local dev, every other signup would be
// permanently stuck unverified. Skip the requirement entirely outside
// production; the email adapter wrapper is the matching half of this.
export const autoVerifyInDev: CollectionBeforeChangeHook = async ({ data, operation }) => {
  if (operation === 'create' && process.env.NODE_ENV !== 'production') {
    data._verified = true
  }

  return data
}
