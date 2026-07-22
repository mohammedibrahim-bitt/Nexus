export type FeedItem = {
  contentHtml?: string
  description?: string
  guid?: string
  link?: string
  pubDate?: string
  title?: string
}

const decodeEntities = (text: string): string =>
  text
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#0*39;|&apos;/g, "'")
    .trim()

const extractTag = (block: string, tag: string): string | undefined => {
  const match = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'i'))
  return match ? decodeEntities(match[1]) : undefined
}

const extractAtomLink = (block: string): string | undefined => {
  // Atom uses a self-closing <link href="..." /> rather than a text node
  const match = block.match(/<link[^>]*href=["']([^"']+)["'][^>]*\/?>/i)
  return match ? match[1] : undefined
}

/**
 * Best-effort, tolerant RSS 2.0 / Atom parser using regex extraction rather
 * than a full XML parser — real-world feeds vary enough in namespacing and
 * encoding that a strict parser tends to reject feeds a browser reads fine.
 */
export const parseFeed = (xml: string): FeedItem[] => {
  const items: FeedItem[] = []

  const blocks = xml.match(/<item[^>]*>[\s\S]*?<\/item>|<entry[^>]*>[\s\S]*?<\/entry>/gi) || []

  for (const block of blocks) {
    const title = extractTag(block, 'title')
    const link = extractTag(block, 'link') || extractAtomLink(block)
    const description = extractTag(block, 'description') || extractTag(block, 'summary')
    const contentHtml =
      extractTag(block, 'content:encoded') || extractTag(block, 'content') || description
    const pubDate =
      extractTag(block, 'pubDate') || extractTag(block, 'published') || extractTag(block, 'updated')
    const guid = extractTag(block, 'guid') || extractTag(block, 'id') || link

    if (!title || !link) continue

    items.push({ contentHtml, description, guid, link, pubDate, title })
  }

  return items
}

/** Strips HTML tags down to plain paragraphs, for feeds with rich content. */
export const htmlToParagraphs = (html: string): string[] => {
  const withBreaks = html
    .replace(/<\/(p|div|h[1-6]|li|blockquote)>/gi, '\n\n')
    .replace(/<br\s*\/?>/gi, '\n')
  const text = withBreaks.replace(/<[^>]+>/g, '')
  const decoded = decodeEntities(text)

  return decoded
    .split(/\n{2,}/)
    .map((p) => p.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
}
