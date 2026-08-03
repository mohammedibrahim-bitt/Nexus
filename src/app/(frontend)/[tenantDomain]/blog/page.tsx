/**
 * `/blog` — the mount point for the Nexus blog inside a cloned shell.
 *
 * Re-exports the existing Posts listing so both `/posts` and `/blog` stay in
 * lockstep with a single implementation.
 *
 * NOTE: route segment config (`dynamic`, `revalidate`, …) must be declared
 * literally here — Next.js cannot statically analyse a re-exported value and
 * errors with "can't recognize the exported `dynamic` field".
 */
export const dynamic = 'force-dynamic'

export { default, generateMetadata } from '../posts/page'
