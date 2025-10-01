'use client'

import * as React from 'react'
import { ThemeProvider as NextThemesProvider } from 'next-themes'

export function ThemeProvider({ children, ...props }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={true}
      themes={[
        'light',      // Ocean theme (default light)
        'dark',       // Midnight theme (default dark) 
        'sunset',     // Warm sunset theme
        'forest',     // Natural forest theme
        'cyberpunk',  // Neon cyberpunk theme
        'system'
      ]}
      disableTransitionOnChange={false}
      storageKey="av9assist-theme"
      {...props}
    >
      {children}
    </NextThemesProvider>
  )
}
