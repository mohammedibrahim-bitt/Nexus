import type { CollectionAfterReadHook } from 'payload'
import { User } from 'src/payload-types'

const getAvatarUrl = (user: User): string | undefined => {
  if (user.avatar && typeof user.avatar === 'object' && 'url' in user.avatar) {
    return user.avatar.url ?? undefined
  }
  return undefined
}

const toProfile = (user: User) => ({
  id: user.id,
  name: user.name,
  title: user.title,
  avatarUrl: getAvatarUrl(user),
  bio: user.bio,
  socialLinks: user.socialLinks,
})

// The `user` collection has access control locked so that users are not publicly accessible
// This means that we need to populate the authors manually here to protect user privacy
// GraphQL will not return mutated user data that differs from the underlying schema
// So we use an alternative `populatedAuthors` field to populate the user data, hidden from the admin UI
export const populateAuthors: CollectionAfterReadHook = async ({ doc, req, req: { payload } }) => {
  if (doc?.authors && doc?.authors?.length > 0) {
    const authorDocs: User[] = []

    for (const author of doc.authors) {
      try {
        const authorDoc = await payload.findByID({
          id: typeof author === 'object' ? author?.id : author,
          collection: 'users',
          depth: 1,
        })

        if (authorDoc) {
          authorDocs.push(authorDoc)
        }

        if (authorDocs.length > 0) {
          doc.populatedAuthors = authorDocs.map(toProfile)
        }
      } catch {
        // swallow error
      }
    }
  }

  if (doc?.reviewedBy) {
    try {
      const reviewerDoc = await payload.findByID({
        id: typeof doc.reviewedBy === 'object' ? doc.reviewedBy?.id : doc.reviewedBy,
        collection: 'users',
        depth: 1,
      })

      if (reviewerDoc) {
        doc.populatedReviewedBy = toProfile(reviewerDoc)
      }
    } catch {
      // swallow error
    }
  }

  return doc
}
