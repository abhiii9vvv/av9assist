'use client'

import * as React from 'react'
import { ThemeProvider as NextThemesProvider } from 'next-themes'

export function ThemeProvider({ children, ...props }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem={false}
      themes={['light', 'dark']}
      disableTransitionOnChange={false}
      storageKey="av9assist-theme"
      {...props}
    >
      {children}
    </NextThemesProvider>
  )
}
