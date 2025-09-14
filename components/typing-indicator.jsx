"use client"

import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { MessageCircle } from "lucide-react"

export function TypingIndicator() {
  return (
    <div className="flex gap-3 animate-in slide-in-from-bottom-2 duration-300">
      {/* Avatar */}
      <Avatar className="w-8 h-8 mt-1">
        <AvatarFallback className="bg-secondary text-secondary-foreground text-xs font-medium">
          <MessageCircle className="w-4 h-4" />
        </AvatarFallback>
      </Avatar>

      {/* Typing Animation */}
      <div className="flex flex-col gap-1 max-w-[80%] md:max-w-[70%]">
        <Card className="px-4 py-3 border-0 bg-muted text-muted-foreground rounded-2xl rounded-bl-md shadow-sm">
          <div className="flex items-center gap-1">
            <span className="text-sm text-muted-foreground">AI is typing</span>
            <div className="flex gap-1 ml-2">
              <div className="w-1.5 h-1.5 bg-muted-foreground/60 rounded-full animate-bounce [animation-delay:-0.3s]" />
              <div className="w-1.5 h-1.5 bg-muted-foreground/60 rounded-full animate-bounce [animation-delay:-0.15s]" />
              <div className="w-1.5 h-1.5 bg-muted-foreground/60 rounded-full animate-bounce" />
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
