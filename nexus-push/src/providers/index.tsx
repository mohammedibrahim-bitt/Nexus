import React from 'react'

import { HeaderThemeProvider } from './HeaderTheme'
import { StaffAuthProvider } from './StaffAuth'
import { ThemeProvider } from './Theme'

export const Providers: React.FC<{
  children: React.ReactNode
}> = ({ children }) => {
  return (
    <ThemeProvider>
      <HeaderThemeProvider>
        <StaffAuthProvider>{children}</StaffAuthProvider>
      </HeaderThemeProvider>
    </ThemeProvider>
  )
}
