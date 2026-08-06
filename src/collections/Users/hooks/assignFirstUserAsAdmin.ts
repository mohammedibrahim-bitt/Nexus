import type { CollectionBeforeChangeHook } from 'payload'

// The very first user (created via Payload's "create first user" bootstrap flow)
// always becomes a super_admin, since no one else exists yet to grant that
// role, and no tenant exists yet for a tenant-scoped `admin` to belong to.
export const assignFirstUserAsAdmin: CollectionBeforeChangeHook = async ({
  data,
  operation,
  req: { payload },
}) => {
  if (operation === 'create') {
    const { totalDocs } = await payload.count({ collection: 'users' })

    if (totalDocs === 0) {
      data.role = 'super_admin'
    }
  }

  return data
}
