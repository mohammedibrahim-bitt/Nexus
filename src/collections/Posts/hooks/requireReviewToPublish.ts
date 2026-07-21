import type { CollectionBeforeChangeHook } from 'payload'
import { APIError } from 'payload'

// Drafts can be saved freely, but a post can only move to "published" once
// it has a reviewer assigned, and that reviewer must actually hold the
// "admin" or "reviewer" role (enforced here in case the relationship still
// points at a stale value from before someone's role was changed).
export const requireReviewToPublish: CollectionBeforeChangeHook = async ({
  data,
  originalDoc,
  req: { payload },
}) => {
  const nextStatus = data._status ?? originalDoc?._status
  const reviewedBy = data.reviewedBy ?? originalDoc?.reviewedBy

  if (nextStatus !== 'published') {
    return data
  }

  if (!reviewedBy) {
    throw new APIError(
      'This post cannot be published until it has a reviewer set in "Reviewed By".',
      400,
    )
  }

  const reviewerId = typeof reviewedBy === 'object' ? reviewedBy.id : reviewedBy
  const reviewer = await payload.findByID({
    id: reviewerId,
    collection: 'users',
    depth: 0,
  })

  if (!reviewer || (reviewer.role !== 'admin' && reviewer.role !== 'reviewer')) {
    throw new APIError(
      'The user set as "Reviewed By" must have the reviewer or admin role.',
      400,
    )
  }

  return data
}
