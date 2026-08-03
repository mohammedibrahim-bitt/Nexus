'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { MessageSquareText } from 'lucide-react'
import React, { useState } from 'react'

import { useStaffAuth } from '@/providers/StaffAuth'

type ReviewItem = {
  id: string
  comment: string
  createdAt: string
  rating: number
  reviewerName: string
}

const Stars: React.FC<{ onChange?: (value: number) => void; value: number }> = ({
  onChange,
  value,
}) => {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          aria-label={`${star} star${star > 1 ? 's' : ''}`}
          className={`text-2xl leading-none ${
            star <= value ? 'text-yellow-500' : 'text-neutral-300'
          } ${onChange ? 'cursor-pointer' : 'cursor-default'}`}
          key={star}
          onClick={onChange ? () => onChange(star) : undefined}
          type="button"
        >
          ★
        </button>
      ))}
    </div>
  )
}

export const PostReviewsClient: React.FC<{
  initialReviews: ReviewItem[]
  postId: string
}> = ({ initialReviews, postId }) => {
  const { staff, loading: checkingSession, login, signup } = useStaffAuth()
  const [reviews, setReviews] = useState(initialReviews)
  const [mode, setMode] = useState<'login' | 'signup'>('signup')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [error, setError] = useState<null | string>(null)
  const [status, setStatus] = useState<'idle' | 'submitted' | 'submitting'>('idle')
  const [awaitingVerification, setAwaitingVerification] = useState(false)

  const averageRating =
    reviews.length > 0
      ? Math.round((reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length) * 10) / 10
      : null

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    try {
      if (mode === 'signup') {
        await signup(name, email, password)
        setAwaitingVerification(true)
      } else {
        await login(email, password)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    }
  }

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (rating < 1) {
      setError('Please select a star rating')
      return
    }

    setStatus('submitting')

    try {
      const res = await fetch('/api/reviews', {
        body: JSON.stringify({ comment, post: Number(postId), rating }),
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data?.errors?.[0]?.message || 'Could not submit your review')
      }

      setStatus('submitted')
      setComment('')
      setRating(0)
    } catch (err) {
      setStatus('idle')
      setError(err instanceof Error ? err.message : 'Something went wrong')
    }
  }

  return (
    <div className="mt-12 max-w-[48rem] mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <h2 className="flex items-center gap-2 text-2xl font-semibold">
          <MessageSquareText className="size-5" />
          Reviews
        </h2>
        {averageRating !== null && (
          <div className="flex items-center gap-2">
            <Stars value={Math.round(averageRating)} />
            <span className="text-sm text-neutral-500">
              {averageRating} ({reviews.length})
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-6 mb-10">
        {reviews.length === 0 && (
          <p className="text-neutral-500">No reviews yet. Be the first to leave one.</p>
        )}
        {reviews.map((review) => (
          <div className="border-b pb-4" key={review.id}>
            <div className="flex items-center gap-3 mb-1">
              <Stars value={review.rating} />
              <span className="font-medium">{review.reviewerName}</span>
              <span className="text-sm text-neutral-500">
                {new Date(review.createdAt).toLocaleDateString()}
              </span>
            </div>
            <p>{review.comment}</p>
          </div>
        ))}
      </div>

      {!checkingSession && (
        <div className="border rounded-xl bg-card p-6 shadow-[var(--shadow-card)]">
          {awaitingVerification && !staff ? (
            <p>
              Almost there! We sent a verification link to <strong>{email}</strong>. Click it to
              activate your account, then log in to leave your review.
            </p>
          ) : !staff ? (
            <form className="flex flex-col gap-4 max-w-sm" onSubmit={handleAuth}>
              <h3 className="text-lg font-medium">
                {mode === 'signup' ? 'Create an account to leave a review' : 'Log in to leave a review'}
              </h3>

              {mode === 'signup' && (
                <div className="flex flex-col gap-1">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    onChange={(e) => setName(e.target.value)}
                    required
                    value={name}
                  />
                </div>
              )}

              <div className="flex flex-col gap-1">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  type="email"
                  value={email}
                />
              </div>

              <div className="flex flex-col gap-1">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  type="password"
                  value={password}
                />
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <Button type="submit">{mode === 'signup' ? 'Sign up' : 'Log in'}</Button>

              <button
                className="text-sm text-neutral-500 underline text-left"
                onClick={() => {
                  setMode(mode === 'signup' ? 'login' : 'signup')
                  setError(null)
                }}
                type="button"
              >
                {mode === 'signup'
                  ? 'Already have an account? Log in'
                  : "Don't have an account? Sign up"}
              </button>
            </form>
          ) : status === 'submitted' ? (
            <p>Thanks, {staff.name}! Your review has been published.</p>
          ) : (
            <form className="flex flex-col gap-4 max-w-lg" onSubmit={handleSubmitReview}>
              <h3 className="text-lg font-medium">Leave a review, {staff.name}</h3>

              <div className="flex flex-col gap-1">
                <Label>Rating</Label>
                <Stars onChange={setRating} value={rating} />
              </div>

              <div className="flex flex-col gap-1">
                <Label htmlFor="comment">Comment</Label>
                <Textarea
                  id="comment"
                  onChange={(e) => setComment(e.target.value)}
                  required
                  rows={4}
                  value={comment}
                />
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <Button disabled={status === 'submitting'} type="submit">
                {status === 'submitting' ? 'Submitting...' : 'Submit review'}
              </Button>
            </form>
          )}
        </div>
      )}
    </div>
  )
}
