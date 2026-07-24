import type { CollectionAfterLoginHook } from 'payload'

// Powers the "active users" stat on the admin dashboard — Payload doesn't
// track login activity out of the box, so this stamps it ourselves.
export const trackLastLogin: CollectionAfterLoginHook = async ({ req: { payload }, user }) => {
  await payload.update({
    id: user.id,
    collection: 'users',
    context: { disableRevalidate: true },
    data: { lastLoginAt: new Date().toISOString() },
  })

  return user
}
