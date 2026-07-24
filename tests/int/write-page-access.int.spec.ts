import { render, screen } from '@testing-library/react'
import React from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockUseNexus = vi.fn()

vi.mock('@/nexus/NexusProvider', () => ({
  useNexus: () => mockUseNexus(),
}))

vi.mock('@/nexus/api', () => ({
  postsApi: {
    list: vi.fn().mockResolvedValue({ ok: true, data: { docs: [] } }),
    create: vi.fn(),
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
    div: ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) =>
      React.createElement('div', props, children),
  },
}))

import WritePage from '../../src/app/(nexus)/nexus/write/page'

describe('write page access', () => {
  beforeEach(() => {
    mockUseNexus.mockReset()
    mockUseNexus.mockReturnValue({
      tr: (key: string) => key,
      lang: 'en',
      role: 'user',
      authLoading: false,
      currentUser: { id: 1, name: 'Normal User' },
      settings: { animations: false },
    })
  })

  it('lets normal users access the write page', async () => {
    render(React.createElement(WritePage))

    expect(await screen.findByText('writeTitle')).toBeTruthy()
  })

  it('blocks guests from the write page', () => {
    mockUseNexus.mockReturnValue({
      tr: (key: string) => key,
      lang: 'en',
      role: null,
      authLoading: false,
      currentUser: null,
      settings: { animations: false },
    })

    render(React.createElement(WritePage))

    expect(screen.getByText('writeAccessRequired')).toBeTruthy()
  })
})
