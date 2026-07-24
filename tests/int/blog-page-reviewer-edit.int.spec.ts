import { render, screen } from '@testing-library/react'
import React from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { mockPush, mockUseNexus, mockUseParams, mockGet } = vi.hoisted(() => ({
  mockPush: vi.fn(),
  mockUseNexus: vi.fn(),
  mockUseParams: vi.fn(),
  mockGet: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
  }),
  useParams: () => mockUseParams(),
}))

vi.mock('@/nexus/NexusProvider', () => ({
  useNexus: () => mockUseNexus(),
}))

vi.mock('@/nexus/api', () => ({
  postsApi: {
    get: mockGet,
    update: vi.fn().mockResolvedValue({ ok: true, data: { doc: {} } }),
    decide: vi.fn(),
    remove: vi.fn(),
  },
  toNexusBlog: (blog: unknown) => blog,
}))

vi.mock('framer-motion', () => ({
  AnimatePresence: ({ children }: { children: React.ReactNode }) =>
    React.createElement(React.Fragment, null, children),
  useReducedMotion: () => false,
  motion: {
    button: ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) =>
      React.createElement('button', props, children),
    p: ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) =>
      React.createElement('p', props, children),
    div: ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) =>
      React.createElement('div', props, children),
  },
}))

import BlogPage from '../../src/app/(nexus)/nexus/blog/[id]/page'

describe('reviewer editing', () => {
  beforeEach(() => {
    mockPush.mockReset()
    mockUseParams.mockReset()
    mockUseNexus.mockReset()
    mockGet.mockReset()
    mockUseParams.mockReturnValue({ id: '123' })
    mockUseNexus.mockReturnValue({
      tr: (key: string) => key,
      lang: 'en',
      role: 'reviewer',
      currentUser: null,
      settings: { animations: false },
    })
    mockGet.mockResolvedValue({
      ok: true,
      data: {
        id: '123',
        title: { en: 'Pending blog' },
        description: { en: 'A pending review' },
        content: { en: ['Body copy'] },
        references: [],
        tag: { en: 'Tag' },
        createdAt: 'Today',
        readMinutes: 3,
        author: 'Author',
        status: 'pending',
        model: 'OpenAI',
      },
    })
  })

  it('shows the edit action for reviewers on pending blogs', async () => {
    render(React.createElement(BlogPage))

    expect(await screen.findByText('edit')).toBeTruthy()
  })
})
