import { describe, expect, it } from 'vitest'

import { canUpdateNexusPost } from '../../src/collections/NexusPosts/access/canUpdateNexusPost'

describe('canUpdateNexusPost', () => {
  it('allows reviewers to update pending posts so they can approve or reject them', () => {
    const result = canUpdateNexusPost({
      req: {
        user: {
          collection: 'users',
          id: 'reviewer-1',
          role: 'reviewer',
        },
      },
    })

    expect(result).toEqual({
      and: [{ status: { equals: 'pending' } }],
    })
  })
})
