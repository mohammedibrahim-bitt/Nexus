'use client'

import { Moon, Sun } from 'lucide-react'
import React, { useEffect, useState } from 'react'

import { useTheme } from '..'

export const ThemeToggle: React.FC = () => {
  const { setTheme, theme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }

  return (
    <button
      aria-label="Toggle light and dark mode"
      className="flex size-9 items-center justify-center rounded-full text-foreground/80 transition-colors hover:bg-muted hover:text-foreground"
      onClick={toggleTheme}
      type="button"
    >
      {mounted && theme === 'dark' ? <Sun className="size-5" /> : <Moon className="size-5" />}
    </button>
  )
}
