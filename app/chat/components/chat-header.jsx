"use client"

import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { ArrowLeft, History as HistoryIcon, Plus, Settings } from "lucide-react"

export function ChatHeader({ onBack, onNewChat, onOpenHistory, onOpenSettings }) {
  return (
    <header className="border-b bg-gradient-to-r from-background via-card/95 to-background backdrop-blur-md sticky top-0 z-50 shadow-lg shrink-0">
      <div className="container mx-auto px-1 sm:px-2 py-2 sm:py-3 flex items-center justify-between max-w-6xl">
        <div className="flex items-center gap-1 sm:gap-2 min-w-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="hover:scale-110 transition-transform shrink-0 min-w-[44px] min-h-[44px]"
          >
            <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4" />
          </Button>
          <div className="flex items-center gap-1 min-w-0">
            <div className="min-w-0">
              <h1 className="text-xs sm:text-sm font-semibold truncate">av9Assist</h1>
              <p className="text-xs text-muted-foreground hidden">AI Assistant</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={onNewChat}
            className="min-w-[44px] min-h-[44px] flex items-center gap-1.5 px-3"
            title="New Chat"
          >
            <Plus className="w-4 h-4" />
            <span className="text-xs sm:text-sm font-medium">New Chat</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onOpenHistory}
            className="min-w-[44px] min-h-[44px]"
            title="History"
          >
            <HistoryIcon className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onOpenSettings}
            className="min-w-[44px] min-h-[44px]"
            title="Settings"
          >
            <Settings className="w-4 h-4" />
          </Button>
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
