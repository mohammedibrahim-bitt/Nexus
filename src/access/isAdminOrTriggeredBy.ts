import type { Access } from 'payload'

/**
 * Admins can see every SEO research run. Everyone else can only see/manage
 * the runs they personally triggered — each run is tied to whoever's own
 * API keys paid for it.
 */
export const isAdminOrTriggeredBy: Access = ({ req: { user } }) => {
  if (!user || user.collection !== 'users') return false
  if (user.role === 'admin') return true

  return {
    triggeredBy: {
      equals: user.id,
    },
  }
}
