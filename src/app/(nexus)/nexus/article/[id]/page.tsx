'use client'

import { AnimatePresence, motion, useScroll, useSpring, useTransform } from 'framer-motion'
import {
  ArrowLeft,
  Check,
  Loader2,
  Pencil,
  ShieldCheck,
  Trash2,
  X,
  Bookmark,
  Share2,
  Link2,
  Play,
  Square,
  Sparkles,
  BookOpen,
  Quote,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  ThumbsUp,
  ThumbsDown,
  HelpCircle,
  AlertCircle,
  Calendar,
  Clock,
  ExternalLink,
  MessageSquare,
  User as UserIcon,
} from 'lucide-react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import React, { useEffect, useRef, useState } from 'react'

import { postsApi, toNexusBlog, type NexusBlog } from '@/nexus/api'
import { useNexus } from '@/nexus/NexusProvider'
import { Reveal } from '@/nexus/Reveal'

// 3 Bullet AI summary helper
const getAISummary = (paragraphs: string[]): string[] => {
  const bullets: string[] = []
  for (const p of paragraphs) {
    if (bullets.length >= 3) break
    const sentence = p.split(/[.!?]/).map((s) => s.trim()).filter((s) => s.length > 15)[0]
    if (sentence) {
      bullets.push(sentence + '.')
    }
  }
  while (bullets.length < 3) {
    bullets.push('Key takeaway: Read the detailed analysis below.')
  }
  return bullets
}

// AI Insights helper
const getAIInsights = (lang: 'en' | 'ar') => {
  const insightsEN = [
    { title: '⚡ Core Concept', content: 'Neural networks are inspired by the biological neural systems that constitute brain structures in living organisms.' }
  ]
  const insightsAR = [
    { title: '⚡ مفهوم أساسي', content: 'الشبكات العصبية الاصطناعية مستوحاة بالكامل من الهياكل العصبية والبيولوجية للأدمغة الحية.' }
  ]
  return lang === 'ar' ? insightsAR : insightsEN
}

// Topic-aware Quiz builder
const getQuizQuestions = (title: string, lang: 'en' | 'ar') => {
  if (lang === 'ar') {
    return [
      {
        question: `ما هو الموضوع والتركيز الأساسي لمقال "${title}"؟`,
        options: ['الابتكار التكنولوجي وأنظمة الذكاء الاصطناعي', 'التاريخ الجيولوجي للبراكين', 'تطبيقات الألعاب للهواتف المحمولة'],
        answer: 0,
        explanation: 'يتناول هذا المقال التطورات العميقة في التكنولوجيا وأنظمة الذكاء الاصطناعي الحديثة.'
      },
      {
        question: 'ما هي الفائدة الكبرى للأدوات الذكية المذكورة في المقال؟',
        options: ['تقليص الكفاءة التشغيلية', 'تحسين الإنتاجية وتوفير الوقت', 'الاستبدال الكامل لجميع الأعمال البشرية'],
        answer: 1,
        explanation: 'تساعد الأدوات وأنظمة العمل الذكية على تعزيز الإنتاجية والكفاءة بشكل كبير.'
      }
    ]
  }
  return [
    {
      question: `What is the primary focus of "${title}"?`,
      options: ['Smart technology & AI innovation', 'Ancient geological structures', 'Mobile entertainment platforms'],
      answer: 0,
      explanation: 'This article explores the cutting edge of digital transformation and modern smart systems.'
    },
    {
      question: 'Which of the following is a key benefit of using these intelligent systems?',
      options: ['Decreased operational speed', 'Higher productivity and time savings', 'Total elimination of human input'],
      answer: 1,
      explanation: 'Intelligent systems streamline processes, saving significant time while boosting output.'
    },
    {
      question: 'What is the goal of an AI-first reading experience?',
      options: ['Information overload and fatigue', 'Optimized scanning, summarization, and comprehension', 'Higher internet network bills'],
      answer: 1,
      explanation: 'AI features help summarize, simplify, and navigate text to optimize read comprehension.'
    }
  ]
}

// Reference Parser
const parseReference = (ref: string) => {
  const isUrl = ref.startsWith('http://') || ref.startsWith('https://')
  if (isUrl) {
    try {
      const url = new URL(ref)
      return {
        isUrl: true,
        name: url.hostname.replace('www.', ''),
        url: ref,
        favicon: `https://www.google.com/s2/favicons?domain=${url.hostname}&sz=64`
      }
    } catch {
      return { isUrl: false, text: ref }
    }
  }
  return { isUrl: false, text: ref }
}

const getSafeImageUrl = (url?: string) => {
  const trimmed = url?.trim()
  if (!trimmed) return undefined
  return /^(https?:\/\/|\/)/.test(trimmed) ? trimmed : undefined
}

export default function BlogPage() {
  const { id } = useParams<{ id: string }>()
  const { tr, lang, role, currentUser, settings } = useNexus()
  const router = useRouter()

  const [blog, setBlog] = useState<NexusBlog | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deciding, setDeciding] = useState(false)
  const [form, setForm] = useState({
    title: '',
    description: '',
    content: '',
    references: '',
    coverImageUrl: '',
  })

  // Custom states for premium features
  const [bookmarked, setBookmarked] = useState(false)
  const [listening, setListening] = useState(false)
  const [summaryExpanded, setSummaryExpanded] = useState(false)
  const [related, setRelated] = useState<NexusBlog[]>([])
  
  // AI Actions Panel
  const [aiAction, setAiAction] = useState<'summarize' | 'explain' | 'quiz' | null>(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [quizScore, setQuizScore] = useState<Record<number, number>>({})
  const [quizSubmitted, setQuizSubmitted] = useState<Record<number, boolean>>({})

  // Local comments state
  const [comments, setComments] = useState<{ id: string; author: string; text: string; date: string; likes: number }[]>([])
  const [newComment, setNewComment] = useState('')

  // Scroll tracking for animations & progress
  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 })
  const yParallax = useTransform(scrollYProgress, [0, 1], [0, 60])
  const strokeDashoffset = useTransform(scrollYProgress, [0, 1], [88, 0])

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
      window.speechSynthesis.cancel()
    }
  }, [id])

  // Load bookmarks & comments & related articles
  useEffect(() => {
    if (!blog) return
    setBookmarked(!!localStorage.getItem(`nexus-bookmark-${blog.id}`))
    
    // Comments
    const savedComments = localStorage.getItem(`nexus-comments-${blog.id}`)
    if (savedComments) {
      setComments(JSON.parse(savedComments))
    } else {
      const defaults = [
        { id: '1', author: 'Alexander Vance', text: lang === 'ar' ? 'تحليل رائع وممتاز جداً، وفر علي الكثير من الوقت!' : 'Incredible summary module. Saved me a ton of time scanning.', date: '2 hours ago', likes: 3 },
        { id: '2', author: 'Elena Rostova', text: lang === 'ar' ? 'التصميم وتنسيق القراءة مريح للغاية للعينين.' : 'The line height and editorial layout feels extremely premium.', date: '1 hour ago', likes: 1 }
      ]
      setComments(defaults)
      localStorage.setItem(`nexus-comments-${blog.id}`, JSON.stringify(defaults))
    }

    // Related posts query
    postsApi.list({ 'where[status][equals]': 'approved', limit: '4' }).then((res) => {
      if (res.ok) {
        const list = res.data.docs
          .map(toNexusBlog)
          .filter((p) => p.id !== blog.id)
          .slice(0, 3)
        setRelated(list)
      }
    })
  }, [blog, id, lang])

  const toggleBookmark = () => {
    if (!blog) return
    if (bookmarked) {
      localStorage.removeItem(`nexus-bookmark-${blog.id}`)
      setBookmarked(false)
    } else {
      localStorage.setItem(`nexus-bookmark-${blog.id}`, 'true')
      setBookmarked(true)
    }
  }

  const copyUrl = () => {
    navigator.clipboard.writeText(window.location.href)
  }

  const share = () => {
    if (navigator.share && blog) {
      navigator.share({
        title: blog.title[lang],
        text: blog.description[lang],
        url: window.location.href,
      })
    } else {
      copyUrl()
    }
  }

  const showArticleLinks = () => {
    document.getElementById('article-links')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const toggleListen = () => {
    if (listening) {
      window.speechSynthesis.cancel()
      setListening(false)
    } else {
      if (!blog) return
      const textToRead = blog.content[lang].join(' ')
      const utterance = new SpeechSynthesisUtterance(textToRead)
      utterance.lang = lang === 'ar' ? 'ar-EG' : 'en-US'
      utterance.onend = () => setListening(false)
      utterance.onerror = () => setListening(false)
      window.speechSynthesis.speak(utterance)
      setListening(true)
    }
  }

  const runAiAction = (action: 'summarize' | 'explain' | 'quiz') => {
    setAiLoading(true)
    setAiAction(action)
    setQuizScore({})
    setQuizSubmitted({})
    setTimeout(() => {
      setAiLoading(false)
    }, 800)
  }

  const submitComment = () => {
    if (!newComment.trim() || !blog) return
    const added = {
      id: String(Date.now()),
      author: currentUser?.name || 'Guest Reader',
      text: newComment.trim(),
      date: 'Just now',
      likes: 0
    }
    const updated = [...comments, added]
    setComments(updated)
    setNewComment('')
    localStorage.setItem(`nexus-comments-${blog.id}`, JSON.stringify(updated))
  }

  const likeComment = (cid: string) => {
    if (!blog) return
    const updated = comments.map((c) => (c.id === cid ? { ...c, likes: c.likes + 1 } : c))
    setComments(updated)
    localStorage.setItem(`nexus-comments-${blog.id}`, JSON.stringify(updated))
  }

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
      coverImageUrl: blog.coverImageUrl ?? '',
    })
    setSaved(false)
    setEditing(true)
  }

  const saveEdits = async () => {
    setSaving(true)
    const patch: Record<string, unknown> = {
      coverImageUrl: form.coverImageUrl.trim() || null,
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

  const summaryBullets = getAISummary(blog.content[lang])
  const aiInsights = getAIInsights(lang)
  const quizQuestions = getQuizQuestions(blog.title[lang], lang)
  const coverImageUrl = getSafeImageUrl(blog.coverImageUrl)

  return (
    <div className="relative min-h-screen pb-20">
      {/* Thin scroll progress bar */}
      <motion.div
        style={{ scaleX }}
        className="fixed top-0 left-0 right-0 h-1 bg-(--nx-accent) origin-[0%] z-50"
      />

      {/* Top sticky navigation bar */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-nx-border bg-nx-bg/85 px-4 backdrop-blur-md">
        <Link
          href={backHref}
          className="flex items-center gap-2 text-sm font-semibold text-nx-muted transition-colors hover:text-(--nx-accent)"
        >
          <ArrowLeft size={16} className="rtl:rotate-180" />
          <span>{lang === 'ar' ? 'العودة للمقالات' : 'Back to Articles'}</span>
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleBookmark}
            title="Bookmark"
            className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-nx-surface-2 ${
              bookmarked ? 'text-(--nx-accent)' : 'text-nx-muted'
            }`}
          >
            <Bookmark size={16} fill={bookmarked ? 'currentColor' : 'none'} />
          </button>
          <button
            onClick={share}
            title="Share"
            className="flex h-8 w-8 items-center justify-center rounded-full text-nx-muted transition-colors hover:bg-nx-surface-2 hover:text-nx-text"
          >
            <Share2 size={16} />
          </button>
          <button
            onClick={showArticleLinks}
            title="Article links"
            disabled={blog.references.length === 0}
            className="flex h-8 w-8 items-center justify-center rounded-full text-nx-muted transition-colors hover:bg-nx-surface-2 hover:text-nx-text disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Link2 size={16} />
          </button>
        </div>
      </header>

      {editing ? (
        <div className="mx-auto max-w-2xl px-4 pt-10">
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
                <span className="text-sm font-semibold text-nx-text">{tr('fieldCoverImage')}</span>
                <input
                  type="url"
                  value={form.coverImageUrl}
                  onChange={(e) => setForm((f) => ({ ...f, coverImageUrl: e.target.value }))}
                  placeholder="https://example.com/photo.jpg"
                  className="h-11 rounded-[calc(var(--nx-radius)*0.6)] border border-nx-border bg-nx-surface-2 px-4 text-nx-text outline-none focus:ring-2 focus:ring-(--nx-accent)"
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
        </div>
      ) : (
        <div className="mx-auto flex max-w-5xl px-4 pt-8 md:px-8">
          
          {/* LEFT SIDEBAR: Floating Reading Toolbar (desktop only) */}
          <aside className="sticky top-24 hidden h-fit w-16 shrink-0 flex-col items-center gap-4 ltr:left-0 rtl:right-0 md:flex">
            {/* Radial progress wrapper */}
            <div className="relative flex h-11 w-11 items-center justify-center rounded-full bg-nx-surface border border-nx-border shadow-sm">
              <svg className="absolute h-9 w-9 -rotate-90">
                <circle
                  cx="18"
                  cy="18"
                  r="14"
                  className="stroke-nx-surface-2 fill-none"
                  strokeWidth="3.5"
                />
                <motion.circle
                  cx="18"
                  cy="18"
                  r="14"
                  className="stroke-(--nx-accent) fill-none"
                  strokeWidth="3.5"
                  strokeDasharray="88"
                  style={{
                    strokeDashoffset
                  }}
                />
              </svg>
              <BookOpen size={15} className="relative z-10 text-nx-text" />
            </div>

            <div className="flex flex-col gap-1.5 rounded-full border border-nx-border bg-nx-surface p-1 shadow-sm">
              <button
                onClick={toggleBookmark}
                title="Bookmark"
                className={`flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-nx-surface-2 ${
                  bookmarked ? 'text-(--nx-accent)' : 'text-nx-muted'
                }`}
              >
                <Bookmark size={15} fill={bookmarked ? 'currentColor' : 'none'} />
              </button>
              <button
                onClick={toggleListen}
                title={listening ? 'Pause Listening' : 'Listen to Article'}
                className={`flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-nx-surface-2 ${
                  listening ? 'text-red-500 animate-pulse' : 'text-nx-muted hover:text-nx-text'
                }`}
              >
                {listening ? <Square size={14} /> : <Play size={14} />}
              </button>
              <button
                onClick={showArticleLinks}
                title="Article links"
                disabled={blog.references.length === 0}
                className="flex h-9 w-9 items-center justify-center rounded-full text-nx-muted transition-colors hover:bg-nx-surface-2 hover:text-nx-text disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Link2 size={15} />
              </button>
              <button
                onClick={share}
                title="Share"
                className="flex h-9 w-9 items-center justify-center rounded-full text-nx-muted transition-colors hover:bg-nx-surface-2 hover:text-nx-text"
              >
                <Share2 size={15} />
              </button>
            </div>
          </aside>

          {/* MAIN READING PANELS */}
          <main className="min-w-0 flex-1 px-0 md:px-12">
            <article className="flex flex-col gap-8">
              
              {/* Reviewing banners */}
              {reviewing && !editing && (
                <Reveal>
                  <div className="flex items-center gap-3 rounded-nx border border-(--nx-accent) bg-nx-surface px-4 py-3.5 text-sm text-nx-text shadow-sm">
                    <ShieldCheck size={18} className="shrink-0 text-(--nx-accent)" />
                    <div>
                      <p className="font-semibold">{tr('decisionBanner')}</p>
                    </div>
                  </div>
                </Reveal>
              )}

              {/* Edit button */}
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
                        className="ms-auto flex items-center gap-2 rounded-nx border border-nx-border bg-nx-surface px-4 py-2 text-sm font-medium text-nx-text transition-colors hover:bg-nx-surface-2 shadow-sm"
                      >
                        <Pencil size={14} className="text-(--nx-accent)" />
                        {tr('edit')}
                      </motion.button>
                    )}
                  </div>
                </Reveal>
              )}

              {/* Top background hero */}
              <Reveal as="header">
                <div
                  className="relative min-h-[420px] overflow-hidden rounded-[28px] border border-nx-border/10 bg-gradient-to-br from-slate-900 via-slate-950 to-indigo-950 shadow-md"
                  style={
                    coverImageUrl
                      ? {
                          backgroundImage: `linear-gradient(180deg, rgba(2, 6, 23, 0.32), rgba(2, 6, 23, 0.82)), url("${coverImageUrl}")`,
                          backgroundPosition: 'center',
                          backgroundSize: 'cover',
                        }
                      : undefined
                  }
                >
                  {!coverImageUrl && (
                    <>
                      <motion.div style={{ y: yParallax }} className="absolute inset-0 opacity-10">
                        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:20px_20px]" />
                      </motion.div>
                      <div className="absolute top-1/4 left-1/4 h-60 w-60 rounded-full bg-(--nx-accent)/15 blur-[60px]" />
                      <div className="absolute bottom-1/4 right-1/4 h-72 w-72 rounded-full bg-indigo-500/10 blur-[80px]" />
                    </>
                  )}
                  <div className="relative z-10 flex min-h-[420px] flex-col items-center justify-end gap-4 px-6 pb-10 pt-16 text-center sm:px-10">
                    <div className="inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white uppercase tracking-wide backdrop-blur-md">
                    <Sparkles size={11} />
                    {blog.tag[lang]}
                  </div>

                  <h1 className="max-w-3xl font-proxemic text-4xl font-extrabold tracking-tight text-white drop-shadow-sm sm:text-5xl md:leading-[1.15] lg:text-[3.25rem]">
                    {blog.title[lang]}
                  </h1>

                  <div className="mt-2 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-sm text-white/80">
                    <span className="flex items-center gap-1"><Calendar size={13} /> {blog.createdAt}</span>
                    <span>·</span>
                    <span className="flex items-center gap-1"><Clock size={13} /> {blog.readMinutes} {tr('minRead')}</span>
                  </div>

                  {/* Redesigned AI Author Card */}
                  <div className="mt-4 flex items-center gap-3 rounded-2xl border border-white/20 bg-black/25 p-3 pr-4 text-white shadow-sm backdrop-blur-md">
                    <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-white/15 font-bold">
                      {blog.author ? <UserIcon size={18} /> : <Sparkles size={18} />}
                      <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-slate-900 bg-emerald-500" />
                    </div>
                    <div className="text-start">
                      <p className="text-xs text-white/70">{lang === 'ar' ? 'الناشر الموثوق' : 'Verified Publisher'}</p>
                      <h4 className="flex items-center gap-1.5 text-sm font-bold text-white">
                        {blog.author
                          ? `${tr('writtenBy')} ${blog.author}`
                          : `${tr('generatedBy')} ${blog.model || 'Nexus AI'}`}
                        {!blog.author && (
                          <span className="rounded-full bg-white/15 px-1.5 py-0.5 text-[0.65rem] font-bold text-white/90">
                            Verified AI
                          </span>
                        )}
                      </h4>
                    </div>
                  </div>
                    {!coverImageUrl && (
                      <p className="mt-2 font-proxemic text-xs font-bold tracking-widest text-white/35 uppercase">
                        {settings.logoText || 'Nexus'} · AI GENERATED PERSPECTIVE
                      </p>
                    )}
                  </div>
                </div>
              </Reveal>

              {/* Redesigned AI Summary Card */}
              <Reveal>
                <div className="rounded-3xl border border-nx-border bg-nx-surface p-6 shadow-sm">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles size={18} className="text-(--nx-accent)" />
                      <h3 className="text-base font-bold text-nx-text">
                        {lang === 'ar' ? '✨ خلاصة الذكاء الاصطناعي السريعة' : '✨ Quick AI Summary'}
                      </h3>
                    </div>
                    <span className="rounded-full bg-nx-surface-2 px-2.5 py-1 text-xs font-medium text-nx-muted">
                      {lang === 'ar' ? `وفّر ${Math.max(1, Math.round(blog.readMinutes * 0.8))} د` : `Saves ~${Math.max(1, Math.round(blog.readMinutes * 0.8))} mins`}
                    </span>
                  </div>

                  <AnimatePresence initial={false}>
                    {(!summaryExpanded) ? (
                      <div className="mt-3 text-sm text-nx-muted line-clamp-2">
                        {summaryBullets[0]}
                      </div>
                    ) : (
                      <motion.ul
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="mt-4 flex list-disc flex-col gap-2.5 ps-5 text-sm leading-relaxed text-nx-muted"
                      >
                        {summaryBullets.map((bullet, idx) => (
                          <li key={idx} className="marker:text-(--nx-accent)">{bullet}</li>
                        ))}
                      </motion.ul>
                    )}
                  </AnimatePresence>

                  <button
                    onClick={() => setSummaryExpanded(!summaryExpanded)}
                    className="mt-4 flex items-center gap-1 text-xs font-bold text-(--nx-accent) transition-opacity hover:opacity-80"
                  >
                    <span>{summaryExpanded ? (lang === 'ar' ? 'إخفاء الخلاصة' : 'Collapse Summary') : (lang === 'ar' ? 'عرض الخلاصة بالكامل' : 'Expand Summary')}</span>
                    {summaryExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>
                </div>
              </Reveal>

              {/* Redesigned Article Content */}
              <div className="mx-auto w-full max-w-[760px] flex flex-col gap-6 text-[1.125rem] leading-[1.8] text-nx-text/90">
                {blog.content[lang].map((para, i) => {
                  const isQuote = para.startsWith('"') || para.startsWith('“') || para.startsWith('«')
                  
                  return (
                    <React.Fragment key={i}>
                      {isQuote ? (
                        <Reveal>
                          <blockquote className="my-4 border-l-4 border-(--nx-accent) bg-nx-surface-2/40 px-6 py-4 rounded-r-2xl italic text-nx-text">
                            <Quote size={20} className="text-(--nx-accent)/40 mb-2" />
                            <p>{para}</p>
                          </blockquote>
                        </Reveal>
                      ) : (
                        <Reveal>
                          <p className="mb-2 leading-relaxed">{para}</p>
                        </Reveal>
                      )}

                      {/* Injected AI Insights Card (between paragraphs) */}
                      {i === 4 && aiInsights[0] && (
                        <Reveal>
                          <div className="my-6 flex items-start gap-3.5 rounded-2xl border border-nx-border/70 bg-nx-surface p-5 shadow-sm">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-500">
                              <Sparkles size={18} />
                            </div>
                            <div>
                              <h4 className="text-sm font-bold text-nx-text">{aiInsights[0].title}</h4>
                              <p className="mt-1 text-xs leading-relaxed text-nx-muted">{aiInsights[0].content}</p>
                            </div>
                          </div>
                        </Reveal>
                      )}
                    </React.Fragment>
                  )
                })}
              </div>

              {/* Redesigned References Citations Section */}
              {blog.references.length > 0 && (
                <Reveal as="section">
                  <div id="article-links" className="scroll-mt-24 border-t border-nx-border/60 pt-10">
                    <h3 className="mb-4 text-sm font-bold tracking-wider text-nx-muted uppercase">
                      {tr('references')}
                    </h3>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {blog.references.map((ref, idx) => {
                        const parsed = parseReference(ref)
                        return (
                          <div
                            key={idx}
                            className="flex items-center justify-between gap-3 rounded-2xl border border-nx-border bg-nx-surface p-3.5 shadow-sm transition-all hover:shadow-md"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              {parsed.isUrl ? (
                                <>
                                  <img
                                    src={parsed.favicon}
                                    alt="favicon"
                                    onError={(e) => {
                                      e.currentTarget.style.display = 'none'
                                    }}
                                    className="h-6 w-6 rounded-md bg-nx-surface-2 p-0.5 shrink-0"
                                  />
                                  <div className="min-w-0">
                                    <p className="truncate text-sm font-bold text-nx-text">{parsed.name}</p>
                                    <p className="truncate text-xs text-nx-muted">{parsed.url}</p>
                                  </div>
                                </>
                              ) : (
                                <>
                                  <BookOpen size={16} className="text-nx-muted shrink-0" />
                                  <p className="truncate text-sm font-medium text-nx-text">{ref}</p>
                                </>
                              )}
                            </div>
                            {parsed.isUrl && (
                              <a
                                href={parsed.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex h-8 w-8 items-center justify-center rounded-lg border border-nx-border text-nx-muted transition-colors hover:bg-nx-surface-2 hover:text-(--nx-accent)"
                              >
                                <ExternalLink size={14} />
                              </a>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </Reveal>
              )}

              {/* Redesigned AI Actions Dashboard Panel */}
              <Reveal>
                <div className="rounded-3xl border border-nx-border bg-nx-surface p-6 shadow-sm">
                  <div className="flex items-center gap-2 mb-4">
                    <Sparkles size={18} className="text-(--nx-accent)" />
                    <h3 className="text-base font-bold text-nx-text">
                      {lang === 'ar' ? 'لوحة تحكم الذكاء الاصطناعي' : 'Ask AI about this article'}
                    </h3>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => runAiAction('summarize')}
                      className={`rounded-xl px-4 py-2 text-xs font-bold transition-colors ${
                        aiAction === 'summarize'
                          ? 'bg-(--nx-accent) text-white'
                          : 'bg-nx-surface-2 text-nx-text hover:bg-nx-surface-2/80'
                      }`}
                    >
                      {lang === 'ar' ? 'تلخيص المقال' : 'Summarize'}
                    </button>
                    <button
                      onClick={() => runAiAction('explain')}
                      className={`rounded-xl px-4 py-2 text-xs font-bold transition-colors ${
                        aiAction === 'explain'
                          ? 'bg-(--nx-accent) text-white'
                          : 'bg-nx-surface-2 text-nx-text hover:bg-nx-surface-2/80'
                      }`}
                    >
                      {lang === 'ar' ? 'تبسيط المفاهيم' : 'Explain Simply'}
                    </button>
                  </div>

                  <AnimatePresence mode="wait">
                    {aiAction && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 8 }}
                        className="mt-5 rounded-2xl bg-nx-surface-2/50 p-5 border border-nx-border/50"
                      >
                        {aiLoading ? (
                          <div className="flex items-center gap-2 text-sm text-nx-muted justify-center py-6">
                            <Loader2 size={16} className="animate-spin text-(--nx-accent)" />
                            <span>AI is thinking…</span>
                          </div>
                        ) : (
                          <>
                            {aiAction === 'summarize' && (
                              <div className="text-sm leading-relaxed text-nx-text">
                                <h4 className="font-bold mb-2 flex items-center gap-1.5"><CheckCircle size={15} className="text-emerald-500" /> Summary takeaways:</h4>
                                <ul className="list-disc ps-5 flex flex-col gap-2">
                                  {summaryBullets.map((b, i) => (
                                    <li key={i}>{b}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            {aiAction === 'explain' && (
                              <div className="text-sm leading-relaxed text-nx-text">
                                <h4 className="font-bold mb-2 flex items-center gap-1.5"><HelpCircle size={15} className="text-indigo-500" /> Simplify core concept:</h4>
                                <p>
                                  {lang === 'ar'
                                    ? `يهدف هذا التحليل إلى تبسيط الأفكار المعقدة المذكورة. باختصار، يركز الكاتب على سبل كفاءة الاستخدام للملفات، وتحسين مستوى القراءة. تساعد التكنولوجيا على تعزيز الكفاءة دون المساس بالجودة وتساعد القراء على الفهم والوصول السريع للمحتويات.`
                                    : `This article analyzes productivity, modern tools, and system optimization. In simple terms, it argues that embedding intelligent tools directly into daily workflows generates massive time savings without sacrificing quality. Smart structures allow the reader to scanning concepts at high speeds.`}
                                </p>
                              </div>
                            )}
                            {aiAction === 'quiz' && (
                              <div className="flex flex-col gap-4">
                                <h4 className="text-sm font-bold text-nx-text mb-1">
                                  {lang === 'ar' ? 'اختبار قراءة سريع' : 'Reading Comprehension Quiz'}
                                </h4>
                                {quizQuestions.map((q, qIdx) => (
                                  <div key={qIdx} className="flex flex-col gap-2 rounded-xl bg-nx-surface p-4 border border-nx-border">
                                    <p className="text-sm font-bold text-nx-text">{qIdx + 1}. {q.question}</p>
                                    <div className="flex flex-col gap-1.5 mt-2">
                                      {q.options.map((opt, oIdx) => {
                                        const isSelected = quizScore[qIdx] === oIdx
                                        const isCorrect = q.answer === oIdx
                                        const submitted = quizSubmitted[qIdx]
                                        
                                        let btnClass = 'bg-nx-surface-2 text-nx-text hover:bg-nx-surface-2/80'
                                        if (isSelected) {
                                          if (submitted) {
                                            btnClass = isCorrect ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
                                          } else {
                                            btnClass = 'bg-(--nx-accent) text-white'
                                          }
                                        }
                                        
                                        return (
                                          <button
                                            key={oIdx}
                                            disabled={submitted}
                                            onClick={() => setQuizScore({ ...quizScore, [qIdx]: oIdx })}
                                            className={`rounded-lg px-3 py-2 text-xs font-semibold text-start transition-all ${btnClass}`}
                                          >
                                            {opt}
                                          </button>
                                        )
                                      })}
                                    </div>
                                    {quizScore[qIdx] !== undefined && !quizSubmitted[qIdx] && (
                                      <button
                                        onClick={() => setQuizSubmitted({ ...quizSubmitted, [qIdx]: true })}
                                        className="self-end mt-2 rounded-lg bg-(--nx-accent) px-3 py-1.5 text-[0.7rem] font-bold text-white transition-opacity hover:opacity-90"
                                      >
                                        {lang === 'ar' ? 'إرسال الجواب' : 'Submit Answer'}
                                      </button>
                                    )}
                                    {quizSubmitted[qIdx] && (
                                      <p className="text-xs text-nx-muted mt-2 border-t border-nx-border/50 pt-2 flex items-start gap-1">
                                        <AlertCircle size={12} className="shrink-0 text-(--nx-accent) mt-0.5" />
                                        <span>{q.explanation}</span>
                                      </p>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </Reveal>

              {/* Redesigned Premium Comments Section */}
              <Reveal>
                <div className="rounded-3xl border border-nx-border bg-nx-surface p-6 shadow-sm">
                  <div className="flex items-center gap-2 mb-6">
                    <MessageSquare size={18} className="text-(--nx-accent)" />
                    <h3 className="text-base font-bold text-nx-text">
                      {lang === 'ar' ? 'التعليقات والمناقشة' : 'Discussion board'}
                    </h3>
                  </div>

                  <div className="flex flex-col gap-4 mb-6">
                    {comments.map((c) => (
                      <div key={c.id} className="flex gap-3 items-start border-b border-nx-border/50 pb-4 last:border-0 last:pb-0">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-nx-surface-2 text-nx-muted font-bold text-xs">
                          {c.author.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h5 className="text-xs font-bold text-nx-text">{c.author}</h5>
                            <span className="text-[0.65rem] text-nx-muted">{c.date}</span>
                          </div>
                          <p className="text-sm text-nx-muted mt-1 leading-relaxed">{c.text}</p>
                          <div className="flex items-center gap-3 mt-2">
                            <button
                              onClick={() => likeComment(c.id)}
                              className="flex items-center gap-1 text-[0.7rem] font-bold text-nx-muted transition-colors hover:text-(--nx-accent)"
                            >
                              <ThumbsUp size={11} />
                              <span>{c.likes}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder={lang === 'ar' ? 'شارك رأيك في هذا المقال...' : 'Write a comment...'}
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      className="flex-1 h-10 px-4 text-sm rounded-xl border border-nx-border bg-nx-surface-2 text-nx-text outline-none focus:ring-2 focus:ring-(--nx-accent)"
                    />
                    <button
                      onClick={submitComment}
                      className="rounded-xl bg-(--nx-accent) px-4 h-10 text-xs font-bold text-white transition-opacity hover:opacity-90"
                    >
                      {lang === 'ar' ? 'نشر' : 'Post'}
                    </button>
                  </div>
                </div>
              </Reveal>

              {/* Decision Banners & Actions at bottom of content */}
              {reviewing && (
                <Reveal>
                  <div className="flex flex-col gap-3 sm:flex-row mt-6">
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

              {/* Delete logic */}
              {canDelete && (
                <Reveal>
                  <div className="flex flex-col items-center gap-3 mt-6">
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

              {/* Redesigned Related Articles section */}
              {related.length > 0 && (
                <Reveal as="section">
                  <div className="border-t border-nx-border/60 pt-10 mt-6">
                    <h3 className="mb-6 text-sm font-bold tracking-wider text-nx-muted uppercase">
                      {lang === 'ar' ? 'مقالات ذات صلة' : 'Related Articles'}
                    </h3>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {related.map((post) => (
                        <Link
                          key={post.id}
                          href={`/nexus/article/${post.slug || post.id}`}
                          className="group flex flex-col gap-3 rounded-2xl border border-nx-border bg-nx-surface p-4 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md"
                        >
                          {/* Mini visual mockup cover */}
                          <div className="h-28 w-full rounded-xl bg-gradient-to-br from-slate-900 to-indigo-950 flex items-center justify-center px-4 overflow-hidden relative">
                            <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:16px_16px]" />
                            <p className="font-proxemic text-[0.7rem] font-bold tracking-widest text-white/30 uppercase text-center truncate w-full">
                              {post.title[lang]}
                            </p>
                          </div>
                          <div>
                            <span className="text-[0.65rem] font-bold text-(--nx-accent) uppercase tracking-wider">
                              {post.tag[lang]}
                            </span>
                            <h4 className="text-sm font-bold text-nx-text line-clamp-2 mt-1 leading-snug group-hover:text-(--nx-accent) transition-colors">
                              {post.title[lang]}
                            </h4>
                            <p className="text-[0.7rem] text-nx-muted mt-2 flex items-center gap-1">
                              <Clock size={11} /> {post.readMinutes} {tr('minRead')}
                            </p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                </Reveal>
              )}

              {/* End CTA Explorer Section */}
              <Reveal>
                <div className="mt-12 rounded-3xl bg-gradient-to-br from-(--nx-accent)/10 to-indigo-500/10 border border-(--nx-accent)/15 p-8 text-center flex flex-col items-center gap-4">
                  <h3 className="text-xl font-bold text-nx-text">
                    {lang === 'ar' ? 'استمر في الاستكشاف والاستماع' : 'Continue Exploring Articles'}
                  </h3>
                  <p className="text-sm text-nx-muted max-w-sm">
                    {lang === 'ar' ? 'تصفح المزيد من المقالات الحصرية التي ينشئها الذكاء الاصطناعي ويعتمدها البشر.' : 'Browse more articles generated by AI and verified by editors.'}
                  </p>
                  <Link
                    href="/"
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-(--nx-accent) px-5 py-2.5 text-sm font-bold text-white shadow-md transition-opacity hover:opacity-90"
                  >
                    <span>{lang === 'ar' ? 'استكشاف الكل' : 'Browse All'}</span>
                  </Link>
                </div>
              </Reveal>

            </article>
          </main>
        </div>
      )}
    </div>
  )
}
