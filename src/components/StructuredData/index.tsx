import React from 'react'

/**
 * Renders a JSON-LD structured-data block. Content is serialized with
 * JSON.stringify (safe against tag injection since `<` is escaped below)
 * and marked up for search engines only — never visible to users.
 */
export const StructuredData: React.FC<{ data: Record<string, unknown> }> = ({ data }) => (
  <script
    dangerouslySetInnerHTML={{
      __html: JSON.stringify(data).replace(/</g, '\\u003c'),
    }}
    type="application/ld+json"
  />
)
