'use client'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useRouter } from 'next/navigation'
import React, { useEffect, useState } from 'react'

type StaffOption = { email: string; id: string; name: string }

export const SeoRuleForm: React.FC<{ ruleId?: string }> = ({ ruleId }) => {
  const router = useRouter()
  const isEditing = Boolean(ruleId)

  const [staffOptions, setStaffOptions] = useState<StaffOption[]>([])
  const [keyword, setKeyword] = useState('')
  const [active, setActive] = useState(true)
  const [runAsUser, setRunAsUser] = useState('')
  const [intervalDays, setIntervalDays] = useState('7')
  const [loading, setLoading] = useState(isEditing)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<null | string>(null)

  useEffect(() => {
    fetch('/api/users?where[role][in]=admin,author,reviewer&limit=100&depth=0', {
      credentials: 'include',
    })
      .then((res) => res.json())
      .then((data) =>
        setStaffOptions(
          (data.docs || []).map((u: { email: string; id: number | string; name: string }) => ({
            email: u.email,
            id: String(u.id),
            name: u.name || u.email,
          })),
        ),
      )
  }, [])

  useEffect(() => {
    if (!ruleId) return
    fetch(`/api/seo-research-rules/${ruleId}`, { credentials: 'include' })
      .then((res) => res.json())
      .then((data) => {
        setKeyword(data.keyword || '')
        setActive(Boolean(data.active))
        setRunAsUser(String(typeof data.runAsUser === 'object' ? data.runAsUser?.id : data.runAsUser || ''))
        setIntervalDays(String(data.intervalDays ?? 7))
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [ruleId])

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!runAsUser) {
      setError('Choose who this rule should run as.')
      return
    }

    setSubmitting(true)

    try {
      const res = await fetch(
        isEditing ? `/api/seo-research-rules/${ruleId}` : '/api/seo-research-rules',
        {
          body: JSON.stringify({
            active,
            intervalDays: Number(intervalDays) || 1,
            keyword,
            runAsUser: Number(runAsUser),
          }),
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          method: isEditing ? 'PATCH' : 'POST',
        },
      )

      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.errors?.[0]?.message || 'Could not save this rule.')
      }

      router.push('/dashboard/seo-rules')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save this rule.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <p className="text-muted-foreground">Loading...</p>

  return (
    <form className="flex max-w-lg flex-col gap-4" onSubmit={onSubmit}>
      <div className="flex flex-col gap-1">
        <Label htmlFor="keyword">Keyword or template</Label>
        <Input
          id="keyword"
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="best ai agents in [month] [year]"
          required
          value={keyword}
        />
        <p className="text-xs text-muted-foreground">
          Bracketed parts like [month], [year], or open-ended ones like [trending AI model] are
          resolved fresh by AI on every run. Plain text with no brackets is searched exactly as
          written.
        </p>
      </div>

      <div className="flex flex-col gap-1">
        <Label htmlFor="runAsUser">Run as</Label>
        <Select onValueChange={setRunAsUser} value={runAsUser}>
          <SelectTrigger id="runAsUser">
            <SelectValue placeholder="Choose a staff member" />
          </SelectTrigger>
          <SelectContent>
            {staffOptions.map((option) => (
              <SelectItem key={option.id} value={option.id}>
                {option.name} ({option.email})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Uses their saved SerpApi key and AI provider key. They&apos;re credited as the author on
          any draft this rule generates.
        </p>
      </div>

      <div className="flex flex-col gap-1">
        <Label htmlFor="intervalDays">Run again every (days)</Label>
        <Input
          id="intervalDays"
          min={1}
          onChange={(e) => setIntervalDays(e.target.value)}
          required
          type="number"
          value={intervalDays}
        />
      </div>

      <div className="flex items-center gap-2">
        <Checkbox checked={active} id="active" onCheckedChange={(v) => setActive(Boolean(v))} />
        <Label className="font-normal" htmlFor="active">
          Active — only active rules are considered when checking for due work
        </Label>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-3">
        <Button disabled={submitting} type="submit">
          {submitting ? 'Saving...' : isEditing ? 'Save changes' : 'Create rule'}
        </Button>
        <Button onClick={() => router.push('/dashboard/seo-rules')} type="button" variant="outline">
          Cancel
        </Button>
      </div>
    </form>
  )
}
