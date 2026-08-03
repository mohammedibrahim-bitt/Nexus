'use client'

import React from 'react'

import { PostEditorForm } from '../PostEditorForm'

export default function NewPostPage() {
  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-xl font-semibold">Write a new post</h2>
      <PostEditorForm />
    </div>
  )
}
