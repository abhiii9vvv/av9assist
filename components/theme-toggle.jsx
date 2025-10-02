"use client"

import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Toggle between light and dark
  const toggleTheme = () => {
    const currentTheme = resolvedTheme || theme
    const nextTheme = currentTheme === 'dark' ? 'light' : 'dark'
    setTheme(nextTheme)
  }

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className="w-10 h-10">
        <div className="w-4 h-4" />
      </Button>
    )
  }

  const isDark = (resolvedTheme || theme) === 'dark'

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className="w-10 h-10 transition-all duration-300 hover:scale-110 hover:bg-accent/50"
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      type="button"
    >
      {isDark ? (
        <Sun className="w-5 h-5 transition-all duration-300" />
      ) : (
        <Moon className="w-5 h-5 transition-all duration-300" />
      )}
    </Button>
  )
}
