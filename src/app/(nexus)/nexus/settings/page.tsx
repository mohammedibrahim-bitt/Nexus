'use client'

import { motion } from 'framer-motion'
import { Check, Link2, Lock, Paintbrush, RotateCcw, Type } from 'lucide-react'
import Link from 'next/link'
import React, { useState } from 'react'

import { parentSiteTokens, useNexus } from '@/nexus/NexusProvider'
import { Reveal } from '@/nexus/Reveal'

const ACCENTS = ['#6366f1', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#8b5cf6']

export default function SettingsPage() {
  const { tr, role, settings, updateSettings, resetSettings } = useNexus()
  const [syncing, setSyncing] = useState(false)

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

  const syncFromParent = () => {
    setSyncing(true)
    // Simulates fetching the parent site's design tokens; wire this to a real
    // endpoint (e.g. GET https://parent-site/api/design-tokens) in production.
    setTimeout(() => {
      updateSettings({ ...parentSiteTokens, connectedToParent: true })
      setSyncing(false)
    }, 1200)
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <Reveal as="header">
        <div className="flex flex-col gap-2">
          <h1 className="flex items-center gap-2.5 text-3xl font-bold text-nx-text">
            <Paintbrush className="text-(--nx-accent)" size={28} />
            {tr('settingsTitle')}
          </h1>
          <p className="text-nx-muted">{tr('settingsSub')}</p>
        </div>
      </Reveal>

      {/* Parent-site inheritance */}
      <Reveal>
        <section className="nx-card nx-space flex flex-col gap-4">
          <div>
            <h2 className="flex items-center gap-2 font-semibold text-nx-text">
              <Link2 size={18} className="text-(--nx-accent)" />
              {tr('connectSite')}
            </h2>
            <p className="mt-1 text-sm text-nx-muted">{tr('connectSub')}</p>
          </div>
          {settings.connectedToParent ? (
            <p className="flex items-center gap-2 rounded-nx bg-emerald-500/10 px-4 py-3 text-sm font-medium text-emerald-600 dark:text-emerald-400">
              <Check size={16} />
              {tr('connected')}
            </p>
          ) : (
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={syncFromParent}
              disabled={syncing}
              className="self-start rounded-nx bg-(--nx-accent) px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
            >
              {syncing ? '…' : tr('connect')}
            </motion.button>
          )}
        </section>
      </Reveal>

      {/* Logo text */}
      <Reveal>
        <section className="nx-card nx-space flex flex-col gap-4">
          <h2 className="flex items-center gap-2 font-semibold text-nx-text">
            <Type size={18} className="text-(--nx-accent)" />
            {tr('logoName')}
          </h2>
          <input
            type="text"
            value={settings.logoText}
            maxLength={24}
            onChange={(e) => updateSettings({ logoText: e.target.value })}
            placeholder="Nexus"
            className="h-11 w-full max-w-xs rounded-[calc(var(--nx-radius)*0.6)] border border-nx-border bg-nx-surface-2 px-4 font-proxemic text-lg tracking-[0.1em] text-nx-text uppercase outline-none focus:ring-2 focus:ring-(--nx-accent)"
          />
        </section>
      </Reveal>

      {/* Accent color */}
      <Reveal>
        <section className="nx-card nx-space flex flex-col gap-4">
          <h2 className="font-semibold text-nx-text">{tr('accentColor')}</h2>
          <div className="flex flex-wrap items-center gap-3">
            {ACCENTS.map((c) => (
              <motion.button
                key={c}
                whileHover={{ scale: 1.15 }}
                whileTap={{ scale: 0.9 }}
                aria-label={`Accent ${c}`}
                onClick={() => updateSettings({ accent: c, connectedToParent: false })}
                className="flex h-9 w-9 items-center justify-center rounded-full ring-2 ring-offset-2 ring-offset-nx-surface"
                style={{
                  background: c,
                  ['--tw-ring-color' as string]: settings.accent === c ? c : 'transparent',
                }}
              >
                {settings.accent === c && <Check size={16} className="text-white" />}
              </motion.button>
            ))}
            <input
              type="color"
              value={settings.accent}
              onChange={(e) => updateSettings({ accent: e.target.value, connectedToParent: false })}
              className="h-9 w-9 cursor-pointer rounded-full border border-nx-border bg-transparent"
              aria-label="Custom accent color"
            />
          </div>
        </section>
      </Reveal>

      {/* Radius + font size sliders */}
      <Reveal>
        <section className="nx-card nx-space flex flex-col gap-6">
          <label className="flex flex-col gap-2">
            <span className="flex justify-between text-sm font-semibold text-nx-text">
              {tr('cornerRadius')}
              <span className="font-normal text-nx-muted">{settings.radius}px</span>
            </span>
            <input
              type="range"
              min={0}
              max={28}
              value={settings.radius}
              onChange={(e) =>
                updateSettings({ radius: Number(e.target.value), connectedToParent: false })
              }
              className="accent-(--nx-accent)"
            />
          </label>
          <label className="flex flex-col gap-2">
            <span className="flex justify-between text-sm font-semibold text-nx-text">
              {tr('fontSize')}
              <span className="font-normal text-nx-muted">{Math.round(settings.fontScale * 100)}%</span>
            </span>
            <input
              type="range"
              min={90}
              max={115}
              value={Math.round(settings.fontScale * 100)}
              onChange={(e) =>
                updateSettings({ fontScale: Number(e.target.value) / 100, connectedToParent: false })
              }
              className="accent-(--nx-accent)"
            />
          </label>
        </section>
      </Reveal>

      {/* Density + animations */}
      <Reveal>
        <section className="nx-card nx-space flex flex-col gap-5">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-nx-text">{tr('density')}</span>
            <div className="flex rounded-full bg-nx-surface-2 p-1">
              {(['comfortable', 'compact'] as const).map((d) => (
                <button
                  key={d}
                  onClick={() => updateSettings({ density: d, connectedToParent: false })}
                  className={`relative rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                    settings.density === d ? 'text-white' : 'text-nx-muted'
                  }`}
                >
                  {settings.density === d && (
                    <motion.span
                      layoutId="density-pill"
                      className="absolute inset-0 rounded-full bg-(--nx-accent)"
                      transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                    />
                  )}
                  <span className="relative z-10">{tr(d)}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-nx-text">{tr('animations')}</span>
            <button
              role="switch"
              aria-checked={settings.animations}
              onClick={() => updateSettings({ animations: !settings.animations })}
              className={`flex h-7 w-12 items-center rounded-full p-1 transition-colors ${
                settings.animations ? 'justify-end bg-(--nx-accent)' : 'justify-start bg-nx-surface-2'
              }`}
            >
              <motion.span
                layout
                transition={{ type: 'spring', stiffness: 500, damping: 32 }}
                className="h-5 w-5 rounded-full bg-white shadow"
              />
            </button>
          </div>
        </section>
      </Reveal>

      <Reveal>
        <button
          onClick={resetSettings}
          className="flex items-center gap-2 self-start text-sm font-medium text-nx-muted transition-colors hover:text-nx-text"
        >
          <RotateCcw size={15} />
          {tr('reset')}
        </button>
      </Reveal>
    </div>
  )
}
