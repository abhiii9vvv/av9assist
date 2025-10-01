"use client"

import { Moon, Sun, Palette, Sunset, Trees, Zap } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useEffect, useState } from "react"

const themes = [
  { name: 'light', label: 'Ocean Light', icon: Sun, description: 'Cool and professional' },
  { name: 'dark', label: 'Midnight Dark', icon: Moon, description: 'Sleek and modern' },
  { name: 'sunset', label: 'Sunset Vibes', icon: Sunset, description: 'Warm and vibrant' },
  { name: 'forest', label: 'Forest Calm', icon: Trees, description: 'Natural and soothing' },
  { name: 'cyberpunk', label: 'Cyberpunk Neon', icon: Zap, description: 'Futuristic and bold' },
]

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Simple theme cycle function as fallback
  const cycleTheme = () => {
    const currentIndex = themes.findIndex(t => t.name === (resolvedTheme || theme))
    const nextIndex = (currentIndex + 1) % themes.length
    const nextTheme = themes[nextIndex].name
    console.log('Cycling theme from', resolvedTheme || theme, 'to', nextTheme)
    setTheme(nextTheme)
  }

  // Handle theme change with debugging
  const handleThemeChange = (newTheme) => {
    console.log('Changing theme from', resolvedTheme || theme, 'to', newTheme)
    setTheme(newTheme)
  }

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className="w-10 h-10">
        <div className="w-4 h-4" />
      </Button>
    )
  }

  const currentTheme = themes.find(t => t.name === (resolvedTheme || theme)) || themes[0]
  const CurrentIcon = currentTheme.icon

  return (
    <div className="relative">
      {/* Fallback button that cycles themes */}
      <Button
        variant="ghost"
        size="icon"
        onClick={cycleTheme}
        onMouseDown={(e) => {
          console.log('Theme button mouse down', e)
          e.stopPropagation()
        }}
        onTouchStart={(e) => {
          console.log('Theme button touch start', e)
          e.stopPropagation()
        }}
        className="w-10 h-10 transition-all duration-300 hover:scale-110 hover:bg-accent/50 relative z-50 flex items-center justify-center"
        aria-label={`Current theme: ${currentTheme.label}. Click to cycle themes.`}
        type="button"
        style={{ 
          touchAction: 'manipulation',
          userSelect: 'none',
          WebkitTouchCallout: 'none',
          WebkitUserSelect: 'none'
        }}
      >
        <CurrentIcon className="w-4 h-4 transition-all duration-300" />
      </Button>

      {/* Hidden dropdown for advanced users (if working) */}
      <div className="absolute inset-0 opacity-0 hover:opacity-100 focus-within:opacity-100 transition-opacity">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="w-10 h-10 transition-all duration-300 hover:scale-110 hover:bg-accent/50 relative z-40 flex items-center justify-center"
              aria-label="Select theme from menu"
              type="button"
            >
              <CurrentIcon className="w-4 h-4 transition-all duration-300" />
            </Button>
          </DropdownMenuTrigger>
          
          <DropdownMenuContent 
            align="end" 
            className="w-56 glass-card border-0 bg-popover z-[100]"
            sideOffset={8}
          >
            <div className="p-2">
              <div className="text-xs font-medium text-muted-foreground mb-2 px-2">Choose Theme</div>
              {themes.map((themeOption) => {
                const Icon = themeOption.icon
                const isActive = (resolvedTheme || theme) === themeOption.name
                return (
                  <DropdownMenuItem
                    key={themeOption.name}
                    onSelect={(e) => {
                      e.preventDefault()
                      handleThemeChange(themeOption.name)
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-200 focus:outline-none ${
                      isActive 
                        ? 'bg-primary/15 text-primary font-medium' 
                        : 'hover:bg-accent/50 focus:bg-accent/50'
                    }`}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="text-sm">{themeOption.label}</div>
                      <div className="text-xs text-muted-foreground">{themeOption.description}</div>
                    </div>
                    {isActive && (
                      <div className="w-2 h-2 bg-primary rounded-full animate-pulse flex-shrink-0" />
                    )}
                  </DropdownMenuItem>
                )
              })}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
