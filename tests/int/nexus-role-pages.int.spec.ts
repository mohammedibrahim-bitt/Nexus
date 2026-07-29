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
  },
  toNexusBlog: (blog: unknown) => blog,
}))

import AdminPanelPage from '../../src/app/(nexus)/nexus/admin/page'

describe('Nexus admin access', () => {
  beforeEach(() => {
    mockUseNexus.mockReset()
    mockUseNexus.mockReturnValue({
      tr: (key: string) => key,
      lang: 'en',
      role: 'reviewer',
      authLoading: false,
    })
  })

  it('blocks reviewers from the admin panel', () => {
    render(React.createElement(AdminPanelPage))

    expect(screen.getByText('adminOnly')).toBeTruthy()
  })
})
