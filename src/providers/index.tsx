import React from 'react'

import { CustomerAuthProvider } from './CustomerAuth'
import { HeaderThemeProvider } from './HeaderTheme'
import { ThemeProvider } from './Theme'

export const Providers: React.FC<{
  children: React.ReactNode
}> = ({ children }) => {
  return (
    <ThemeProvider>
      <HeaderThemeProvider>
        <CustomerAuthProvider>{children}</CustomerAuthProvider>
      </HeaderThemeProvider>
    </ThemeProvider>
  )
}
