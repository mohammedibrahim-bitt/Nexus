'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { Bot, Send, User } from 'lucide-react'
import React, { useEffect, useRef, useState } from 'react'

import { useNexus } from '@/nexus/NexusProvider'
import { Reveal } from '@/nexus/Reveal'

type Msg = { id: number; from: 'user' | 'ai'; text: string }

export default function AIChatPage() {
  const { tr, lang, statuses, blogs } = useNexus()
  const [messages, setMessages] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const [typing, setTyping] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, typing])

  // Demo responder — swap for a real API call to your model backend.
  const respond = (question: string): string => {
    const q = question.toLowerCase()
    const published = blogs.filter((b) => statuses[b.id] === 'approved')
    const hit = published.find(
      (b) =>
        b.title.en.toLowerCase().split(' ').some((w) => w.length > 4 && q.includes(w)) ||
        b.title.ar.split(' ').some((w) => w.length > 3 && question.includes(w)),
    )
    if (hit) {
      return lang === 'ar'
        ? `بالتأكيد — مدونة «${hit.title.ar}» تتناول هذا الموضوع: ${hit.description.ar}`
        : `Sure — the blog “${hit.title.en}” covers that: ${hit.description.en}`
    }
    return lang === 'ar'
      ? `سؤال جيد! حاليًا لدينا ${published.length} مدونات منشورة. اسألني عن أي منها، أو اطلب ملخصًا لموضوع معين.`
      : `Good question! There are currently ${published.length} published blogs. Ask me about any of them, or request a summary of a topic.`
  }

  const send = () => {
    const text = input.trim()
    if (!text || typing) return
    setInput('')
    setMessages((m) => [...m, { id: Date.now(), from: 'user', text }])
    setTyping(true)
    setTimeout(() => {
      setMessages((m) => [...m, { id: Date.now() + 1, from: 'ai', text: respond(text) }])
      setTyping(false)
    }, 900)
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-10rem)] max-w-2xl flex-col">
      <Reveal as="header">
        <div className="mb-6 text-center">
          <h1 className="flex items-center justify-center gap-2.5 text-3xl font-bold text-nx-text">
            <Bot className="text-(--nx-accent)" size={28} />
            {tr('aiTitle')}
          </h1>
          <p className="mt-1 text-nx-muted">{tr('aiSub')}</p>
        </div>
      </Reveal>

      <div className="nx-card flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          {messages.length === 0 && (
            <p className="pt-16 text-center text-sm text-nx-muted">{tr('aiPlaceholder')}</p>
          )}
          <AnimatePresence initial={false}>
            {messages.map((m) => (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 12, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                className={`flex items-end gap-2.5 ${m.from === 'user' ? 'flex-row-reverse' : ''}`}
              >
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                    m.from === 'user' ? 'bg-nx-surface-2 text-nx-muted' : 'bg-(--nx-accent) text-white'
                  }`}
                >
                  {m.from === 'user' ? <User size={15} /> : <Bot size={15} />}
                </span>
                <p
                  className={`max-w-[80%] rounded-nx px-4 py-2.5 text-sm leading-relaxed ${
                    m.from === 'user'
                      ? 'bg-(--nx-accent) text-white'
                      : 'bg-nx-surface-2 text-nx-text'
                  }`}
                >
                  {m.text}
                </p>
              </motion.div>
            ))}
          </AnimatePresence>
          {typing && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-1.5 ps-11"
            >
              {[0, 1, 2].map((i) => (
                <motion.span
                  key={i}
                  className="h-2 w-2 rounded-full bg-nx-muted"
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ repeat: Infinity, duration: 1, delay: i * 0.2 }}
                />
              ))}
            </motion.div>
          )}
          <div ref={bottomRef} />
        </div>

        <div className="flex items-center gap-2 border-t border-nx-border p-3">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && send()}
            placeholder={tr('aiPlaceholder')}
            className="h-11 flex-1 rounded-[calc(var(--nx-radius)*0.75)] bg-nx-surface-2 px-4 text-sm text-nx-text outline-none placeholder:text-nx-muted focus:ring-2 focus:ring-(--nx-accent)"
          />
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={send}
            aria-label={tr('send')}
            className="flex h-11 w-11 items-center justify-center rounded-[calc(var(--nx-radius)*0.75)] bg-(--nx-accent) text-white disabled:opacity-50"
            disabled={!input.trim() || typing}
          >
            <Send size={18} className="rtl:rotate-180" />
          </motion.button>
        </div>
      </div>
    </div>
  )
}
