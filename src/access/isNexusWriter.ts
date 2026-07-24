export const NEXUS_WRITER_ROLES = ['admin', 'reviewer', 'user', 'author'] as const

export type NexusWriterRole = (typeof NEXUS_WRITER_ROLES)[number]

export const isNexusWriterRole = (role: string | null | undefined): role is NexusWriterRole =>
  role != null && (NEXUS_WRITER_ROLES as readonly string[]).includes(role)

export const isNexusWriter = ({ req }: { req: { user?: { collection?: string; role?: string } } }): boolean => {
  const user = req?.user
  return Boolean(user && user.collection === 'users' && isNexusWriterRole(user.role))
}
