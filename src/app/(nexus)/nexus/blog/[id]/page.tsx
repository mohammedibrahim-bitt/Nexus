'use client'

import { motion } from 'framer-motion'
import { ArrowLeft, Check, ShieldCheck, X } from 'lucide-react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import React from 'react'

import { demoBlogs } from '@/nexus/data'
import { useNexus } from '@/nexus/NexusProvider'
import { Reveal } from '@/nexus/Reveal'

export default function BlogPage() {
  const { id } = useParams<{ id: string }>()
  const { tr, lang, role, statuses, decide } = useNexus()
  const router = useRouter()

  const blog = demoBlogs.find((b) => b.id === id)
  if (!blog) {
    return (
      <div className="py-20 text-center text-nx-muted">
        <p>{tr('notFoundBlog')}</p>
        <Link href="/nexus" className="mt-4 inline-block font-medium text-(--nx-accent)">
          {tr('backToMain')}
        </Link>
      </div>
    )
  }

  const status = statuses[blog.id]
  const reviewing = role === 'admin' && status === 'pending'

  return (
    <article className="mx-auto flex max-w-2xl flex-col gap-10">
      {reviewing && (
        <Reveal>
          <div className="flex items-center gap-3 rounded-nx border border-(--nx-accent) bg-nx-surface px-4 py-3 text-sm text-nx-text">
            <ShieldCheck size={18} className="shrink-0 text-(--nx-accent)" />
            {tr('decisionBanner')}
          </div>
        </Reveal>
      )}

      {/* Title — top center */}
      <Reveal as="header">
        <div className="flex flex-col items-center gap-3 text-center">
          <span className="text-xs font-medium tracking-wide text-nx-muted uppercase">
            {blog.tag[lang]} · {blog.generatedAt} · {blog.readMinutes} {tr('minRead')}
          </span>
          <h1 className="text-3xl font-bold tracking-tight text-nx-text sm:text-4xl">
            {blog.title[lang]}
          </h1>
          <p className="text-sm text-nx-muted">
            {tr('generatedBy')} {blog.model}
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
      {reviewing ? (
        <Reveal>
          <div className="flex flex-col gap-3 sm:flex-row">
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => {
                decide(blog.id, 'approved')
                router.push('/nexus/admin')
              }}
              className="flex flex-1 items-center justify-center gap-2 rounded-nx bg-(--nx-accent) px-5 py-3.5 font-semibold text-white shadow-md transition-opacity hover:opacity-90"
            >
              <Check size={18} />
              {tr('approve')}
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => {
                decide(blog.id, 'rejected')
                router.push('/nexus/admin')
              }}
              className="flex flex-1 items-center justify-center gap-2 rounded-nx border border-nx-border bg-nx-surface px-5 py-3.5 font-semibold text-nx-text transition-colors hover:bg-nx-surface-2"
            >
              <X size={18} />
              {tr('reject')}
            </motion.button>
          </div>
        </Reveal>
      ) : (
        <Reveal>
          <Link
            href="/nexus"
            className="flex items-center gap-2 text-sm font-medium text-(--nx-accent)"
          >
            <ArrowLeft size={16} className="rtl:rotate-180" />
            {tr('backToMain')}
          </Link>
        </Reveal>
      )}
    </article>
  )
}
