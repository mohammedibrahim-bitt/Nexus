'use client'

import { useTheme } from '@payloadcms/ui'
import { Moon, Sun } from 'lucide-react'
import React from 'react'

export const ThemeToggle: React.FC = () => {
  const { theme, setTheme } = useTheme()

  const toggle = () => setTheme(theme === 'dark' ? 'light' : 'dark')

  return (
    <button
      type="button"
      onClick={toggle}
      title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      aria-label="Toggle color theme"
      style={{
        alignItems: 'center',
        background: 'transparent',
        border: '1px solid var(--theme-elevation-150)',
        borderRadius: 'var(--style-radius-m)',
        cursor: 'pointer',
        display: 'inline-flex',
        height: '2rem',
        justifyContent: 'center',
        width: '2rem',
      }}
    >
      {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  )
}

export default ThemeToggle
