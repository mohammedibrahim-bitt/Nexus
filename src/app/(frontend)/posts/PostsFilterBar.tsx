'use client'

import { SearchIcon } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import React, { useEffect, useRef, useState } from 'react'

import { useDebounce } from '@/utilities/useDebounce'

type Category = { slug: string; title: string }

export const PostsFilterBar: React.FC<{ categories: Category[] }> = ({ categories }) => {
  const router = useRouter()
  const searchParams = useSearchParams()

  const urlQuery = searchParams.get('q') || ''
  const currentCategory = searchParams.get('category') || ''
  const currentTag = searchParams.get('tag') || ''

  const [query, setQuery] = useState(urlQuery)
  const debouncedQuery = useDebounce(query, 350)
  const lastPushedQuery = useRef(urlQuery)

  const pushParams = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString())

    for (const [key, value] of Object.entries(updates)) {
      if (value) params.set(key, value)
      else params.delete(key)
    }

    router.push(`/posts${params.toString() ? `?${params.toString()}` : ''}`)
  }

  // If the URL's q changes for a reason other than our own debounced push
  // (e.g. the category filter or "Clear all" changed it), resync the input.
  useEffect(() => {
    if (urlQuery !== lastPushedQuery.current) {
      setQuery(urlQuery)
      lastPushedQuery.current = urlQuery
    }
  }, [urlQuery])

  useEffect(() => {
    if (debouncedQuery !== urlQuery) {
      lastPushedQuery.current = debouncedQuery
      pushParams({ q: debouncedQuery || null })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQuery])

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="relative flex-1">
        <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          className="w-full rounded-md border border-border bg-background py-2 pr-3 pl-9 text-sm outline-none focus:ring-2 focus:ring-ring"
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search posts..."
          type="text"
          value={query}
        />
      </div>

      <select
        className="rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring sm:w-56"
        onChange={(e) => pushParams({ category: e.target.value || null })}
        value={currentCategory}
      >
        <option value="">All categories</option>
        {categories.map((category) => (
          <option key={category.slug} value={category.slug}>
            {category.title}
          </option>
        ))}
      </select>

      {currentTag && (
        <button
          className="rounded-md border border-border px-3 py-2 text-sm text-muted-foreground hover:bg-muted"
          onClick={() => pushParams({ tag: null })}
          type="button"
        >
          Tag: #{currentTag} ✕
        </button>
      )}
    </div>
  )
}
