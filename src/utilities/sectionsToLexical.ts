import type { Post } from '@/payload-types'

export type ContentSection = { heading: string; level: 2 | 3; paragraphs: string[] }
export type FaqItem = { answer: string; question: string }

const textNode = (text: string) => ({
  type: 'text',
  detail: 0,
  format: 0,
  mode: 'normal',
  style: '',
  text,
  version: 1,
})

const paragraphNode = (text: string) => ({
  type: 'paragraph',
  children: [textNode(text)],
  direction: 'ltr' as const,
  format: '',
  indent: 0,
  textFormat: 0,
  version: 1,
})

const headingNode = (level: 2 | 3, text: string) => ({
  type: 'heading',
  children: [textNode(text)],
  direction: 'ltr' as const,
  format: '',
  indent: 0,
  tag: `h${level}` as const,
  version: 1,
})

/**
 * Converts a simple {heading, level, paragraphs}[] structure (plus an
 * optional FAQ list) into a Lexical document matching the Posts collection's
 * `content` field shape. Shared by the SEO Research Agent and the frontend
 * dashboard's simplified post editor — both work with this same plain
 * structure rather than raw Lexical nodes.
 */
export function sectionsToLexical(sections: ContentSection[], faq: FaqItem[] = []): Post['content'] {
  const children: Post['content']['root']['children'] = []

  for (const section of sections) {
    if (section.heading) children.push(headingNode(section.level, section.heading))
    for (const paragraph of section.paragraphs) {
      if (paragraph.trim()) children.push(paragraphNode(paragraph))
    }
  }

  if (faq.length > 0) {
    children.push(headingNode(2, 'Frequently Asked Questions'))
    for (const item of faq) {
      children.push(headingNode(3, item.question))
      children.push(paragraphNode(item.answer))
    }
  }

  return {
    root: {
      type: 'root',
      children,
      direction: 'ltr' as const,
      format: '',
      indent: 0,
      version: 1,
    },
  }
}

/**
 * Reverses sectionsToLexical, best-effort — used by the dashboard editor to
 * load an existing post's content back into the simple sections form. Only
 * understands heading/paragraph nodes (what the simple editor itself
 * produces); anything richer (lists, embedded blocks, inline formatting)
 * still round-trips as plain paragraph text rather than being dropped.
 */
export function lexicalToSections(content: null | Post['content'] | undefined): ContentSection[] {
  const nodes = content?.root?.children as Array<Record<string, unknown>> | undefined
  if (!nodes || nodes.length === 0) return []

  const extractText = (node: Record<string, unknown>): string => {
    if (node.type === 'text') return String(node.text || '')
    const children = (node.children as Array<Record<string, unknown>> | undefined) || []
    return children.map(extractText).join('')
  }

  const sections: ContentSection[] = []
  let current: ContentSection | null = null

  for (const node of nodes) {
    if (node.type === 'heading') {
      const level = node.tag === 'h3' ? 3 : 2
      current = { heading: extractText(node), level, paragraphs: [] }
      sections.push(current)
      continue
    }

    const text = extractText(node)
    if (!text.trim()) continue

    if (!current) {
      current = { heading: '', level: 2, paragraphs: [] }
      sections.push(current)
    }
    current.paragraphs.push(text)
  }

  return sections
}
