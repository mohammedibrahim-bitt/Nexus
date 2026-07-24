'use client'

import { motion } from 'framer-motion'
import { Chrome, Loader2, Lock, Mail, User } from 'lucide-react'
import { useRouter } from 'next/navigation'
import React, { useState } from 'react'

import { useNexus } from '@/nexus/NexusProvider'
import { Reveal } from '@/nexus/Reveal'

export default function LoginPage() {
  const { tr, signIn, signUp, settings } = useNexus()
  const router = useRouter()
  const [mode, setMode] = useState<'signIn' | 'signUp'>('signIn')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const routeForRole = (role: 'admin' | 'author' | 'reviewer' | null) =>
    role === 'admin' ? '/nexus/admin' : role === 'author' ? '/nexus/write' : '/nexus'

  const submit = async () => {
    setSubmitting(true)
    setError('')
    const result = mode === 'signIn' ? await signIn(email, password) : await signUp(name, email, password)
    setSubmitting(false)
    if (!result.ok) {
      setError(result.error)
      return
    }
    router.push(routeForRole(result.role))
  }

  const switchMode = (next: 'signIn' | 'signUp') => {
    setMode(next)
    setError('')
  }

  return (
    <div className="mx-auto flex max-w-sm flex-col gap-8 pt-16 text-center">
      <Reveal as="header">
        <div>
          <h1 className="font-proxemic text-3xl font-bold tracking-[0.18em] text-nx-text uppercase">
            {settings.logoText || 'Nexus'}
          </h1>
          <h2 className="mt-4 text-2xl font-bold text-nx-text">
            {tr(mode === 'signIn' ? 'loginTitle' : 'signUpTitle')}
          </h2>
          <p className="mt-1 text-nx-muted">{tr(mode === 'signIn' ? 'loginSub' : 'signUpSub')}</p>
        </div>
      </Reveal>

      <Reveal delay={0.1}>
        <div className="nx-card nx-space flex flex-col gap-4 text-start">
          <button
            type="button"
            disabled
            title={tr('comingSoon')}
            className="flex items-center justify-center gap-2.5 rounded-nx border border-nx-border bg-nx-surface-2 px-5 py-3 font-semibold text-nx-muted opacity-70"
          >
            <Chrome size={18} />
            {tr('continueWithGoogle')}
            <span className="rounded-full bg-nx-surface px-2 py-0.5 text-xs font-medium">
              {tr('comingSoon')}
            </span>
          </button>

          <div className="flex items-center gap-3 text-xs text-nx-muted">
            <span className="h-px flex-1 bg-nx-border" />
            {tr('or')}
            <span className="h-px flex-1 bg-nx-border" />
          </div>

          <form
            className="flex flex-col gap-3"
            onSubmit={(e) => {
              e.preventDefault()
              submit()
            }}
          >
            {mode === 'signUp' && (
              <label className="flex flex-col gap-1.5">
                <span className="flex items-center gap-1.5 text-sm font-semibold text-nx-text">
                  <User size={14} />
                  {tr('fieldName')}
                </span>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-11 rounded-[calc(var(--nx-radius)*0.6)] border border-nx-border bg-nx-surface-2 px-4 text-nx-text outline-none focus:ring-2 focus:ring-(--nx-accent)"
                  required
                />
              </label>
            )}

            <label className="flex flex-col gap-1.5">
              <span className="flex items-center gap-1.5 text-sm font-semibold text-nx-text">
                <Mail size={14} />
                {tr('fieldEmail')}
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11 rounded-[calc(var(--nx-radius)*0.6)] border border-nx-border bg-nx-surface-2 px-4 text-nx-text outline-none focus:ring-2 focus:ring-(--nx-accent)"
                required
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="flex items-center gap-1.5 text-sm font-semibold text-nx-text">
                <Lock size={14} />
                {tr('fieldPassword')}
              </span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-11 rounded-[calc(var(--nx-radius)*0.6)] border border-nx-border bg-nx-surface-2 px-4 text-nx-text outline-none focus:ring-2 focus:ring-(--nx-accent)"
                required
              />
            </label>

            {error && <p className="text-sm font-medium text-red-600 dark:text-red-400">{error}</p>}

            <motion.button
              type="submit"
              whileTap={{ scale: 0.98 }}
              disabled={submitting}
              className="mt-1 flex items-center justify-center gap-2.5 rounded-nx bg-(--nx-accent) px-5 py-3 font-semibold text-white shadow-md transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {submitting && <Loader2 size={16} className="animate-spin" />}
              {tr(mode === 'signIn' ? 'signIn' : 'signUp')}
            </motion.button>
          </form>

          <p className="text-center text-sm text-nx-muted">
            {tr(mode === 'signIn' ? 'noAccountYet' : 'haveAccount')}{' '}
            <button
              type="button"
              onClick={() => switchMode(mode === 'signIn' ? 'signUp' : 'signIn')}
              className="font-semibold text-(--nx-accent)"
            >
              {tr(mode === 'signIn' ? 'signUp' : 'signIn')}
            </button>
          </p>
        </div>
      </Reveal>
    </div>
  )
}
