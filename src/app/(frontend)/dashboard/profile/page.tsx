'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { AvatarUploader, type UploadedMedia } from '@/components/AvatarUploader'
import { Facebook, Globe, Instagram, Linkedin, Plus, Trash2, Youtube } from 'lucide-react'
import React, { useEffect, useState } from 'react'

import { AI_PROVIDER_OPTIONS, type AiProvider } from '@/utilities/seoResearch/aiProviders'
import { useStaffAuth } from '@/providers/StaffAuth'

type SocialPlatform = 'linkedin' | 'twitter' | 'instagram' | 'facebook' | 'youtube' | 'website'

type SocialLink = {
  platform: SocialPlatform
  url: string
}

const PLATFORM_OPTIONS: { label: string; value: SocialPlatform; icon: React.ReactNode }[] = [
  { label: 'LinkedIn', value: 'linkedin', icon: <Linkedin className="size-4" /> },
  { label: 'X (Twitter)', value: 'twitter', icon: <XIcon /> },
  { label: 'Instagram', value: 'instagram', icon: <Instagram className="size-4" /> },
  { label: 'Facebook', value: 'facebook', icon: <Facebook className="size-4" /> },
  { label: 'YouTube', value: 'youtube', icon: <Youtube className="size-4" /> },
  { label: 'Website', value: 'website', icon: <Globe className="size-4" /> },
]

const PLATFORM_PLACEHOLDERS: Record<SocialPlatform, string> = {
  linkedin: 'https://linkedin.com/in/your-name',
  twitter: 'https://x.com/your-handle',
  instagram: 'https://instagram.com/your-handle',
  facebook: 'https://facebook.com/your-page',
  youtube: 'https://youtube.com/@your-channel',
  website: 'https://your-website.com',
}

function XIcon() {
  return (
    <svg fill="currentColor" height="16" viewBox="0 0 24 24" width="16">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  )
}

export default function ProfilePage() {
  const { staff } = useStaffAuth()
  const isReader = staff?.role === 'reader'

  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('')
  const [title, setTitle] = useState('')
  const [bio, setBio] = useState('')
  const [avatar, setAvatar] = useState<null | UploadedMedia>(null)
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([])
  const [serpApiKey, setSerpApiKey] = useState('')
  const [aiProvider, setAiProvider] = useState<AiProvider>('anthropic')
  const [aiApiKey, setAiApiKey] = useState('')

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<null | string>(null)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (!staff) return
    fetch(`/api/users/${staff.id}?depth=1`, { credentials: 'include' })
      .then((res) => res.json())
      .then((user) => {
        setName(user.name || '')
        setTitle(user.title || '')
        setBio(user.bio || '')
        setAvatar(
          user.avatar && typeof user.avatar === 'object'
            ? { id: user.avatar.id, url: user.avatar.url }
            : null,
        )
        setSocialLinks(
          Array.isArray(user.socialLinks)
            ? user.socialLinks.map((l: any) => ({ platform: l.platform, url: l.url || '' }))
            : [],
        )
        setSerpApiKey(user.serpApiKey || '')
        setAiProvider(user.aiProvider || 'anthropic')
        setAiApiKey(user.aiApiKey || '')
      })
      .finally(() => setLoading(false))
  }, [staff])

  // ── Social link helpers ──────────────────────────────────────────
  const addLink = () => {
    setSocialLinks((prev) => [...prev, { platform: 'linkedin', url: '' }])
  }

  const removeLink = (idx: number) => {
    setSocialLinks((prev) => prev.filter((_, i) => i !== idx))
  }

  const updateLink = (idx: number, field: keyof SocialLink, value: string) => {
    setSocialLinks((prev) =>
      prev.map((link, i) => (i === idx ? { ...link, [field]: value } : link)),
    )
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!staff) return

    setSaving(true)
    setError(null)
    setSaved(false)

    try {
      // Readers only ever see/edit name + avatar — don't send the
      // staff-only fields at all, so a reader saving their profile can
      // never blank out a bio/title/social-links/keys they had from
      // before being demoted from a staff role.
      const body = isReader
        ? { name, avatar: avatar?.id ?? null }
        : {
            name,
            aiApiKey,
            aiProvider,
            avatar: avatar?.id ?? null,
            bio,
            serpApiKey,
            socialLinks: socialLinks.filter((l) => l.url.trim()),
            title,
          }

      const res = await fetch(`/api/users/${staff.id}`, {
        body: JSON.stringify(body),
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        method: 'PATCH',
      })

      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.errors?.[0]?.message || 'Could not save your profile.')
      }

      setSaved(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save your profile.')
    } finally {
      setSaving(false)
    }
  }

  if (!staff || loading) return <p className="text-muted-foreground">Loading...</p>

  return (
    <form className="flex max-w-lg flex-col gap-6" onSubmit={onSubmit}>
      <h2 className="text-xl font-semibold">Your profile</h2>

      <div className="flex flex-col gap-1">
        <Label>Email</Label>
        <p className="text-sm text-muted-foreground">{staff.email}</p>
      </div>

      <AvatarUploader onChange={setAvatar} value={avatar} />

      <div className="flex flex-col gap-1">
        <Label htmlFor="name">Name</Label>
        <Input id="name" onChange={(e) => setName(e.target.value)} value={name} />
      </div>

      {!isReader && (
        <>
          <div className="flex flex-col gap-1">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              onChange={(e) => setTitle(e.target.value)}
              placeholder='e.g. "Senior Editor"'
              value={title}
            />
          </div>

          <div className="flex flex-col gap-1">
            <Label htmlFor="bio">Bio</Label>
            <Textarea id="bio" onChange={(e) => setBio(e.target.value)} rows={3} value={bio} />
          </div>

          {/* ── Social Links ── */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div>
                <Label>Social Links</Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Shown as icon buttons on your author profile and at the end of posts.
                </p>
              </div>
              <Button
                disabled={socialLinks.length >= 6}
                onClick={addLink}
                size="sm"
                type="button"
                variant="outline"
              >
                <Plus className="size-3.5 mr-1" />
                Add
              </Button>
            </div>

            {socialLinks.length === 0 && (
              <p className="text-sm text-muted-foreground rounded-lg border border-dashed border-border py-4 text-center">
                No social links yet — click <strong>Add</strong> to add one.
              </p>
            )}

            <div className="flex flex-col gap-2">
              {socialLinks.map((link, idx) => {
                const platformOption = PLATFORM_OPTIONS.find((p) => p.value === link.platform)
                return (
                  <div
                    key={idx}
                    className="flex items-center gap-2 rounded-lg border border-border bg-card p-2"
                  >
                    {/* Platform icon */}
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                      {platformOption?.icon ?? <Globe className="size-4" />}
                    </span>

                    {/* Platform selector */}
                    <Select
                      onValueChange={(v) => updateLink(idx, 'platform', v)}
                      value={link.platform}
                    >
                      <SelectTrigger className="w-36 shrink-0 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PLATFORM_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            <span className="flex items-center gap-2">
                              {opt.icon}
                              {opt.label}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {/* URL input */}
                    <Input
                      className="flex-1 text-sm"
                      onChange={(e) => updateLink(idx, 'url', e.target.value)}
                      placeholder={PLATFORM_PLACEHOLDERS[link.platform]}
                      type="url"
                      value={link.url}
                    />

                    {/* Remove */}
                    <button
                      aria-label="Remove link"
                      className="flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                      onClick={() => removeLink(idx)}
                      type="button"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4 shadow-[var(--shadow-card)]">
            <div>
              <span className="text-sm font-medium">API Keys</span>
              <p className="text-sm text-muted-foreground">
                Bring your own keys to use the SEO Research Agent — get a SerpApi key at
                serpapi.com, and pick any AI provider you have a key for below.
              </p>
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor="serpApiKey">SerpApi Key</Label>
              <Input
                id="serpApiKey"
                onChange={(e) => setSerpApiKey(e.target.value)}
                type="password"
                value={serpApiKey}
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor="aiProvider">AI Provider</Label>
              <Select onValueChange={(v) => setAiProvider(v as AiProvider)} value={aiProvider}>
                <SelectTrigger id="aiProvider">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AI_PROVIDER_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor="aiApiKey">AI API Key</Label>
              <Input
                id="aiApiKey"
                onChange={(e) => setAiApiKey(e.target.value)}
                type="password"
                value={aiApiKey}
              />
            </div>
          </div>
        </>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}
      {saved && <p className="text-sm text-emerald-600">Saved.</p>}

      <Button disabled={saving} type="submit">
        {saving ? 'Saving...' : 'Save profile'}
      </Button>
    </form>
  )
}
