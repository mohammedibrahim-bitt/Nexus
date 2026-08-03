import type { CollectionAfterLoginHook } from 'payload'

// Powers the "active users" stat on the admin dashboard — Payload doesn't
// track login activity out of the box, so this stamps it ourselves.
//
// Intentionally not awaited: this is a best-effort side update, and a slow
// or failed write here (e.g. a DB timeout) must never block or fail the
// actual login response.
export const trackLastLogin: CollectionAfterLoginHook = async ({ req: { payload }, user }) => {
  payload
    .update({
      id: user.id,
      collection: 'users',
      context: { disableRevalidate: true },
      data: { lastLoginAt: new Date().toISOString() },
    })
    .catch((err) => {
      payload.logger.error({ err, msg: 'trackLastLogin: failed to record last login' })
    })

  return user
}
