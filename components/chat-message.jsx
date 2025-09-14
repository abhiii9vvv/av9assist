"use client"

import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { MessageCircle, User, Bot, Check, Clock, Copy, ThumbsUp, ThumbsDown, RotateCcw, Edit3 } from "lucide-react"
import { cn } from "@/lib/utils"
import { createPortal } from "react-dom"
import { useState, useEffect } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import rehypeHighlight from "rehype-highlight"

export function ChatMessage({
  message,
  onRegenerate,
  onEdit,
  isLast = false,
  onFeedback,
  isTyping = false,
  showTimestamp = true,
  showActions = true
}) {
  const isUser = message.sender === "user"
  const [copiedCode, setCopiedCode] = useState(null)
  const [showCenterCopied, setShowCenterCopied] = useState(false)
  const [messageTime, setMessageTime] = useState("")

  // Update relative time every minute
  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      const msgTime = new Date(message.timestamp)
      const diffMs = now - msgTime
      const diffMins = Math.floor(diffMs / 60000)
      const diffHours = Math.floor(diffMins / 60)
      const diffDays = Math.floor(diffHours / 24)

      if (diffMins < 1) {
        setMessageTime("now")
      } else if (diffMins < 60) {
        setMessageTime(`${diffMins}m ago`)
      } else if (diffHours < 24) {
        setMessageTime(`${diffHours}h ago`)
      } else if (diffDays < 7) {
        setMessageTime(`${diffDays}d ago`)
      } else {
        setMessageTime(msgTime.toLocaleDateString())
      }
    }

    updateTime()
    const interval = setInterval(updateTime, 60000) // Update every minute
    return () => clearInterval(interval)
  }, [message.timestamp])

  const formatTime = (ts) => {
    try {
      const d = ts instanceof Date ? ts : new Date(ts)
      if (isNaN(d.getTime())) return ""
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    } catch {
      return ""
    }
  }

  const copyCode = async (code, index) => {
    const text = String(code ?? "")
    const succeed = async () => {
      setCopiedCode(index)
      // Keep the check icon visible for ~3.5 seconds
      setTimeout(() => setCopiedCode(null), 3500)
      // Show a center-screen confirmation briefly
      setShowCenterCopied(true)
      setTimeout(() => setShowCenterCopied(false), 1200)
    }
    try {
      if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
        await navigator.clipboard.writeText(text)
        await succeed()
        return
      }
    } catch (e) {
      // fall through to legacy
    }

    // Fallback for iOS / older browsers / non-secure contexts
    try {
      const ta = document.createElement("textarea")
      ta.value = text
      ta.setAttribute("readonly", "")
      ta.style.position = "absolute"
      ta.style.left = "-9999px"
      document.body.appendChild(ta)
      ta.select()
      ta.setSelectionRange(0, ta.value.length)
      const ok = document.execCommand("copy")
      document.body.removeChild(ta)
      if (ok) await succeed()
    } catch (e) {
      console.error("Copy failed", e)
    }
  }

  // Removed message-level copy to avoid duplicate buttons with code block copy

  // Markdown code renderer as a proper React component to satisfy hooks rules
  // Extract plain text from possibly highlighted react children
  const getTextFromChildren = (nodes) => {
    if (nodes == null) return ""
    if (typeof nodes === "string" || typeof nodes === "number") return String(nodes)
    if (Array.isArray(nodes)) return nodes.map(getTextFromChildren).join("")
    if (typeof nodes === "object" && nodes.props) return getTextFromChildren(nodes.props.children)
    return ""
  }

  const CodeRenderer = ({ inline, className, children, ...props }) => {
    const [codeIndex] = useState(() => Math.random())
    const match = /language-(\w+)/.exec(className || "")
    const code = getTextFromChildren(children).trim()

    if (inline) {
      return (
        <code className="px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-primary/15 to-primary/8 border border-primary/25 text-primary/90 font-mono text-sm font-medium shadow-sm hover:shadow-md transition-all duration-300 hover:from-primary/20 hover:to-primary/10" {...props}>
          {children}
        </code>
      )
    }

    const isSingleLine = !code.includes("\n")
    const isShort = code.length <= 80

    if (isSingleLine && isShort) {
      return (
        <code className="px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-primary/15 to-primary/8 border border-primary/25 text-primary/90 font-mono text-sm font-medium shadow-sm hover:shadow-md transition-all duration-300" {...props}>
          {code}
        </code>
      )
    }

    return (
      <div className={cn("group/code relative max-w-full my-5")}> 
        {/* Optional code block header (language + window dots) */}
        {match?.[1] && (
          <div className="mb-2 px-0">
            <span className="text-xs font-medium text-muted-foreground/80 uppercase tracking-wide">
              {match[1]}
            </span>
          </div>
        )}

        <pre
          className={cn(
            className,
            "relative z-0 overflow-x-auto max-w-full rounded-xl font-mono text-sm shadow-xl border border-border/40",
            "bg-gradient-to-br from-background/95 via-background/90 to-background/80",
            "backdrop-blur-sm p-5 transition-all duration-500 hover:shadow-2xl"
          )}
          {...props}
        >
          <code className={cn(className, "text-foreground/95 leading-relaxed")}>{children}</code>
          {/* Icon-only copy button inside the code block */}
          <button
            onClick={() => copyCode(code, codeIndex)}
            type="button"
            aria-label={copiedCode === codeIndex ? "Copied" : "Copy code"}
            aria-pressed={copiedCode === codeIndex}
            title={copiedCode === codeIndex ? "Copied" : "Copy code"}
            className={cn(
              "absolute top-2 right-2 inline-flex items-center justify-center z-10 select-none",
              "h-8 w-8 rounded-md border",
              copiedCode === codeIndex
                ? "bg-green-500 text-white border-green-600 shadow-lg shadow-green-500/30 ring-2 ring-green-300 ring-offset-2 ring-offset-background scale-110"
                : "bg-background/90 backdrop-blur-sm border-border/60 text-foreground hover:bg-background",
              "transition duration-200"
            )}
          >
            {copiedCode === codeIndex ? (
              <Check className="w-4 h-4" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </button>
        </pre>
      </div>
    )
  }

  return (
    <div
      className={cn(
        "group flex gap-4 animate-in slide-in-from-bottom-2 duration-700 ease-out",
        "hover:bg-gradient-to-r hover:from-transparent hover:via-muted/20 hover:to-transparent",
        "px-2 py-1 rounded-lg transition-all duration-300",
        isUser ? "flex-row-reverse" : "flex-row",
      )}
    >
      {/* Avatar shown only for user messages (AI bubble has header above instead) */}
      {isUser && (
        <div className="relative flex-shrink-0">
          <Avatar className={cn(
            "w-8 h-8 sm:w-9 sm:h-9 transition-all duration-300 ring-2",
            "ring-primary/30 hover:ring-primary/50",
            "shadow-lg hover:shadow-xl"
          )}>
            <AvatarFallback
              className={cn(
                "text-sm font-semibold transition-all duration-300",
                "bg-gradient-to-br from-primary to-primary/80 text-primary-foreground hover:from-primary/90 hover:to-primary/70",
              )}
            >
              <User className="w-4 h-4 sm:w-5 sm:h-5" />
            </AvatarFallback>
          </Avatar>
        </div>
      )}

      {/* Message Content Container */}
      <div
        className={cn(
          "flex flex-col gap-2 min-w-0 flex-1",
          // Widen bubbles on all breakpoints
          "max-w-[96%] xs:max-w-[92%] sm:max-w-[90%] md:max-w-[86%] lg:max-w-[82%] xl:max-w-[78%]",
          isUser ? "items-end" : "items-start",
        )}
      >
        {/* AI header (icon + name) above the bubble */}
        {!isUser && (
          <div className="flex items-center gap-2 mb-1 text-xs text-muted-foreground pl-0.5">
            <Bot className="w-3.5 h-3.5" />
            <span>av9Assist</span>
          </div>
        )}

        <Card
          className={cn(
            "relative overflow-hidden transition-all duration-300",
            "shadow-md hover:shadow-lg backdrop-blur-md px-4 py-3",
            "before:absolute before:inset-0 before:rounded-2xl before:pointer-events-none",
            "after:absolute after:inset-0 after:rounded-2xl after:opacity-0 hover:after:opacity-100 after:pointer-events-none",
            "after:transition-opacity after:duration-500",
            isUser
              ? [
                  "bg-gradient-to-br from-primary via-primary/95 to-primary/85",
                  "text-primary-foreground",
                  "rounded-2xl rounded-br-md",
                  "before:bg-gradient-to-r before:from-white/10 before:via-white/5 before:to-transparent",
                  "after:bg-gradient-to-r after:from-white/20 after:via-white/10 after:to-transparent",
                ]
              : [
                  "bg-gradient-to-br from-card via-card/98 to-card/92",
                  "text-foreground",
                  "rounded-2xl rounded-bl-md",
                  "before:bg-gradient-to-r before:from-primary/5 before:via-primary/10 before:to-transparent",
                  "after:bg-gradient-to-r after:from-primary/12 after:via-primary/8 after:to-transparent",
                ]
          )}
        >
          {/* Removed in-bubble label and relative time for a cleaner, smaller bubble */}

          <div className="max-w-full relative">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeHighlight]}
              components={{
                h1: ({ node, ...props }) => (
                  <h1 className="text-2xl font-bold mt-6 mb-4 pb-3 border-b-2 border-primary/30 bg-gradient-to-r from-primary/8 to-transparent -mx-1 px-3 rounded-lg break-words max-w-none text-foreground/95" {...props} />
                ),
                h2: ({ node, ...props }) => (
                  <h2 className="text-xl font-semibold mt-5 mb-3 text-primary/90 break-words max-w-none flex items-center gap-2" {...props}>
                    <div className="w-1 h-6 bg-primary/40 rounded-full" />
                    {props.children}
                  </h2>
                ),
                h3: ({ node, ...props }) => (
                  <h3 className="text-lg font-medium mt-4 mb-2 text-primary/80 break-words max-w-none" {...props} />
                ),
                p: ({ node, ...props }) => (
                  <p className="leading-relaxed whitespace-pre-wrap break-words my-3 max-w-none text-foreground/95 text-base" {...props} />
                ),
                hr: (props) => <hr className="my-6 border-0 h-px bg-gradient-to-r from-transparent via-border/60 to-transparent" {...props} />,
                a: ({ node, ...props }) => (
                  <a
                    className="text-primary hover:text-primary/80 underline underline-offset-4 hover:underline-offset-2 decoration-2 transition-all duration-300 break-words break-all max-w-none font-medium hover:bg-primary/5 px-1 py-0.5 rounded"
                    target="_blank"
                    rel="noreferrer"
                    {...props}
                  />
                ),
                ul: ({ node, ordered, ...props }) => (
                  <ul className="list-disc pl-6 my-4 space-y-2 max-w-none marker:text-primary/70 marker:text-lg" {...props} />
                ),
                ol: ({ node, ordered, ...props }) => (
                  <ol className="list-decimal pl-6 my-4 space-y-2 max-w-none marker:text-primary/70 marker:font-semibold" {...props} />
                ),
                li: ({ node, checked, ...props }) => <li className="leading-relaxed break-words text-foreground/95 pl-1 max-w-none" {...props} />,
                blockquote: ({ node, ...props }) => (
                  <blockquote className="border-l-4 border-primary/50 pl-5 my-5 py-3 bg-gradient-to-r from-primary/5 to-primary/3 rounded-r-lg italic text-foreground/85 max-w-none relative before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 before:bg-primary/20 before:rounded-full" {...props} />
                ),
                img: ({ node, alt, ...props }) => (
                  <div className="my-4 group/image">
                    <img
                      className="rounded-xl border-2 border-border/40 max-h-96 max-w-full h-auto shadow-lg hover:shadow-xl transition-all duration-500 group-hover/image:scale-105 group-hover/image:border-primary/30"
                      alt={typeof alt === "string" ? alt : ""}
                      loading="lazy"
                      {...props}
                    />
                    <div className="mt-2 text-xs text-muted-foreground/70 text-center opacity-0 group-hover/image:opacity-100 transition-opacity duration-300">
                      Click to view full size
                    </div>
                  </div>
                ),
                table: ({ node, ...props }) => (
                  <div className="my-5 overflow-x-auto rounded-xl border border-border/40 shadow-lg bg-gradient-to-br from-background/95 to-background/80 backdrop-blur-sm">
                    <table className="w-full text-sm border-collapse" {...props} />
                  </div>
                ),
                thead: ({ node, ...props }) => (
                  <thead className="bg-gradient-to-r from-primary/15 to-primary/8 text-foreground/90 border-b-2 border-primary/20" {...props} />
                ),
                th: ({ node, ...props }) => (
                  <th className="border-b border-border/30 px-5 py-4 text-left font-semibold text-foreground/95" {...props} />
                ),
                td: ({ node, ...props }) => (
                  <td className="border-b border-border/20 px-5 py-4 align-top text-foreground/90 hover:bg-muted/20 transition-colors duration-200" {...props} />
                ),
                code: CodeRenderer,
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>
        </Card>

  {/* Timestamp removed for cleaner look */}

        {/* Enhanced Action Buttons */}
        {showActions && (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
            {message.sender === "ai" && isLast && onRegenerate && (
              <button
                onClick={() => onRegenerate(message)}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg bg-background/80 backdrop-blur-sm border border-border/50 hover:bg-background/90 hover:border-primary/30 transition-all duration-300 shadow-sm hover:shadow-md"
                title="Regenerate response"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Regenerate</span>
              </button>
            )}
            {message.sender === "ai" && onFeedback && (
              <>
                <button
                  onClick={() => onFeedback(message, 'positive')}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg bg-background/80 backdrop-blur-sm border border-border/50 hover:bg-green-500/20 hover:border-green-500/40 hover:text-green-700 transition-all duration-300 shadow-sm hover:shadow-md"
                  title="Good response"
                >
                  <ThumbsUp className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Good</span>
                </button>
                <button
                  onClick={() => onFeedback(message, 'negative')}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg bg-background/80 backdrop-blur-sm border border-border/50 hover:bg-red-500/20 hover:border-red-500/40 hover:text-red-700 transition-all duration-300 shadow-sm hover:shadow-md"
                  title="Poor response"
                >
                  <ThumbsDown className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Poor</span>
                </button>
              </>
            )}
            {message.sender === "user" && onEdit && (
              <button
                onClick={() => onEdit(message)}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg bg-background/80 backdrop-blur-sm border border-border/50 hover:bg-background/90 hover:border-primary/30 transition-all duration-300 shadow-sm hover:shadow-md"
                title="Edit message"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Edit</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Center-screen ephemeral copy confirmation */}
      {showCenterCopied && typeof window !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[200] pointer-events-none flex items-center justify-center">
          <div className="pointer-events-none select-none rounded-md bg-foreground text-background px-3 py-2 text-sm font-semibold shadow-2xl shadow-black/30 opacity-95">
            Copied
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
