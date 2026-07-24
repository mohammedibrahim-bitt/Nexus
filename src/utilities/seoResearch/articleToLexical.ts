import type { Post } from '@/payload-types'
import type { GeneratedArticle } from './writeArticle'

import { sectionsToLexical } from '../sectionsToLexical'

/**
 * Converts a GeneratedArticle's structured sections + FAQ into a Lexical
 * document. Thin wrapper over the shared sectionsToLexical helper, which is
 * also used by the frontend dashboard's post editor.
 */
export function articleToLexical(article: Pick<GeneratedArticle, 'faq' | 'sections'>): Post['content'] {
  return sectionsToLexical(article.sections, article.faq)
}
