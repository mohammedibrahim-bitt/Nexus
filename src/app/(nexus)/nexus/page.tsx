'use client'

import { motion } from 'framer-motion'
import { ArrowRight, Sparkles } from 'lucide-react'
import Link from 'next/link'
import React from 'react'

import { useNexus } from '@/nexus/NexusProvider'
import { Reveal } from '@/nexus/Reveal'

export default function NexusMainPage() {
  const { tr, lang, statuses, blogs } = useNexus()
  const published = blogs.filter((b) => statuses[b.id] === 'approved')

  return (
    <div className="flex flex-col gap-12">
      <Reveal as="header">
        <div className="flex flex-col gap-4 py-8 text-center">
          <span className="mx-auto flex items-center gap-2 rounded-full border border-nx-border bg-nx-surface px-4 py-1.5 text-xs font-medium text-nx-muted">
            <Sparkles size={14} className="text-(--nx-accent)" />
            {tr('generatedBy')} Nexus Writer
          </span>
          <h1 className="text-4xl font-bold tracking-tight text-nx-text sm:text-5xl">
            {tr('heroTitle')}
          </h1>
          <p className="mx-auto max-w-xl text-nx-muted">{tr('heroSub')}</p>
        </div>
      </Reveal>

      <section>
        <Reveal>
          <h2 className="mb-6 text-xl font-semibold text-nx-text">{tr('latestBlogs')}</h2>
        </Reveal>
        <div className="grid gap-5 sm:grid-cols-2">
          {published.map((blog, i) => (
            <Reveal key={blog.id} delay={Math.min(i * 0.08, 0.4)}>
              <motion.div whileHover={{ y: -4 }} transition={{ type: 'spring', stiffness: 380, damping: 26 }}>
                <Link
                  href={`/nexus/blog/${blog.id}`}
                  className="nx-card nx-space group flex h-full flex-col gap-3 transition-shadow hover:shadow-lg"
                >
                  <div className="flex items-center justify-between text-xs text-nx-muted">
                    <span className="rounded-full bg-nx-surface-2 px-2.5 py-1 font-medium text-(--nx-accent)">
                      {blog.tag[lang]}
                    </span>
                    <span>
                      {blog.readMinutes} {tr('minRead')}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-nx-text">{blog.title[lang]}</h3>
                  <p className="line-clamp-2 text-sm leading-relaxed text-nx-muted">
                    {blog.description[lang]}
                  </p>
                  <span className="mt-auto flex items-center gap-1.5 pt-2 text-sm font-medium text-(--nx-accent)">
                    {tr('readBlog')}
                    <ArrowRight
                      size={16}
                      className="transition-transform group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1"
                    />
                  </span>
                </Link>
              </motion.div>
            </Reveal>
          ))}
        </div>
      </section>
    </div>
  )
}
