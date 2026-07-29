import type { CollectionBeforeChangeHook } from 'payload'

// The submitting user is always the author of record — never trust a
// client-supplied value here, otherwise anyone could attribute a post to
// someone else.
export const setAuthorOnCreate: CollectionBeforeChangeHook = ({ data, operation, req }) => {
  if (operation === 'create' && req.user) {
    data.author = req.user.id
  }
  return data
}
