'use client'

import { Moon, Sun } from 'lucide-react'
import React from 'react'

import { useTheme } from '..'

export const ThemeToggle: React.FC = () => {
  const { setTheme, theme } = useTheme()

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }

  return (
    <button
      aria-label="Toggle light and dark mode"
      className="flex size-9 items-center justify-center rounded-full text-primary transition-colors hover:bg-muted"
      onClick={toggleTheme}
      type="button"
    >
      {theme === 'dark' ? <Sun className="size-5" /> : <Moon className="size-5" />}
    </button>
  )
}
