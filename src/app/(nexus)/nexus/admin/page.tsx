'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { Clock, Lock, Settings, ShieldCheck } from 'lucide-react'
import Link from 'next/link'
import React from 'react'

import { demoBlogs } from '@/nexus/data'
import { useNexus } from '@/nexus/NexusProvider'
import { Reveal } from '@/nexus/Reveal'

export default function AdminPanelPage() {
  const { tr, lang, role, statuses } = useNexus()

  if (role !== 'admin') {
    return (
      <div className="flex flex-col items-center gap-4 py-24 text-center">
        <Lock size={32} className="text-nx-muted" />
        <p className="text-nx-muted">{tr('adminOnly')}</p>
        <Link
          href="/nexus/login"
          className="rounded-nx bg-(--nx-accent) px-5 py-2.5 font-semibold text-white"
        >
          {tr('login')}
        </Link>
      </div>
    )
  }

  const pending = demoBlogs.filter((b) => statuses[b.id] === 'pending')

  return (
    <div className="flex flex-col gap-8">
      <Reveal as="header">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-2">
            <h1 className="flex items-center gap-2.5 text-3xl font-bold text-nx-text">
              <ShieldCheck className="text-(--nx-accent)" size={28} />
              {tr('adminHeading')}
            </h1>
            <p className="text-nx-muted">{tr('adminSub')}</p>
          </div>
          <Link
            href="/nexus/settings"
            aria-label={tr('settings')}
            title={tr('settings')}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-nx-muted transition-colors hover:bg-nx-surface-2 hover:text-nx-text"
          >
            <Settings size={17} />
          </Link>
        </div>
      </Reveal>

      {pending.length === 0 ? (
        <Reveal>
          <div className="nx-card nx-space text-center text-nx-muted">{tr('adminEmpty')}</div>
        </Reveal>
      ) : (
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
                        {tr('pendingReview')}
                      </span>
                      <span className="text-nx-muted">{blog.generatedAt}</span>
                    </div>
                    <h3 className="text-lg font-semibold text-nx-text">{blog.title[lang]}</h3>
                    <p className="line-clamp-2 text-sm leading-relaxed text-nx-muted">
                      {blog.description[lang]}
                    </p>
                    <p className="mt-auto pt-2 text-xs text-nx-muted">
                      {tr('generatedBy')} {blog.model}
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
