'use client'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { MediaUploader, type UploadedMedia } from '@/components/MediaUploader'
import { useRouter } from 'next/navigation'
import React, { useEffect, useState } from 'react'

import { useStaffAuth } from '@/providers/StaffAuth'
import { lexicalToSections, sectionsToLexical } from '@/utilities/sectionsToLexical'

type Taxonomy = { id: string; title: string }

type SectionDraft = { body: string; heading: string; level: 2 | 3 }

const emptySection = (): SectionDraft => ({ body: '', heading: '', level: 2 })

export const PostEditorForm: React.FC<{ postId?: string }> = ({ postId }) => {
  const { staff } = useStaffAuth()
  const router = useRouter()

  const [loading, setLoading] = useState(Boolean(postId))
  const [title, setTitle] = useState('')
  const [heroImage, setHeroImage] = useState<null | UploadedMedia>(null)
  const [sections, setSections] = useState<SectionDraft[]>([emptySection()])
  const [allCategories, setAllCategories] = useState<Taxonomy[]>([])
  const [allTags, setAllTags] = useState<Taxonomy[]>([])
  const [categoryIds, setCategoryIds] = useState<string[]>([])
  const [tagIds, setTagIds] = useState<string[]>([])
  const [metaTitle, setMetaTitle] = useState('')
  const [metaDescription, setMetaDescription] = useState('')
  const [status, setStatus] = useState<'draft' | 'published'>('draft')
  const [reviewedBy, setReviewedBy] = useState<unknown>(null)

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<null | string>(null)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetch('/api/categories?limit=100&sort=title')
      .then((res) => res.json())
      .then((data) => setAllCategories(data.docs || []))
    fetch('/api/tags?limit=100&sort=title')
      .then((res) => res.json())
      .then((data) => setAllTags(data.docs || []))
  }, [])

  useEffect(() => {
    if (!postId) return

    fetch(`/api/posts/${postId}?depth=1&draft=true`, { credentials: 'include' })
      .then(async (res) => {
        if (!res.ok) throw new Error('Could not load this post.')
        return res.json()
      })
      .then((post) => {
        setTitle(post.title || '')
        setHeroImage(
          post.heroImage && typeof post.heroImage === 'object'
            ? { id: post.heroImage.id, url: post.heroImage.url }
            : null,
        )
        const loadedSections = lexicalToSections(post.content)
        setSections(
          loadedSections.length > 0
            ? loadedSections.map((s) => ({
                body: s.paragraphs.join('\n\n'),
                heading: s.heading,
                level: s.level,
              }))
            : [emptySection()],
        )
        setCategoryIds(
          (post.categories || []).map((c: { id: string } | string) =>
            String(typeof c === 'object' ? c.id : c),
          ),
        )
        setTagIds(
          (post.tags || []).map((t: { id: string } | string) => String(typeof t === 'object' ? t.id : t)),
        )
        setMetaTitle(post.meta?.title || '')
        setMetaDescription(post.meta?.description || '')
        setStatus(post._status === 'published' ? 'published' : 'draft')
        setReviewedBy(post.reviewedBy)
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Could not load this post.'))
      .finally(() => setLoading(false))
  }, [postId])

  const updateSection = (index: number, patch: Partial<SectionDraft>) => {
    setSections((prev) => prev.map((s, i) => (i === index ? { ...s, ...patch } : s)))
  }

  const removeSection = (index: number) => {
    setSections((prev) => prev.filter((_, i) => i !== index))
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!staff) return

    setSaving(true)
    setError(null)
    setSaved(false)

    try {
      const content = sectionsToLexical(
        sections
          .filter((s) => s.heading.trim() || s.body.trim())
          .map((s) => ({
            heading: s.heading,
            level: s.level,
            paragraphs: s.body
              .split(/\n\s*\n/)
              .map((p) => p.trim())
              .filter(Boolean),
          })),
      )

      const body: Record<string, unknown> = {
        title,
        categories: categoryIds,
        content,
        heroImage: heroImage?.id ?? null,
        meta: { description: metaDescription, title: metaTitle },
        tags: tagIds,
      }

      // Only stamp authors on create — never overwrite it on an edit, since
      // a post can have co-authors we shouldn't silently drop.
      if (!postId) body.authors = [staff.id]

      const res = await fetch(postId ? `/api/posts/${postId}` : '/api/posts', {
        body: JSON.stringify(body),
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        method: postId ? 'PATCH' : 'POST',
      })

      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.errors?.[0]?.message || 'Could not save this post.')
      }

      const saved = await res.json()
      const savedId = saved?.doc?.id ?? saved?.id ?? postId

      setSaved(true)
      if (!postId && savedId) {
        router.push(`/dashboard/posts/${savedId}/edit`)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save this post.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <p className="text-muted-foreground">Loading...</p>

  return (
    <form className="flex max-w-2xl flex-col gap-8" onSubmit={onSubmit}>
      {status === 'published' && (
        <p className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-700 dark:text-emerald-400">
          This post is published. Saving will update the live version.
        </p>
      )}
      {status === 'draft' && postId && !reviewedBy && (
        <p className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground shadow-[var(--shadow-card)]">
          This draft is waiting for a reviewer.
        </p>
      )}

      <div className="flex flex-col gap-1">
        <Label htmlFor="title">Title</Label>
        <Input id="title" onChange={(e) => setTitle(e.target.value)} required value={title} />
      </div>

      <MediaUploader label="Hero image" onChange={setHeroImage} value={heroImage} />

      <div className="flex flex-col gap-4">
        <span className="text-sm font-medium">Content</span>
        {sections.map((section, index) => (
          <div
            className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-[var(--shadow-card)]"
            key={index}
          >
            <div className="flex items-center gap-3">
              <Input
                onChange={(e) => updateSection(index, { heading: e.target.value })}
                placeholder="Section heading (optional)"
                value={section.heading}
              />
              <select
                className="h-9 rounded-md border border-border bg-background px-2 text-sm"
                onChange={(e) => updateSection(index, { level: Number(e.target.value) as 2 | 3 })}
                value={section.level}
              >
                <option value={2}>H2</option>
                <option value={3}>H3</option>
              </select>
              {sections.length > 1 && (
                <Button
                  onClick={() => removeSection(index)}
                  size="sm"
                  type="button"
                  variant="ghost"
                >
                  Remove
                </Button>
              )}
            </div>
            <Textarea
              onChange={(e) => updateSection(index, { body: e.target.value })}
              placeholder="Body text — leave a blank line between paragraphs"
              rows={5}
              value={section.body}
            />
          </div>
        ))}
        <Button
          className="self-start"
          onClick={() => setSections((prev) => [...prev, emptySection()])}
          type="button"
          variant="outline"
        >
          Add section
        </Button>
      </div>

      {allCategories.length > 0 && (
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium">Categories</span>
          <div className="flex flex-wrap gap-4">
            {allCategories.map((cat) => (
              <label className="flex items-center gap-2 text-sm" key={cat.id}>
                <Checkbox
                  checked={categoryIds.includes(cat.id)}
                  onCheckedChange={(checked) =>
                    setCategoryIds((prev) =>
                      checked ? [...prev, cat.id] : prev.filter((id) => id !== cat.id),
                    )
                  }
                />
                {cat.title}
              </label>
            ))}
          </div>
        </div>
      )}

      {allTags.length > 0 && (
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium">Tags</span>
          <div className="flex flex-wrap gap-4">
            {allTags.map((tag) => (
              <label className="flex items-center gap-2 text-sm" key={tag.id}>
                <Checkbox
                  checked={tagIds.includes(tag.id)}
                  onCheckedChange={(checked) =>
                    setTagIds((prev) => (checked ? [...prev, tag.id] : prev.filter((id) => id !== tag.id)))
                  }
                />
                {tag.title}
              </label>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4 shadow-[var(--shadow-card)]">
        <span className="text-sm font-medium">SEO</span>
        <div className="flex flex-col gap-1">
          <Label htmlFor="metaTitle">Meta title</Label>
          <Input id="metaTitle" onChange={(e) => setMetaTitle(e.target.value)} value={metaTitle} />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="metaDescription">Meta description</Label>
          <Textarea
            id="metaDescription"
            onChange={(e) => setMetaDescription(e.target.value)}
            rows={3}
            value={metaDescription}
          />
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
      {saved && <p className="text-sm text-emerald-600">Saved.</p>}

      <Button disabled={saving} type="submit">
        {saving ? 'Saving...' : 'Save draft'}
      </Button>
    </form>
  )
}
