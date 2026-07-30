'use client'

import { Button } from '@/components/ui/button'
import { getMediaUrl } from '@/utilities/getMediaUrl'
import { getCroppedImageBlob, type CropArea } from '@/utilities/getCroppedImageBlob'
import React, { useCallback, useRef, useState } from 'react'
import Cropper from 'react-easy-crop'
import 'react-easy-crop/react-easy-crop.css'

export type UploadedMedia = { id: number | string; url?: null | string }

export const AvatarUploader: React.FC<{
  onChange: (media: null | UploadedMedia) => void
  value: null | UploadedMedia
}> = ({ onChange, value }) => {
  const inputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<null | string>(null)
  const [uploading, setUploading] = useState(false)

  // Cropping is a two-step flow: pick a file (rendered locally as an object
  // URL, nothing uploaded yet) -> drag/zoom to crop -> only THEN upload the
  // cropped square. Nothing hits the server until the crop is confirmed.
  const [pendingImageSrc, setPendingImageSrc] = useState<null | string>(null)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedArea, setCroppedArea] = useState<CropArea | null>(null)

  const onCropComplete = useCallback((_croppedAreaPercent: unknown, croppedAreaPixels: CropArea) => {
    setCroppedArea(croppedAreaPixels)
  }, [])

  const pickFile = (file: File) => {
    setError(null)
    setPendingImageSrc(URL.createObjectURL(file))
    setCrop({ x: 0, y: 0 })
    setZoom(1)
    setCroppedArea(null)
  }

  const cancelCrop = () => {
    if (pendingImageSrc) URL.revokeObjectURL(pendingImageSrc)
    setPendingImageSrc(null)
  }

  const confirmCrop = async () => {
    if (!pendingImageSrc || !croppedArea) return

    setUploading(true)
    setError(null)

    try {
      const blob = await getCroppedImageBlob(pendingImageSrc, croppedArea)
      const formData = new FormData()
      formData.append('file', blob, 'avatar.jpg')

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
      onChange({ id: data.doc.id, url: data.doc.url })
      cancelCrop()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium">Profile picture</span>

      <div className="flex items-center gap-4">
        <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-muted">
          {value?.url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img alt="" className="size-full object-cover" src={getMediaUrl(value.url)} />
          ) : (
            <span className="text-xs text-muted-foreground">No image</span>
          )}
        </div>

        <input
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) pickFile(file)
            e.target.value = ''
          }}
          ref={inputRef}
          type="file"
        />
        <div className="flex gap-2">
          <Button onClick={() => inputRef.current?.click()} type="button" variant="outline">
            {value ? 'Change photo' : 'Upload photo'}
          </Button>
          {value && (
            <Button onClick={() => onChange(null)} type="button" variant="ghost">
              Remove
            </Button>
          )}
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {pendingImageSrc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="flex w-full max-w-sm flex-col gap-4 rounded-xl border border-border bg-background p-4 shadow-lg">
            <p className="text-sm font-medium">Crop your photo</p>

            <div className="relative h-64 w-full overflow-hidden rounded-lg bg-muted">
              <Cropper
                aspect={1}
                crop={crop}
                cropShape="round"
                image={pendingImageSrc}
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
                showGrid={false}
                zoom={zoom}
              />
            </div>

            <input
              className="w-full"
              max={3}
              min={1}
              onChange={(e) => setZoom(Number(e.target.value))}
              step={0.01}
              type="range"
              value={zoom}
            />

            <div className="flex justify-end gap-2">
              <Button onClick={cancelCrop} type="button" variant="outline">
                Cancel
              </Button>
              <Button disabled={uploading || !croppedArea} onClick={confirmCrop} type="button">
                {uploading ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
