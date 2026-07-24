'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, Check, Loader2, Pencil, ShieldCheck, Trash2, X } from 'lucide-react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import React, { useEffect, useState } from 'react'

import { postsApi, toNexusBlog, type NexusBlog } from '@/nexus/api'
import { useNexus } from '@/nexus/NexusProvider'
import { Reveal } from '@/nexus/Reveal'

export default function BlogPage() {
  const { id } = useParams<{ id: string }>()
  const { tr, lang, role, currentUser } = useNexus()
  const router = useRouter()

  const [blog, setBlog] = useState<NexusBlog | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deciding, setDeciding] = useState(false)
  const [form, setForm] = useState({ title: '', description: '', content: '', references: '' })

  useEffect(() => {
    let cancelled = false
    postsApi.get(id).then((res) => {
      if (cancelled) return
      if (!res.ok) {
        setNotFound(true)
        return
      }
      setBlog(toNexusBlog(res.data))
    })
    return () => {
      cancelled = true
    }
  }, [id])

  if (notFound) {
    return (
      <div className="py-20 text-center text-nx-muted">
        <p>{tr('notFoundBlog')}</p>
        <Link href="/" className="mt-4 inline-block font-medium text-(--nx-accent)">
          {tr('backToMain')}
        </Link>
      </div>
    )
  }

  if (!blog) {
    return (
      <div className="flex items-center justify-center gap-2 py-24 text-sm text-nx-muted">
        <Loader2 size={16} className="animate-spin" />
        {tr('loading')}
      </div>
    )
  }

  const status = blog.status
  const reviewing = (role === 'admin' || role === 'reviewer') && status === 'pending'
  const backHref =
    status === 'pending' && (role === 'author' || role === 'user')
      ? '/nexus/write'
      : status === 'pending' && role === 'reviewer'
        ? '/nexus/review'
        : status === 'pending' && role === 'admin'
          ? '/nexus/admin'
          : '/'
  const canEdit =
    (role === 'admin' && status !== 'approved') ||
    (role === 'reviewer' && status === 'pending') ||
    ((role === 'author' || role === 'user') &&
      status === 'pending' &&
      blog.authorId != null &&
      currentUser != null &&
      blog.authorId === String(currentUser.id))
  const canDelete = role === 'admin' && status === 'approved'

  const startEditing = () => {
    setForm({
      title: blog.title[lang],
      description: blog.description[lang],
      content: blog.content[lang].join('\n\n'),
      references: blog.references.join('\n'),
    })
    setSaved(false)
    setEditing(true)
  }

  const saveEdits = async () => {
    setSaving(true)
    const patch: Record<string, unknown> = {
      references: form.references
        .split('\n')
        .map((r) => r.trim())
        .filter(Boolean)
        .map((value) => ({ value })),
    }
    if (lang === 'ar') {
      patch.titleAr = form.title.trim()
      patch.descriptionAr = form.description.trim()
      patch.contentAr = form.content.trim()
    } else {
      patch.titleEn = form.title.trim()
      patch.descriptionEn = form.description.trim()
      patch.contentEn = form.content.trim()
    }
    const res = await postsApi.update(blog.id, patch)
    setSaving(false)
    if (!res.ok) return
    setBlog(toNexusBlog(res.data.doc))
    setEditing(false)
    setSaved(true)
  }

  const decide = async (next: 'approved' | 'rejected') => {
    setDeciding(true)
    const res = await postsApi.decide(blog.id, next)
    setDeciding(false)
    if (!res.ok) return
    router.push(role === 'reviewer' ? '/nexus/review' : '/nexus/admin')
  }

  const confirmDelete = async () => {
    setDeleting(true)
    const res = await postsApi.remove(blog.id)
    setDeleting(false)
    if (!res.ok) return
    router.push('/nexus')
  }

  return (
    <article className="mx-auto flex max-w-2xl flex-col gap-10">
      <Reveal>
        <Link
          href={backHref}
          aria-label={tr('backToMain')}
          className="flex h-9 w-9 items-center justify-center rounded-full text-nx-muted transition-colors hover:bg-nx-surface-2 hover:text-(--nx-accent)"
        >
          <ArrowLeft size={18} className="rtl:rotate-180" />
        </Link>
      </Reveal>

      {reviewing && !editing && (
        <Reveal>
          <div className="flex items-center gap-3 rounded-nx border border-(--nx-accent) bg-nx-surface px-4 py-3 text-sm text-nx-text">
            <ShieldCheck size={18} className="shrink-0 text-(--nx-accent)" />
            {tr('decisionBanner')}
          </div>
        </Reveal>
      )}

      {canEdit && (
        <Reveal>
          <div className="flex items-center justify-between gap-3">
            <AnimatePresence>
              {saved && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="text-sm font-medium text-emerald-600 dark:text-emerald-400"
                >
                  {tr('saved')}
                </motion.p>
              )}
            </AnimatePresence>
            {!editing && (
              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={startEditing}
                className="ms-auto flex items-center gap-2 rounded-nx border border-nx-border bg-nx-surface px-4 py-2 text-sm font-medium text-nx-text transition-colors hover:bg-nx-surface-2"
              >
                <Pencil size={15} className="text-(--nx-accent)" />
                {tr('edit')}
              </motion.button>
            )}
          </div>
        </Reveal>
      )}

      {editing ? (
        <Reveal>
          <div className="nx-card nx-space flex flex-col gap-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-nx-text">{tr('editBlog')}</h2>
              <span className="text-xs text-nx-muted">
                {tr(lang === 'ar' ? 'editingArabic' : 'editingEnglish')}
              </span>
            </div>

            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-semibold text-nx-text">{tr('fieldTitle')}</span>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                className="h-11 rounded-[calc(var(--nx-radius)*0.6)] border border-nx-border bg-nx-surface-2 px-4 text-nx-text outline-none focus:ring-2 focus:ring-(--nx-accent)"
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-semibold text-nx-text">{tr('fieldDescription')}</span>
              <textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                rows={2}
                className="resize-y rounded-[calc(var(--nx-radius)*0.6)] border border-nx-border bg-nx-surface-2 px-4 py-2.5 text-sm text-nx-text outline-none focus:ring-2 focus:ring-(--nx-accent)"
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-semibold text-nx-text">{tr('fieldContent')}</span>
              <textarea
                value={form.content}
                onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
                rows={10}
                className="resize-y rounded-[calc(var(--nx-radius)*0.6)] border border-nx-border bg-nx-surface-2 px-4 py-2.5 text-sm leading-relaxed text-nx-text outline-none focus:ring-2 focus:ring-(--nx-accent)"
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-semibold text-nx-text">{tr('fieldReferences')}</span>
              <textarea
                value={form.references}
                onChange={(e) => setForm((f) => ({ ...f, references: e.target.value }))}
                rows={4}
                className="resize-y rounded-[calc(var(--nx-radius)*0.6)] border border-nx-border bg-nx-surface-2 px-4 py-2.5 text-sm text-nx-text outline-none focus:ring-2 focus:ring-(--nx-accent)"
              />
            </label>

            <div className="flex gap-3">
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={saveEdits}
                disabled={!form.title.trim() || saving}
                className="flex flex-1 items-center justify-center gap-2 rounded-nx bg-(--nx-accent) px-5 py-3 font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {saving ? <Loader2 size={17} className="animate-spin" /> : <Check size={17} />}
                {tr('save')}
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => setEditing(false)}
                className="flex flex-1 items-center justify-center gap-2 rounded-nx border border-nx-border bg-nx-surface px-5 py-3 font-semibold text-nx-text transition-colors hover:bg-nx-surface-2"
              >
                {tr('cancel')}
              </motion.button>
            </div>
          </div>
        </Reveal>
      ) : (
        <>
          {/* Title — top center */}
          <Reveal as="header">
            <div className="flex flex-col items-center gap-3 text-center">
              <span className="text-xs font-medium tracking-wide text-nx-muted uppercase">
                {blog.tag[lang]} · {blog.createdAt} · {blog.readMinutes} {tr('minRead')}
              </span>
              <h1 className="text-3xl font-bold tracking-tight text-nx-text sm:text-4xl">
                {blog.title[lang]}
              </h1>
              <p className="text-sm text-nx-muted">
                {blog.author
                  ? `${tr('writtenBy')} ${blog.author}`
                  : `${tr('generatedBy')} ${blog.model}`}
              </p>
            </div>
          </Reveal>

          {/* Content — middle */}
          <div className="flex flex-col gap-6">
            {blog.content[lang].map((para, i) => (
              <Reveal key={i} delay={i === 0 ? 0.1 : 0}>
                <p className="text-[1.05rem] leading-8 text-nx-text/90">{para}</p>
              </Reveal>
            ))}
          </div>

          {/* References — end */}
          <Reveal as="section">
            <div className="nx-card nx-space">
              <h2 className="mb-3 text-sm font-semibold tracking-wide text-nx-muted uppercase">
                {tr('references')}
              </h2>
              <ol className="flex list-decimal flex-col gap-2 ps-5 text-sm text-nx-muted">
                {blog.references.map((ref) => (
                  <li key={ref}>{ref}</li>
                ))}
              </ol>
            </div>
          </Reveal>

          {/* Admin decision — bottom of the blog */}
          {reviewing && (
            <Reveal>
              <div className="flex flex-col gap-3 sm:flex-row">
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => decide('approved')}
                  disabled={deciding}
                  className="flex flex-1 items-center justify-center gap-2 rounded-nx bg-(--nx-accent) px-5 py-3.5 font-semibold text-white shadow-md transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  <Check size={18} />
                  {tr('approve')}
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => decide('rejected')}
                  disabled={deciding}
                  className="flex flex-1 items-center justify-center gap-2 rounded-nx border border-nx-border bg-nx-surface px-5 py-3.5 font-semibold text-nx-text transition-colors hover:bg-nx-surface-2 disabled:opacity-50"
                >
                  <X size={18} />
                  {tr('reject')}
                </motion.button>
              </div>
            </Reveal>
          )}

          {/* Delete — small icon, bottom of the blog */}
          {canDelete && (
            <Reveal>
              <div className="flex flex-col items-center gap-3">
                <AnimatePresence mode="wait">
                  {confirmingDelete ? (
                    <motion.div
                      key="confirm"
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 4 }}
                      className="flex flex-col items-center gap-3 rounded-nx border border-red-500/30 bg-red-500/5 p-4 text-center"
                    >
                      <p className="text-sm font-medium text-nx-text">{tr('deleteBlogConfirm')}</p>
                      <div className="flex gap-2">
                        <motion.button
                          whileTap={{ scale: 0.96 }}
                          onClick={confirmDelete}
                          disabled={deleting}
                          className="flex items-center gap-2 rounded-nx bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                        >
                          {deleting ? (
                            <Loader2 size={15} className="animate-spin" />
                          ) : (
                            <Trash2 size={15} />
                          )}
                          {tr('confirmDelete')}
                        </motion.button>
                        <motion.button
                          whileTap={{ scale: 0.96 }}
                          onClick={() => setConfirmingDelete(false)}
                          className="rounded-nx border border-nx-border bg-nx-surface px-4 py-2 text-sm font-medium text-nx-text transition-colors hover:bg-nx-surface-2"
                        >
                          {tr('cancel')}
                        </motion.button>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.button
                      key="trigger"
                      whileTap={{ scale: 0.92 }}
                      onClick={() => setConfirmingDelete(true)}
                      aria-label={tr('delete')}
                      title={tr('delete')}
                      className="flex h-9 w-9 items-center justify-center rounded-full text-nx-muted transition-colors hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400"
                    >
                      <Trash2 size={16} />
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>
            </Reveal>
          )}
        </>
      )}
    </article>
  )
}
