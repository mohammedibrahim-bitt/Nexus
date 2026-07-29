import configPromise from '@payload-config'
import { getPayload } from 'payload'
import React from 'react'

import { PostReviewsClient } from './index.client'

export const PostReviews: React.FC<{ postId: number | string }> = async ({ postId }) => {
  const payload = await getPayload({ config: configPromise })

  const { docs: reviews } = await payload.find({
    collection: 'reviews',
    depth: 1,
    limit: 100,
    sort: '-createdAt',
    where: {
      and: [
        {
          post: {
            equals: postId,
          },
        },
        {
          approved: {
            equals: true,
          },
        },
      ],
    },
  })

  const initialReviews = reviews.map((review) => ({
    id: String(review.id),
    comment: review.comment,
    createdAt: review.createdAt,
    reviewerName:
      (review.customer && typeof review.customer === 'object' ? review.customer.name : null) ||
      'A reader',
    rating: review.rating,
  }))

  return <PostReviewsClient initialReviews={initialReviews} postId={String(postId)} />
}
