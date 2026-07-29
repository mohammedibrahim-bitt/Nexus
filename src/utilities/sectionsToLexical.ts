import type { Post } from '@/payload-types'

export type ContentSection = { heading: string; level: 2 | 3; paragraphs: string[] }
export type FaqItem = { answer: string; question: string }
export type ComparisonTable = { headers: string[]; rows: string[][] }

const textNode = (text: string) => ({
  type: 'text',
  detail: 0,
  format: 0,
  mode: 'normal',
  style: '',
  text,
  version: 1,
})

const linkNode = (text: string, url: string) => ({
  type: 'link',
  children: [textNode(text)],
  direction: 'ltr' as const,
  fields: {
    linkType: 'custom' as const,
    newTab: false,
    url,
  },
  format: '',
  indent: 0,
  version: 3,
})

const MARKDOWN_LINK = /\[([^\]]+)\]\(([^)]+)\)/g

// Splits a paragraph's plain text on any [anchor text](/url) markdown links
// (which the SEO Research Agent's AI writing step is instructed to produce
// for internal links) into a mix of plain text and real Lexical link nodes.
// Paragraphs with no markdown links are unaffected — a single text child, as
// before.
const paragraphChildren = (text: string) => {
  const children: ReturnType<typeof textNode | typeof linkNode>[] = []
  let lastIndex = 0

  for (const match of text.matchAll(MARKDOWN_LINK)) {
    const [full, anchorText, url] = match
    const index = match.index ?? 0

    if (index > lastIndex) children.push(textNode(text.slice(lastIndex, index)))
    children.push(linkNode(anchorText, url))
    lastIndex = index + full.length
  }

  if (lastIndex < text.length) children.push(textNode(text.slice(lastIndex)))

  return children.length > 0 ? children : [textNode(text)]
}

const paragraphNode = (text: string) => ({
  type: 'paragraph',
  children: paragraphChildren(text),
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

// Header/data cell states per @lexical/table's TableCellHeaderStates —
// NO_STATUS: 0, ROW: 1, COLUMN: 2, BOTH: 3.
const tableCellNode = (text: string, isHeader: boolean) => ({
  type: 'tablecell',
  children: [paragraphNode(text)],
  direction: 'ltr' as const,
  format: '',
  headerState: isHeader ? 1 : 0,
  indent: 0,
  version: 1,
})

const tableRowNode = (cells: string[], isHeaderRow: boolean) => ({
  type: 'tablerow',
  children: cells.map((cell) => tableCellNode(cell, isHeaderRow)),
  direction: 'ltr' as const,
  format: '',
  indent: 0,
  version: 1,
})

const tableNode = (table: ComparisonTable) => ({
  type: 'table',
  children: [
    tableRowNode(table.headers, true),
    ...table.rows.map((row) => tableRowNode(row, false)),
  ],
  direction: 'ltr' as const,
  format: '',
  indent: 0,
  version: 1,
})

/**
 * Converts a simple {heading, level, paragraphs}[] structure (plus an
 * optional FAQ list) into a Lexical document matching the Posts collection's
 * `content` field shape. Shared by the SEO Research Agent and the frontend
 * dashboard's simplified post editor — both work with this same plain
 * structure rather than raw Lexical nodes.
 */
export function sectionsToLexical(
  sections: ContentSection[],
  faq: FaqItem[] = [],
  comparisonTable?: ComparisonTable,
): Post['content'] {
  const children: Post['content']['root']['children'] = []

  sections.forEach((section, sectionIndex) => {
    if (section.heading) children.push(headingNode(section.level, section.heading))
    for (const paragraph of section.paragraphs) {
      if (paragraph.trim()) children.push(paragraphNode(paragraph))
    }

    // Placed right after the first section (the intro) — the conventional
    // "at a glance" position for a comparison table, before the reader
    // commits to reading the full breakdown.
    if (sectionIndex === 0 && comparisonTable && comparisonTable.headers.length > 0) {
      children.push(headingNode(2, 'At a Glance'))
      children.push(tableNode(comparisonTable))
    }
  })

  // No sections at all but a table was provided — still include it.
  if (sections.length === 0 && comparisonTable && comparisonTable.headers.length > 0) {
    children.push(headingNode(2, 'At a Glance'))
    children.push(tableNode(comparisonTable))
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
