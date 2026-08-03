/**
 * `/blog/[slug]` — post detail inside the cloned shell.
 *
 * Re-exports the existing Posts implementation, including its per-tenant
 * `generateStaticParams`, so there is one source of truth for post rendering.
 */
export { default, generateMetadata, generateStaticParams } from '../../posts/[slug]/page'
