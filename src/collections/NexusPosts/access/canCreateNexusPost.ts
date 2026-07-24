// Only staff who can actually write for Nexus — authors and admins — may
// submit a new post. Reviewers review; they don't draft.
export const canCreateNexusPost = ({ req }: any): boolean => {
  const user = req?.user
  return Boolean(
    user && user.collection === 'users' && (user.role === 'author' || user.role === 'admin'),
  )
}
