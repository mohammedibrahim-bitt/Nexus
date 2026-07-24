import { describe, expect, it } from 'vitest'

import { canCreateNexusPost } from '../../src/collections/NexusPosts/access/canCreateNexusPost'
import { isNexusWriterRole } from '../../src/access/isNexusWriter'

describe('Nexus writer roles', () => {
  it('includes admin, reviewer, user, and author', () => {
    expect(isNexusWriterRole('admin')).toBe(true)
    expect(isNexusWriterRole('reviewer')).toBe(true)
    expect(isNexusWriterRole('user')).toBe(true)
    expect(isNexusWriterRole('author')).toBe(true)
    expect(isNexusWriterRole(null)).toBe(false)
  })
})

describe('canCreateNexusPost', () => {
  it.each(['admin', 'reviewer', 'user', 'author'] as const)(
    'allows %s accounts to submit blogs',
    (role) => {
      expect(
        canCreateNexusPost({
          req: {
            user: {
              collection: 'users',
              id: `${role}-1`,
              role,
            },
          },
        }),
      ).toBe(true)
    },
  )

  it('blocks unsigned requests', () => {
    expect(canCreateNexusPost({ req: {} })).toBe(false)
  })
})
