'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { Clock, Loader2, ShieldCheck } from 'lucide-react'
import Link from 'next/link'
import React, { useEffect, useState } from 'react'

import { postsApi, toNexusBlog, type NexusBlog } from '@/nexus/api'
import { useNexus } from '@/nexus/NexusProvider'
import { Reveal } from '@/nexus/Reveal'

export default function ReviewPage() {
  const { tr, lang, role, authLoading } = useNexus()
  const [pending, setPending] = useState<NexusBlog[] | null>(null)
  const [error, setError] = useState(false)

  const load = () => {
    setError(false)
    setPending(null)
    postsApi.list({ 'where[status][equals]': 'pending', sort: '-createdAt' }).then((res) => {
      if (!res.ok) {
        setError(true)
        return
      }
      setPending(res.data.docs.map(toNexusBlog))
    })
  }

  useEffect(() => {
    if (role === 'reviewer') load()
  }, [role])

  if (authLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-24 text-sm text-nx-muted">
        <Loader2 size={16} className="animate-spin" />
        {tr('loading')}
      </div>
    )
  }

  if (role !== 'reviewer') {
    return (
      <div className="flex flex-col items-center gap-4 py-24 text-center">
        <ShieldCheck size={32} className="text-nx-muted" />
        <p className="text-nx-muted">Only reviewers can access this page.</p>
        <Link
          href="/nexus/login"
          className="rounded-nx bg-(--nx-accent) px-5 py-2.5 font-semibold text-white"
        >
          {tr('login')}
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-8">
      <Reveal as="header">
        <div className="flex flex-col gap-2">
          <h1 className="flex items-center gap-2.5 text-3xl font-bold text-nx-text">
            <ShieldCheck className="text-(--nx-accent)" size={28} />
            Review pending blogs
          </h1>
          <p className="text-nx-muted">Approve or reject articles before they are published.</p>
        </div>
      </Reveal>

      {pending === null && !error && (
        <div className="flex items-center justify-center gap-2 py-16 text-sm text-nx-muted">
          <Loader2 size={16} className="animate-spin" />
          {tr('loading')}
        </div>
      )}

      {error && (
        <div className="flex flex-col items-center gap-3 py-16 text-sm text-nx-muted">
          <p>{tr('loadError')}</p>
          <button onClick={load} className="font-medium text-(--nx-accent)">
            {tr('tryAgain')}
          </button>
        </div>
      )}

      {pending !== null && pending.length === 0 && (
        <Reveal>
          <div className="nx-card nx-space text-center text-nx-muted">
            No pending blogs to review right now.
          </div>
        </Reveal>
      )}

      {pending !== null && pending.length > 0 && (
        <div className="grid gap-5 sm:grid-cols-2">
          <AnimatePresence>
            {pending.map((blog, i) => (
              <Reveal key={blog.id} delay={Math.min(i * 0.08, 0.4)}>
                <motion.div
                  layout
                  exit={{ opacity: 0, scale: 0.95 }}
                  whileHover={{ y: -4 }}
                  transition={{ type: 'spring', stiffness: 380, damping: 26 }}
                >
                  <Link
                    href={`/nexus/blog/${blog.id}`}
                    className="nx-card nx-space flex h-full flex-col gap-3 transition-shadow hover:shadow-lg"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1.5 rounded-full bg-amber-500/15 px-2.5 py-1 font-medium text-amber-600 dark:text-amber-400">
                        <Clock size={13} />
                        Pending review
                      </span>
                      <span className="text-nx-muted">{blog.createdAt}</span>
                    </div>
                    <h3 className="text-lg font-semibold text-nx-text">{blog.title[lang]}</h3>
                    <p className="line-clamp-2 text-sm leading-relaxed text-nx-muted">
                      {blog.description[lang]}
                    </p>
                    <p className="mt-auto pt-2 text-xs text-nx-muted">
                      {blog.author
                        ? `${tr('writtenBy')} ${blog.author}`
                        : `${tr('generatedBy')} ${blog.model}`}
                    </p>
                  </Link>
                </motion.div>
              </Reveal>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
