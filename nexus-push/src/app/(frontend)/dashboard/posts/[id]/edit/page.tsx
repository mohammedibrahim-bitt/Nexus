'use client'

import { useParams } from 'next/navigation'
import React from 'react'

import { PostEditorForm } from '../../PostEditorForm'

export default function EditPostPage() {
  const params = useParams<{ id: string }>()

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-xl font-semibold">Edit post</h2>
      <PostEditorForm postId={params.id} />
    </div>
  )
}
