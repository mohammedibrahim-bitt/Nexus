'use client'

import { motion } from 'framer-motion'
import { BookOpen, ShieldCheck } from 'lucide-react'
import { useRouter } from 'next/navigation'
import React from 'react'

import { useNexus } from '@/nexus/NexusProvider'
import { Reveal } from '@/nexus/Reveal'

export default function LoginPage() {
  const { tr, login, settings } = useNexus()
  const router = useRouter()

  const enter = (role: 'reader' | 'admin') => {
    login(role)
    router.push(role === 'admin' ? '/nexus/admin' : '/nexus')
  }

  return (
    <div className="mx-auto flex max-w-sm flex-col gap-8 pt-16 text-center">
      <Reveal as="header">
        <div>
          <h1 className="font-proxemic text-3xl font-bold tracking-[0.18em] text-nx-text uppercase">
            {settings.logoText || 'Nexus'}
          </h1>
          <h2 className="mt-4 text-2xl font-bold text-nx-text">{tr('loginTitle')}</h2>
          <p className="mt-1 text-nx-muted">{tr('loginSub')}</p>
        </div>
      </Reveal>

      <Reveal delay={0.1}>
        <div className="flex flex-col gap-3">
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => enter('reader')}
            className="flex items-center justify-center gap-2.5 rounded-nx bg-(--nx-accent) px-5 py-3.5 font-semibold text-white shadow-md transition-opacity hover:opacity-90"
          >
            <BookOpen size={18} />
            {tr('loginReader')}
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => enter('admin')}
            className="flex items-center justify-center gap-2.5 rounded-nx border border-nx-border bg-nx-surface px-5 py-3.5 font-semibold text-nx-text transition-colors hover:bg-nx-surface-2"
          >
            <ShieldCheck size={18} />
            {tr('loginAdmin')}
          </motion.button>
        </div>
      </Reveal>
    </div>
  )
}
