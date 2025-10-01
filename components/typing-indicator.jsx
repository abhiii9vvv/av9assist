"use client"

import { useState, useEffect, memo } from "react"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { MessageCircle } from "lucide-react"

const typingMessages = [
  "AI is thinking",
  "AI is analyzing",
  "AI is generating",
  "AI is crafting response"
]

export const TypingIndicator = memo(function TypingIndicator() {
  const [messageIndex, setMessageIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % typingMessages.length)
    }, 2000) // Change message every 2 seconds

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex gap-3 animate-in slide-in-from-bottom-1 duration-300 ease-out">
      {/* Avatar */}
      <Avatar className="w-8 h-8 mt-1 transition-transform duration-300 hover:scale-105 animate-pulse">
        <AvatarFallback className="bg-secondary text-secondary-foreground text-xs font-medium">
          <MessageCircle className="w-4 h-4" />
        </AvatarFallback>
      </Avatar>

      {/* Enhanced Typing Animation */}
      <div className="flex flex-col gap-1 max-w-[80%] md:max-w-[70%]">
        <Card className="px-4 py-3 border-0 glass-card rounded-2xl rounded-bl-md transition-all duration-300 will-change-transform hover:shadow-lg">
          <div className="flex items-center gap-1">
            <span className="text-sm text-muted-foreground transition-all duration-500 ease-in-out">
              {typingMessages[messageIndex]}
            </span>
            <div className="flex gap-1 ml-2">
              <div className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce [animation-duration:1.4s] [animation-delay:0s]" />
              <div className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce [animation-duration:1.4s] [animation-delay:0.2s]" />
              <div className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce [animation-duration:1.4s] [animation-delay:0.4s]" />
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
})
