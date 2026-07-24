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
import { MediaUploader, type UploadedMedia } from '@/components/MediaUploader'
import React, { useEffect, useState } from 'react'

import { AI_PROVIDER_OPTIONS, type AiProvider } from '@/utilities/seoResearch/aiProviders'
import { useStaffAuth } from '@/providers/StaffAuth'

export default function ProfilePage() {
  const { staff } = useStaffAuth()

  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('')
  const [title, setTitle] = useState('')
  const [bio, setBio] = useState('')
  const [avatar, setAvatar] = useState<null | UploadedMedia>(null)
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
        setSerpApiKey(user.serpApiKey || '')
        setAiProvider(user.aiProvider || 'anthropic')
        setAiApiKey(user.aiApiKey || '')
      })
      .finally(() => setLoading(false))
  }, [staff])

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!staff) return

    setSaving(true)
    setError(null)
    setSaved(false)

    try {
      const res = await fetch(`/api/users/${staff.id}`, {
        body: JSON.stringify({
          name,
          aiApiKey,
          aiProvider,
          avatar: avatar?.id ?? null,
          bio,
          serpApiKey,
          title,
        }),
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

      <MediaUploader label="Profile picture" onChange={setAvatar} value={avatar} />

      <div className="flex flex-col gap-1">
        <Label htmlFor="name">Name</Label>
        <Input id="name" onChange={(e) => setName(e.target.value)} value={name} />
      </div>

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

      <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4 shadow-[var(--shadow-card)]">
        <div>
          <span className="text-sm font-medium">API Keys</span>
          <p className="text-sm text-muted-foreground">
            Bring your own keys to use the SEO Research Agent — get a SerpApi key at serpapi.com,
            and pick any AI provider you have a key for below.
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

      {error && <p className="text-sm text-red-600">{error}</p>}
      {saved && <p className="text-sm text-emerald-600">Saved.</p>}

      <Button disabled={saving} type="submit">
        {saving ? 'Saving...' : 'Save profile'}
      </Button>
    </form>
  )
}
