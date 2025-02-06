"use client"

import { ThemeProvider as NextThemesProvider } from "next-themes"
import type { ThemeProviderProps } from "next-themes"
import { useEffect } from "react"

export function DarkThemeProvider({ children, ...props }: ThemeProviderProps) {
  useEffect(() => {
    document.documentElement.classList.add("dark")
  }, [])

  return (
    <NextThemesProvider {...props} forcedTheme="dark" enableSystem={false} attribute="class">
      {children}
    </NextThemesProvider>
  )
}

