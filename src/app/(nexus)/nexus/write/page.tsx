'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { Check, Clock, Lock, PenLine, ThumbsDown, ThumbsUp } from 'lucide-react'
import Link from 'next/link'
import React, { useState } from 'react'

import { useNexus } from '@/nexus/NexusProvider'
import { Reveal } from '@/nexus/Reveal'

const emptyForm = { title: '', description: '', content: '', references: '', tag: '' }

const statusIcon = {
  pending: Clock,
  approved: ThumbsUp,
  rejected: ThumbsDown,
} as const

const statusStyle = {
  pending: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
  approved: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
  rejected: 'bg-red-500/15 text-red-600 dark:text-red-400',
} as const

export default function WritePage() {
  const { tr, lang, role, blogs, statuses, createBlog } = useNexus()
  const [form, setForm] = useState(emptyForm)
  const [justSubmitted, setJustSubmitted] = useState(false)

  if (role !== 'author') {
    return (
      <div className="flex flex-col items-center gap-4 py-24 text-center">
        <Lock size={32} className="text-nx-muted" />
        <p className="text-nx-muted">{tr('authorOnly')}</p>
        <Link
          href="/nexus/login"
          className="rounded-nx bg-(--nx-accent) px-5 py-2.5 font-semibold text-white"
        >
          {tr('login')}
        </Link>
      </div>
    )
  }

  const mySubmissions = blogs.filter((b) => b.author)

  const submit = () => {
    createBlog(form)
    setForm(emptyForm)
    setJustSubmitted(true)
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-8">
      <Reveal as="header">
        <div className="flex flex-col gap-2">
          <h1 className="flex items-center gap-2.5 text-3xl font-bold text-nx-text">
            <PenLine className="text-(--nx-accent)" size={28} />
            {tr('writeTitle')}
          </h1>
          <p className="text-nx-muted">{tr('writeSub')}</p>
        </div>
      </Reveal>

      <Reveal>
        <div className="nx-card nx-space flex flex-col gap-5">
          <AnimatePresence>
            {justSubmitted && (
              <motion.div
                initial={{ opacity: 0, y: -8, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-center gap-2 overflow-hidden rounded-nx bg-emerald-500/10 px-4 py-3 text-sm font-medium text-emerald-600 dark:text-emerald-400"
              >
                <Check size={16} className="shrink-0" />
                {tr('submitted')}
              </motion.div>
            )}
          </AnimatePresence>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-semibold text-nx-text">{tr('fieldTitle')}</span>
            <input
              type="text"
              value={form.title}
              onChange={(e) => {
                setForm((f) => ({ ...f, title: e.target.value }))
                setJustSubmitted(false)
              }}
              className="h-11 rounded-[calc(var(--nx-radius)*0.6)] border border-nx-border bg-nx-surface-2 px-4 text-nx-text outline-none focus:ring-2 focus:ring-(--nx-accent)"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-semibold text-nx-text">{tr('fieldTag')}</span>
            <input
              type="text"
              value={form.tag}
              onChange={(e) => setForm((f) => ({ ...f, tag: e.target.value }))}
              className="h-11 max-w-xs rounded-[calc(var(--nx-radius)*0.6)] border border-nx-border bg-nx-surface-2 px-4 text-nx-text outline-none focus:ring-2 focus:ring-(--nx-accent)"
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
              rows={3}
              className="resize-y rounded-[calc(var(--nx-radius)*0.6)] border border-nx-border bg-nx-surface-2 px-4 py-2.5 text-sm text-nx-text outline-none focus:ring-2 focus:ring-(--nx-accent)"
            />
          </label>

          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={submit}
            disabled={!form.title.trim() || !form.content.trim()}
            className="flex items-center justify-center gap-2 rounded-nx bg-(--nx-accent) px-5 py-3 font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            <PenLine size={17} />
            {tr('submitForReview')}
          </motion.button>
        </div>
      </Reveal>

      <Reveal>
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold text-nx-text">{tr('mySubmissions')}</h2>
          {mySubmissions.length === 0 ? (
            <p className="nx-card nx-space text-center text-sm text-nx-muted">
              {tr('noSubmissionsYet')}
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {mySubmissions.map((b) => {
                const s = statuses[b.id] ?? b.status
                const StatusIcon = statusIcon[s]
                return (
                  <Link
                    key={b.id}
                    href={`/nexus/blog/${b.id}`}
                    className="nx-card flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-nx-surface-2"
                  >
                    <span className="text-sm font-medium text-nx-text">{b.title[lang]}</span>
                    <span
                      className={`flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${statusStyle[s]}`}
                    >
                      <StatusIcon size={12} />
                      {tr(s === 'pending' ? 'pendingReview' : s === 'approved' ? 'approved' : 'rejected')}
                    </span>
                  </Link>
                )
              })}
            </div>
          )}
        </section>
      </Reveal>
    </div>
  )
}
