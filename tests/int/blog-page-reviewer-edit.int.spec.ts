import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import React from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { mockPush, mockUseNexus, mockUseParams, mockGet, mockList, mockUpdate } = vi.hoisted(() => ({
  mockPush: vi.fn(),
  mockUseNexus: vi.fn(),
  mockUseParams: vi.fn(),
  mockGet: vi.fn(),
  mockList: vi.fn(),
  mockUpdate: vi.fn(),
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
    list: mockList,
    update: mockUpdate,
    decide: vi.fn(),
    remove: vi.fn(),
  },
  toNexusBlog: (blog: unknown) => blog,
}))

vi.mock('framer-motion', () => ({
  AnimatePresence: ({ children }: { children: React.ReactNode }) =>
    React.createElement(React.Fragment, null, children),
  useReducedMotion: () => false,
  useScroll: () => ({ scrollYProgress: 0 }),
  useSpring: (value: unknown) => value,
  useTransform: () => 0,
  motion: {
    button: ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) =>
      React.createElement('button', props, children),
    p: ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) =>
      React.createElement('p', props, children),
    div: ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) =>
      React.createElement('div', props, children),
  },
}))

import BlogPage from '../../src/app/(nexus)/nexus/article/[id]/page'

describe('reviewer editing', () => {
  beforeEach(() => {
    mockPush.mockReset()
    mockUseParams.mockReset()
    mockUseNexus.mockReset()
    mockGet.mockReset()
    mockList.mockReset()
    mockUpdate.mockReset()
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
    mockList.mockResolvedValue({ ok: true, data: { docs: [] } })
    mockUpdate.mockResolvedValue({
      ok: true,
      data: {
        doc: {
          id: '123',
          title: { en: 'Updated pending blog' },
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
      },
    })
  })

  it('shows the edit action for reviewers on pending blogs', async () => {
    render(React.createElement(BlogPage))

    expect(await screen.findByText('edit')).toBeTruthy()
  })

  it('saves reviewer edits on pending blogs', async () => {
    render(React.createElement(BlogPage))

    fireEvent.click(await screen.findByText('edit'))
    fireEvent.change(screen.getByDisplayValue('Pending blog'), {
      target: { value: 'Updated pending blog' },
    })
    fireEvent.click(screen.getByText('save'))

    await waitFor(() => {
      expect(mockUpdate).toHaveBeenCalledWith(
        '123',
        expect.objectContaining({ titleEn: 'Updated pending blog' }),
      )
    })
  })
})
