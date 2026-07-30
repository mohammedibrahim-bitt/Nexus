'use client'

import { Button } from '@/components/ui/button'
import { getMediaUrl } from '@/utilities/getMediaUrl'
import React, { useRef, useState } from 'react'

export type UploadedMedia = { id: number | string; url?: null | string }

export const MediaUploader: React.FC<{
  label?: string
  onChange: (media: null | UploadedMedia) => void
  value: null | UploadedMedia
}> = ({ label = 'Image', onChange, value }) => {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<null | string>(null)

  const handleFile = async (file: File) => {
    setUploading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/media', {
        body: formData,
        credentials: 'include',
        method: 'POST',
      })

      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.errors?.[0]?.message || 'Upload failed')
      }

      const data = await res.json()
      const doc = data?.doc
      onChange({ id: doc.id, url: doc.url })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium">{label}</span>

      {value && (
        <div className="relative w-full max-w-xs overflow-hidden rounded-lg border border-border">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img alt="" className="aspect-video w-full object-cover" src={getMediaUrl(value.url)} />
        </div>
      )}

      <div className="flex items-center gap-2">
        <input
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) void handleFile(file)
            e.target.value = ''
          }}
          ref={inputRef}
          type="file"
        />
        <Button
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          type="button"
          variant="outline"
        >
          {uploading ? 'Uploading...' : value ? 'Replace image' : 'Upload image'}
        </Button>
        {value && (
          <Button onClick={() => onChange(null)} type="button" variant="ghost">
            Remove
          </Button>
        )}
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  )
}
