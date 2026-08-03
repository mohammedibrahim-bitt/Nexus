'use client'

import { Loader2, SearchIcon, X } from 'lucide-react'
import Link from 'next/link'
import React, { useEffect, useRef, useState } from 'react'

import { useDebounce } from '@/utilities/useDebounce'
import { getMediaUrl } from '@/utilities/getMediaUrl'

type Result = {
  id: number | string
  meta?: {
    description?: string
    image?: { url?: string } | null
  } | null
  slug: string
  title: string
}

export const QuickSearch: React.FC = () => {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Result[]>([])
  const [loading, setLoading] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const debouncedQuery = useDebounce(query, 250)

  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    const onEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }

    document.addEventListener('mousedown', onClickOutside)
    document.addEventListener('keydown', onEscape)
    return () => {
      document.removeEventListener('mousedown', onClickOutside)
      document.removeEventListener('keydown', onEscape)
    }
  }, [])

  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setResults([])
      setLoading(false)
      return
    }

    const controller = new AbortController()
    setLoading(true)

    const params = new URLSearchParams({
      limit: '5',
      'where[or][0][title][like]': debouncedQuery,
      'where[or][1][meta.description][like]': debouncedQuery,
      'where[or][2][slug][like]': debouncedQuery,
    })

    fetch(`/api/search?${params.toString()}`, { signal: controller.signal })
      .then((res) => res.json())
      .then((data) => setResults(data?.docs || []))
      .catch(() => {})
      .finally(() => setLoading(false))

    return () => controller.abort()
  }, [debouncedQuery])

  return (
    <div className="relative" ref={containerRef}>
      <button
        aria-label="Search"
        className="flex size-9 items-center justify-center rounded-full text-foreground/80 transition-colors hover:bg-muted hover:text-foreground"
        onClick={() => setOpen((v) => !v)}
        type="button"
      >
        <SearchIcon className="size-5" />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-3 w-[22rem] max-w-[90vw] rounded-lg border border-border bg-background text-foreground shadow-lg">
          <form
            className="flex items-center gap-2 border-b border-border p-3"
            onSubmit={(e) => e.preventDefault()}
          >
            <SearchIcon className="size-4 shrink-0 text-muted-foreground" />
            <input
              autoComplete="off"
              className="w-full bg-transparent text-sm outline-none"
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search posts..."
              ref={inputRef}
              value={query}
            />
            {loading && <Loader2 className="size-4 shrink-0 animate-spin text-muted-foreground" />}
            {!loading && query && (
              <button
                aria-label="Clear search"
                onClick={() => setQuery('')}
                type="button"
              >
                <X className="size-4 shrink-0 text-muted-foreground" />
              </button>
            )}
          </form>

          {query.trim() && (
            <div className="max-h-[24rem] overflow-y-auto">
              {results.length === 0 && !loading && (
                <p className="p-4 text-sm text-muted-foreground">No results found.</p>
              )}

              {results.map((result) => {
                const imageUrl = result.meta?.image?.url ? getMediaUrl(result.meta.image.url) : null

                return (
                  <Link
                    className="flex items-center gap-3 border-b border-border p-3 last:border-b-0 hover:bg-muted"
                    href={`/posts/${result.slug}`}
                    key={result.id}
                    onClick={() => setOpen(false)}
                  >
                    {imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        alt=""
                        className="size-10 shrink-0 rounded object-cover"
                        src={imageUrl}
                      />
                    ) : (
                      <div className="size-10 shrink-0 rounded bg-muted" />
                    )}
                    <span className="line-clamp-2 text-sm font-medium">{result.title}</span>
                  </Link>
                )
              })}

              {results.length > 0 && (
                <Link
                  className="block p-3 text-center text-sm font-medium text-primary hover:underline"
                  href={`/search?q=${encodeURIComponent(query)}`}
                  onClick={() => setOpen(false)}
                >
                  View all results for &ldquo;{query}&rdquo;
                </Link>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
