type LexicalNode = {
  children?: LexicalNode[]
  tag?: string
  text?: string
  type?: string
}

type LexicalRoot = {
  root?: {
    children?: LexicalNode[]
  }
}

export const slugify = (text: string): string =>
  text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')

export const extractText = (nodes?: LexicalNode[]): string => {
  if (!nodes) return ''

  return nodes
    .map((node) => {
      if (node.type === 'text') return node.text || ''
      return extractText(node.children)
    })
    .join('')
}

export type Heading = {
  id: string
  level: number
  text: string
}

export const extractHeadings = (data: LexicalRoot | null | undefined): Heading[] => {
  const nodes = data?.root?.children || []
  const headings: Heading[] = []
  const seenIds = new Map<string, number>()

  for (const node of nodes) {
    if (node.type !== 'heading' || !node.tag) continue

    const text = extractText(node.children).trim()
    if (!text) continue

    const level = Number(node.tag.replace('h', '')) || 2
    let id = slugify(text)

    const count = seenIds.get(id) || 0
    seenIds.set(id, count + 1)
    if (count > 0) id = `${id}-${count}`

    headings.push({ id, level, text })
  }

  return headings
}

export const estimateReadingTime = (data: LexicalRoot | null | undefined): number => {
  const text = extractText(data?.root?.children)
  const words = text.split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.ceil(words / 200))
}
