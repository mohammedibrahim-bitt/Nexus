import { isNexusWriter } from '../../../access/isNexusWriter'

// Admins, reviewers, and signed-in users may submit a new post for review.
export const canCreateNexusPost = ({ req }: any): boolean => isNexusWriter({ req })
