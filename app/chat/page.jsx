"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import dynamic from "next/dynamic"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { StaggerContainer, StaggerItem, FadeTransition, ScaleTransition } from "@/components/page-transition"
import { Send, ArrowLeft, Mic, AlertCircle, History as HistoryIcon, Trash2, ChevronDown, StopCircle, Plus, Download, FileText } from "lucide-react"
import { sendMessage, ApiError } from "@/lib/api"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ComponentLoader } from "@/components/loading-spinner"
import { useRenderTime } from "@/components/performance-monitor"

// Dynamic imports for better code splitting
const DynamicThemeToggle = dynamic(
  () => import("@/components/theme-toggle").then(mod => ({ default: mod.ThemeToggle })),
  { 
    loading: () => <div className="w-8 h-8 bg-muted animate-pulse rounded-md" />,
    ssr: false 
  }
)

const DynamicChatMessage = dynamic(
  () => import("@/components/chat-message").then(mod => ({ default: mod.ChatMessage })),
  { 
    loading: () => <ComponentLoader />,
    ssr: false 
  }
)

const DynamicTypingIndicator = dynamic(
  () => import("@/components/typing-indicator").then(mod => ({ default: mod.TypingIndicator })),
  { 
    loading: () => <div className="h-4 w-16 bg-muted animate-pulse rounded" />,
    ssr: false 
  }
)

// Import Drawer components normally since they are used conditionally
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter, DrawerClose } from "@/components/ui/drawer"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Switch } from "@/components/ui/switch"
import { getCorrections, getNextWordSuggestions, getPromptCompletions, autoCorrectLastToken } from "@/lib/suggestions"



export default function ChatPage() {
  // Performance monitoring
  useRenderTime('ChatPage')
  
  const [messages, setMessages] = useState([])
  const [inputValue, setInputValue] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [userName, setUserName] = useState("")
  const [conversationId, setConversationId] = useState("")
  const [error, setError] = useState("")
  const [historyOpen, setHistoryOpen] = useState(false)
  const [conversations, setConversations] = useState([])
  const [showScrollToBottom, setShowScrollToBottom] = useState(false)
  const messagesEndRef = useRef(null)
  const streamTimersRef = useRef({})
  const sendingRef = useRef(false)
  const abortControllerRef = useRef(null)
  const router = useRouter()
  const [editingMessageId, setEditingMessageId] = useState(null)
  const [editingContent, setEditingContent] = useState("")
  // Typing helpers: suggestions and autocorrect
  const [autoCorrectEnabled, setAutoCorrectEnabled] = useState(true)
  const [corrections, setCorrections] = useState([])
  const [nextWords, setNextWords] = useState([])
  const [promptIdeas, setPromptIdeas] = useState([])
  const debounceRef = useRef(null)

  useEffect(() => {
    // Get user name from localStorage
    const storedName = localStorage.getItem("av9assist_user_name")
    // Load conversation list
    loadConversationList()
    // After loading, refresh titles in case past entries need dedupe or welcome filtering
    setTimeout(() => {
      try { refreshAllConversationTitles() } catch {}
    }, 0)
    if (storedName) {
      setUserName(storedName)
      // Add welcome message
      const welcomeMessage = {
        id: "welcome",
        content: `Hello ${storedName}! I'm av9Assist, your AI-powered assistant. How can I help you today?`,
        sender: "ai",
        timestamp: new Date(),
      }
      setMessages([welcomeMessage])
    } else {
      // Generic welcome message
      const welcomeMessage = {
        id: "welcome",
        content: "Hello! I'm av9Assist, your AI-powered assistant. How can I help you today?",
        sender: "ai",
        timestamp: new Date(),
      }
      setMessages([welcomeMessage])
    }
  }, [])

  useEffect(() => {
    // Auto-scroll to bottom only if the user is already near the bottom to avoid fighting manual scroll
    const list = document.querySelector('#chat-scroll-area')
    if (list) {
      const atBottom = list.scrollHeight - list.scrollTop - list.clientHeight < 80
      if (atBottom) scrollToBottom()
    } else {
      scrollToBottom()
    }
  }, [messages, isTyping])

  // Track scroll position to toggle the scroll-to-bottom button
  useEffect(() => {
    const list = document.querySelector('#chat-scroll-area')
    if (!list) return
    const onScroll = () => {
      const atBottom = list.scrollHeight - list.scrollTop - list.clientHeight < 80
      setShowScrollToBottom(!atBottom)
    }
    list.addEventListener('scroll', onScroll, { passive: true })
    // initialize state
    onScroll()
    return () => list.removeEventListener('scroll', onScroll)
  }, [])

  // Update suggestions as the user types (debounced)
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      const text = String(inputValue || "")
      const tokens = text.trim().split(/\s+/).filter(Boolean)
      const last = tokens.length ? tokens[tokens.length - 1] : ""
      setCorrections(getCorrections(last, 3))
      setNextWords(getNextWordSuggestions(tokens, 3))
      setPromptIdeas(getPromptCompletions(text, 4))
    }, 120)
    return () => debounceRef.current && clearTimeout(debounceRef.current)
  }, [inputValue])

  const generateConversationTitle = (messages, userMessage = "") => {
    // If we have AI responses, try to extract title from them.
    // IMPORTANT: Ignore the default welcome message so it never influences titles.
    const aiMessages = messages.filter(
      (m) => m.sender === "ai" && m.id !== "welcome" && m.content?.trim()
    )

    for (const message of aiMessages) {
      const content = message.content.trim()

      // Look for markdown headers
      const h1Match = content.match(/^#\s+(.+)$/m)
      if (h1Match && h1Match[1].trim()) {
        return h1Match[1].trim().slice(0, 60)
      }

      // Look for common title patterns
      const titlePatterns = [
        /^["'](.+?)["']\s*[:-]/,  // "Title": or 'Title':
        /^(.+?)\s*[:-]\s*$/m,     // Title: or Title-
        /^(.+?)\s*\n\s*=+\s*$/m,  // Title\n===
      ]

      for (const pattern of titlePatterns) {
        const match = content.match(pattern)
        if (match && match[1].trim()) {
          return match[1].trim().slice(0, 60)
        }
      }

      // Look for first meaningful sentence
      const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 10)
      if (sentences.length > 0) {
        const firstSentence = sentences[0].trim()
        // Skip very short or generic sentences
        if (firstSentence.length > 15 && !firstSentence.toLowerCase().includes('hello') && !firstSentence.toLowerCase().includes('hi there')) {
          return firstSentence.slice(0, 60)
        }
      }
    }

    // Fallback to user message analysis
    if (userMessage) {
      const userContent = userMessage.trim()

      // Extract key phrases from user message
      const questionWords = ['what', 'how', 'why', 'when', 'where', 'who', 'which', 'can you', 'please']
      const words = userContent.toLowerCase().split(/\s+/)

      // If it's a question, try to extract the main topic
      if (questionWords.some(word => words.includes(word))) {
        // Remove question words and get the main subject
        const filteredWords = words.filter(word =>
          !questionWords.includes(word) &&
          !['is', 'are', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'].includes(word)
        )
        if (filteredWords.length > 0) {
          return filteredWords.slice(0, 4).join(' ').slice(0, 60)
        }
      }

      // For non-questions, use first few meaningful words
      const meaningfulWords = words.filter(word =>
        word.length > 2 &&
        !['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'this', 'that', 'these', 'those'].includes(word)
      )
      if (meaningfulWords.length > 0) {
        return meaningfulWords.slice(0, 5).join(' ').slice(0, 60)
      }

      // Last resort: use first 8 words of user message
      return userContent.split(/\s+/).slice(0, 8).join(' ').slice(0, 60)
    }

    // Final fallback
    return "New Conversation"
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  // Ensure conversation titles are unique within the history list.
  // If a title already exists (case-insensitive), append " (2)", " (3)", etc.
  const ensureUniqueTitle = (baseTitle, existingTitles = []) => {
    const title = (baseTitle || "New Conversation").trim() || "New Conversation"
    const lowerExisting = new Set(
      (existingTitles || []).filter(Boolean).map((t) => String(t).toLowerCase())
    )

    if (!lowerExisting.has(title.toLowerCase())) return title

    // Find next available suffix
    let n = 2
    let candidate = `${title} (${n})`
    while (lowerExisting.has(candidate.toLowerCase())) {
      n += 1
      candidate = `${title} (${n})`
    }
    return candidate
  }

  // ---- History helpers (localStorage) ----
  const LS_LIST_KEY = "av9assist_conversations"
  const LS_CONVO_KEY = (id) => `av9assist_convo_${id}`

  // Make a title from the FIRST user prompt only (truncate to keep it tidy)
  const getFirstPromptTitle = (msgs = []) => {
    const firstUser = (msgs || []).find((m) => m.sender === "user" && m.content?.trim())
    if (!firstUser) return "New Conversation"
    const text = String(firstUser.content || "").trim().replace(/\s+/g, " ")
    const words = text.split(/\s+/).slice(0, 8).join(" ")
    return words.slice(0, 60) || "New Conversation"
  }

  const loadConversationList = () => {
    try {
      const raw = localStorage.getItem(LS_LIST_KEY)
      const list = raw ? JSON.parse(raw) : []
      setConversations(Array.isArray(list) ? list : [])
    } catch (e) {
      console.warn("Failed to load conversation list", e)
      setConversations([])
    }
  }

  const saveConversationList = (list) => {
    try {
      localStorage.setItem(LS_LIST_KEY, JSON.stringify(list))
      setConversations(list)
    } catch (e) {
      console.warn("Failed to save conversation list", e)
    }
  }

  const upsertConversationMeta = (id, title, messages = []) => {
    if (!id) return
    const now = new Date().toISOString()
    const list = [...conversations]
    const idx = list.findIndex((c) => c.id === id)

    let finalTitle
    if (idx >= 0) {
      // Existing conversation: preserve existing title if present; otherwise derive from first prompt
      const current = list[idx]
      const hasTitle = current.title && String(current.title).trim().length > 0 && current.title !== "Conversation"
      if (hasTitle) {
        finalTitle = current.title
      } else {
        const base = title && title.trim().length ? title : getFirstPromptTitle(messages)
        const existingTitles = list.filter((c) => c.id !== id).map((c) => c.title).filter(Boolean)
        finalTitle = ensureUniqueTitle(base, existingTitles)
      }
      list[idx] = { ...current, title: finalTitle, updatedAt: now }
    } else {
      // New conversation: use provided title if any, else first prompt
      const base = title && title.trim().length ? title : getFirstPromptTitle(messages)
      const existingTitles = list.map((c) => c.title).filter(Boolean)
      finalTitle = ensureUniqueTitle(base, existingTitles)
      list.unshift({ id, title: finalTitle, updatedAt: now })
    }
    // keep recent 50
    saveConversationList(list.slice(0, 50))
  }

  // Recompute and de-duplicate titles for ALL saved conversations.
  // - Ignores the welcome message when computing titles.
  // - Ensures uniqueness across the entire set by appending (2), (3), ... as needed.
  const refreshAllConversationTitles = () => {
    try {
      const raw = localStorage.getItem(LS_LIST_KEY)
      const list = raw ? JSON.parse(raw) : []
      if (!Array.isArray(list) || list.length === 0) return

      const taken = new Set()
      const updated = list.map((meta) => {
        const msgs = loadConversationMessages(meta.id) || []
        // Title strictly from FIRST user prompt
        const base = getFirstPromptTitle(msgs)
        const unique = ensureUniqueTitle(base, Array.from(taken))
        taken.add(unique.toLowerCase())
        // Only change the title field; preserve id and updatedAt
        if (meta.title !== unique) {
          return { ...meta, title: unique }
        }
        return meta
      })

      // Only save if anything actually changed
      const changed = updated.some((m, i) => m.title !== list[i].title)
      if (changed) {
        saveConversationList(updated)
      }
    } catch (e) {
      console.warn("Failed to refresh conversation titles", e)
    }
  }

  const saveConversationMessages = (id, msgs) => {
    if (!id) return
    try {
      const serializable = msgs.map((m) => ({ ...m, timestamp: new Date(m.timestamp).toISOString() }))
      localStorage.setItem(LS_CONVO_KEY(id), JSON.stringify(serializable))
    } catch (e) {
      console.warn("Failed to save conversation messages", e)
    }
  }

  const loadConversationMessages = (id) => {
    if (!id) return []
    try {
      const raw = localStorage.getItem(LS_CONVO_KEY(id))
      const data = raw ? JSON.parse(raw) : []
      return Array.isArray(data) ? data : []
    } catch (e) {
      console.warn("Failed to load conversation messages", e)
      return []
    }
  }

  const deleteConversation = (id) => {
    try {
      localStorage.removeItem(LS_CONVO_KEY(id))
      const next = conversations.filter((c) => c.id !== id)
      saveConversationList(next)
      if (conversationId === id) {
        setConversationId("")
        // Reset to welcome
        const welcomeMessage = {
          id: "welcome",
          content: "Hello! I'm av9Assist, your AI-powered assistant. How can I help you today?",
          sender: "ai",
          timestamp: new Date(),
        }
        setMessages([welcomeMessage])
      }
    } catch (e) {
      console.warn("Failed to delete conversation", e)
    }
  }

  const openConversation = (id) => {
    const msgs = loadConversationMessages(id)
    setConversationId(id)
    setMessages(msgs.length ? msgs : [])
    setHistoryOpen(false)
    // ensure scrolled
    setTimeout(scrollToBottom, 50)
  }

  const startNewChat = () => {
    // Cancel any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }

    // stop any streaming timers
    const timers = streamTimersRef.current || {}
    Object.values(timers).forEach((t) => clearInterval(t))
    streamTimersRef.current = {}
    setConversationId("")
    const welcomeMessage = {
      id: "welcome",
      content: "Hello! I'm av9Assist, your AI-powered assistant. How can I help you today?",
      sender: "ai",
      timestamp: new Date(),
    }
    setMessages([welcomeMessage])
    setHistoryOpen(false)
    setTimeout(scrollToBottom, 50)
  }

  const handleSendMessage = async () => {
    // Guard against rapid re-entry (e.g., Enter + Click) and empty input
    if (sendingRef.current || !inputValue.trim() || isTyping) return
    sendingRef.current = true

    // Cancel any existing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    // Create new abort controller for this request
    const controller = new AbortController()
    abortControllerRef.current = controller

    const userMessage = {
      id: Date.now().toString(),
      content: inputValue.trim(),
      sender: "user",
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputValue("")
    setIsTyping(true)
    setError("")

    try {
      const response = await sendMessage(userMessage.content, {
        userId: userName || undefined,
        conversationId: conversationId || undefined,
        signal: controller.signal, // Pass abort signal
      })

      // Update conversation ID if it's new
      const convId = conversationId || response.conversationId
      if (!conversationId) {
        setConversationId(convId)
      }

      const aiMessage = {
        id: response.message.id,
        content: "",
        sender: "ai",
        timestamp: new Date(response.message.timestamp),
      }

      // Insert empty AI message first, then stream in the content for a ChatGPT-like feel
      setMessages((prev) => {
        const next = [...prev, aiMessage]
        // Persist immediately: include the just-sent user message and empty ai placeholder
        // Title based on FIRST user prompt only
        if (!conversationId) {
          upsertConversationMeta(convId, userMessage.content, next)
        } else {
          upsertConversationMeta(convId, undefined, next)
        }
        saveConversationMessages(convId, next)
        return next
      })
      streamInContent(response.message.content || "", aiMessage.id, () => {
        // On complete: persist final message content and improve title
        setMessages((prev) => {
          const finalMsgs = prev
          // Do not overwrite the title here; it's already set from the first prompt
          saveConversationMessages(convId, finalMsgs)
          setTimeout(() => {
            try { refreshAllConversationTitles() } catch {}
          }, 0)
          return finalMsgs
        })
      })
    } catch (err) {
      if (err.name === 'AbortError') {
        // Request was cancelled, don't show error
        console.log('Request was cancelled')
        return
      }

      console.error("Failed to send message:", err)

      let errorMessage = "Failed to send message. Please try again."
      if (err instanceof ApiError) {
        errorMessage = err.message
      }

      setError(errorMessage)

      // Add error message to chat
      const errorMsg = {
        id: (Date.now() + 1).toString(),
        content: "Sorry, I'm having trouble responding right now. Please try again in a moment.",
        sender: "ai",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMsg])
    } finally {
      // Stop the typing indicator once the server has responded; streaming continues independently
      setIsTyping(false)
      sendingRef.current = false
      abortControllerRef.current = null
    }
  }

  const handleKeyPress = (e) => {
    // Accept suggestion with Tab
    if (e.key === "Tab") {
      // Prefer next-word, then correction, then prompt idea
      if (nextWords && nextWords.length) {
        e.preventDefault()
        applyNextWord(nextWords[0])
        return
      }
      if (corrections && corrections.length) {
        e.preventDefault()
        applyCorrection(corrections[0])
        return
      }
      if (promptIdeas && promptIdeas.length) {
        e.preventDefault()
        applyPromptIdea(promptIdeas[0])
        return
      }
    }

    // Auto-correct last token when hitting Space
    if (autoCorrectEnabled && (e.key === " " || e.code === "Space")) {
      const el = inputRef.current
      // Only when caret is at end (simple heuristic)
      const atEnd = el && el.selectionStart === el.value.length && el.selectionEnd === el.value.length
      if (atEnd) {
        e.preventDefault()
        const corrected = autoCorrectLastToken(String(inputValue || ""))
        setInputValue(corrected + " ")
        return
      }
    }

    if (e.key === "Enter") {
      if (e.shiftKey) {
        // allow newline
        return
      }
      e.preventDefault()
      handleSendMessage()
    }
  }

  // Apply helpers
  const applyCorrection = (word) => {
    const s = String(inputValue || "")
    const m = s.match(/^(.*?)([A-Za-z]+)$/)
    if (!m) return
    const prefix = m[1]
    const suffix = s.slice(m.index + m[0].length) || ""
    const next = prefix + word + suffix
    setInputValue(next)
    // Move caret to end
    requestAnimationFrame(() => {
      try { inputRef.current?.setSelectionRange(next.length, next.length) } catch {}
    })
  }

  const applyNextWord = (word) => {
    const base = String(inputValue || "").replace(/\s+$/g, " ")
    const joiner = base.endsWith(" ") ? "" : " "
    const next = base + joiner + word + " "
    setInputValue(next)
    requestAnimationFrame(() => {
      try { inputRef.current?.setSelectionRange(next.length, next.length) } catch {}
    })
  }

  const applyPromptIdea = (idea) => {
    const base = String(inputValue || "").trim()
    const next = base ? base + "\n" + idea : idea
    setInputValue(next)
    requestAnimationFrame(() => {
      try { inputRef.current?.setSelectionRange(next.length, next.length) } catch {}
    })
  }

  const handleRegenerate = async (message) => {
    if (isTyping || sendingRef.current) return

    // Find the user message that led to this AI response
    const messageIndex = messages.findIndex(m => m.id === message.id)
    if (messageIndex === -1) return

    // Get all messages up to the user message before this AI response
    const userMessageIndex = messageIndex - 1
    if (userMessageIndex < 0) return

    const userMessage = messages[userMessageIndex]
    const messagesUpToUser = messages.slice(0, userMessageIndex + 1)

    // Remove the current AI message and any subsequent messages
    setMessages(messagesUpToUser)
    setIsTyping(true)
    setError("")

    try {
      const response = await sendMessage(userMessage.content, {
        userId: userName || undefined,
        conversationId: conversationId || undefined,
        regenerate: true, // Flag to indicate this is a regeneration
      })

      const aiMessage = {
        id: response.message.id,
        content: "",
        sender: "ai",
        timestamp: new Date(response.message.timestamp),
      }

      setMessages((prev) => {
        const next = [...prev, aiMessage]
        saveConversationMessages(conversationId, next)
        return next
      })

      streamInContent(response.message.content || "", aiMessage.id, () => {
        setMessages((prev) => {
          // Do not overwrite the title during regenerate
          saveConversationMessages(conversationId, prev)
          setTimeout(() => {
            try { refreshAllConversationTitles() } catch {}
          }, 0)
          return prev
        })
      })
    } catch (err) {
      console.error("Failed to regenerate message:", err)
      setError("Failed to regenerate response. Please try again.")
    } finally {
      setIsTyping(false)
    }
  }

  const handleEdit = (message) => {
    setEditingMessageId(message.id)
    setEditingContent(message.content)
  }

  const handleSaveEdit = async () => {
    if (!editingMessageId || !editingContent.trim()) return

    const messageIndex = messages.findIndex(m => m.id === editingMessageId)
    if (messageIndex === -1) return

    // Update the message content
    const updatedMessages = [...messages]
    updatedMessages[messageIndex] = {
      ...updatedMessages[messageIndex],
      content: editingContent.trim(),
    }

    // Remove all subsequent messages (AI responses after this edit)
    const messagesAfterEdit = updatedMessages.slice(0, messageIndex + 1)
    setMessages(messagesAfterEdit)
    setEditingMessageId(null)
    setEditingContent("")
    setIsTyping(true)
    setError("")

    try {
      const response = await sendMessage(editingContent.trim(), {
        userId: userName || undefined,
        conversationId: conversationId || undefined,
        edit: true, // Flag to indicate this is an edit
      })

      const aiMessage = {
        id: response.message.id,
        content: "",
        sender: "ai",
        timestamp: new Date(response.message.timestamp),
      }

      setMessages((prev) => {
        const next = [...prev, aiMessage]
        saveConversationMessages(conversationId, next)
        return next
      })

      streamInContent(response.message.content || "", aiMessage.id, () => {
        setMessages((prev) => {
          // Do not overwrite the title during edit
          saveConversationMessages(conversationId, prev)
          setTimeout(() => {
            try { refreshAllConversationTitles() } catch {}
          }, 0)
          return prev
        })
      })
    } catch (err) {
      console.error("Failed to send edited message:", err)
      setError("Failed to send edited message. Please try again.")
    } finally {
      setIsTyping(false)
    }
  }

  const handleCancelEdit = () => {
    setEditingMessageId(null)
    setEditingContent("")
  }

  const handleFeedback = (message, type) => {
    // Store feedback in localStorage for analytics
    const feedbackKey = `feedback_${message.id}`
    const feedback = {
      messageId: message.id,
      type, // 'positive' or 'negative'
      timestamp: new Date().toISOString(),
      conversationId
    }
    localStorage.setItem(feedbackKey, JSON.stringify(feedback))

    // You could send this to an analytics service here
    console.log(`Feedback received: ${type} for message ${message.id}`)
  }

  const exportConversation = (format) => {
    if (!messages.length) return

    const conversationTitle = conversations.find(c => c.id === conversationId)?.title || "Conversation"
    const timestamp = new Date().toISOString().split('T')[0]

    if (format === 'json') {
      const data = {
        title: conversationTitle,
        conversationId,
        exportedAt: new Date().toISOString(),
        messages: messages.filter(m => m.id !== 'welcome').map(m => ({
          id: m.id,
          sender: m.sender,
          content: m.content,
          timestamp: m.timestamp
        }))
      }

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${conversationTitle.replace(/[^a-z0-9]/gi, '_')}_${timestamp}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } else if (format === 'markdown') {
      let markdown = `# ${conversationTitle}\n\n`
      markdown += `*Exported on ${new Date().toLocaleDateString()}*\n\n`
      markdown += `---\n\n`

      messages.filter(m => m.id !== 'welcome').forEach(message => {
        const time = new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        const sender = message.sender === 'user' ? '**You**' : '**Assistant**'
        markdown += `${sender} (${time}):\n\n${message.content}\n\n---\n\n`
      })

      const blob = new Blob([markdown], { type: 'text/markdown' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${conversationTitle.replace(/[^a-z0-9]/gi, '_')}_${timestamp}.md`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }
  }

  // Auto-resize textarea as user types
  const inputRef = useRef(null)
  useEffect(() => {
    const el = inputRef.current
    if (!el) return
    el.style.height = 'auto'
    const max = 200 // px max height before scroll
    el.style.height = Math.min(el.scrollHeight, max) + 'px'
  }, [inputValue])

  const dismissError = () => {
    setError("")
  }

  // Stream helper: incrementally updates message content by id
  const streamInContent = (fullText, messageId, onComplete) => {
    const text = String(fullText)
    if (!text) return
    // Choose a base step depending on length
    const len = text.length
    const baseStep = len > 1200 ? 28 : len > 600 ? 18 : len > 300 ? 10 : 6
    const intervalMs = 22
    let i = 0

    const tick = () => {
      if (i >= text.length) {
        clear()
        if (typeof onComplete === "function") onComplete()
        return
      }
      let step = baseStep
      // Try to end at a nearby whitespace/punctuation so chunks look natural
      const sliceEnd = Math.min(i + step, text.length)
      let end = sliceEnd
      const window = text.slice(i, Math.min(i + step + 20, text.length))
      const boundary = window.search(/[\s\n\r.,;!?)]/)
      if (boundary > 0 && boundary < step + 15) {
        end = i + boundary + 1
      }

      const next = text.slice(0, end)
      setMessages((prev) => prev.map((m) => (m.id === messageId ? { ...m, content: next } : m)))
      i = end
    }

    const id = setInterval(tick, intervalMs)
    streamTimersRef.current[messageId] = id

    const clear = () => {
      const t = streamTimersRef.current[messageId]
      if (t) {
        clearInterval(t)
        delete streamTimersRef.current[messageId]
      }
    }
  }

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      const timers = streamTimersRef.current || {}
      Object.values(timers).forEach((t) => clearInterval(t))
      streamTimersRef.current = {}
    }
  }, [])

  const stopStreaming = () => {
    // Abort the current request if it exists
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }

    const timers = streamTimersRef.current || {}
    Object.values(timers).forEach((t) => clearInterval(t))
    streamTimersRef.current = {}
    // Persist whatever content exists now
    if (conversationId) {
      setMessages((prev) => {
        saveConversationMessages(conversationId, prev)
        upsertConversationMeta(conversationId, undefined, prev)
        setTimeout(() => {
          try { refreshAllConversationTitles() } catch {}
        }, 0)
        return prev
      })
    }
  }

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col overflow-hidden">
      {/* Header */}
      <header className="border-b bg-card/70 backdrop-blur-sm sticky top-0 z-10 shadow-sm shrink-0">
        <div className="container mx-auto px-1 sm:px-2 py-2 sm:py-3 flex items-center justify-between max-w-6xl">
          <div className="flex items-center gap-1 sm:gap-2 min-w-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push("/")}
              className="hover:scale-110 transition-transform shrink-0 w-8 h-8 sm:w-9 sm:h-9"
            >
              <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4" />
            </Button>
            <div className="flex items-center gap-1 min-w-0">
              {/* Hide AI logo to save space */}
              <div className="min-w-0">
                <h1 className="text-xs sm:text-sm font-semibold truncate">av9Assist</h1>
                <p className="text-xs text-muted-foreground hidden">AI Assistant</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={startNewChat}
              className="w-9 h-9 sm:w-10 sm:h-10"
              title="New Chat"
            >
              <Plus className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setHistoryOpen(true)}
              className="w-9 h-9 sm:w-10 sm:h-10"
              title="History"
            >
              <HistoryIcon className="w-4 h-4" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="min-w-[44px] min-h-[44px]"
                  title="Export"
                  disabled={!messages.length || messages.length <= 1}
                >
                  <Download className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => exportConversation('json')}>
                  <FileText className="w-4 h-4 mr-2" />
                  Export as JSON
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => exportConversation('markdown')}>
                  <FileText className="w-4 h-4 mr-2" />
                  Export as Markdown
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <DynamicThemeToggle />
          </div>
        </div>
      </header>

      {/* Error Alert */}
      {error && (
  <div className="container mx-auto px-3 sm:px-4 pt-3 sm:pt-4 max-w-6xl">
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span className="text-sm">{error}</span>
              <Button variant="ghost" size="sm" onClick={dismissError} className="ml-2 min-h-[32px]">
                Dismiss
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Chat Messages Area */}
      <main className="flex-1 min-h-0 overflow-hidden">
  <div className="h-full container mx-auto px-1 sm:px-2 py-1 sm:py-2 max-w-6xl">
          <div id="chat-scroll-area" className="h-full space-y-2 sm:space-y-3 pb-2 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent">
            <div className="space-y-2 sm:space-y-3">
              <StaggerContainer>
                {messages.map((message, index) => {
                  if (editingMessageId === message.id) {
                    return (
                      <StaggerItem key={message.id}>
                        <FadeTransition className="flex gap-1 sm:gap-2 flex-row-reverse px-0 sm:px-0">
                          <div className="flex flex-col gap-2 min-w-0 items-end max-w-[96%] xs:max-w-[92%] sm:max-w-[90%] md:max-w-[86%] lg:max-w-[82%] xl:max-w-[78%]">{/* Continue with existing structure */}
                            <ScaleTransition>
                              <Card className="px-3 sm:px-5 py-3 sm:py-4 border-0 shadow-xl bg-primary text-primary-foreground rounded-2xl rounded-br-md min-w-0 w-fit">
                                <Textarea
                                  value={editingContent}
                                  onChange={(e) => setEditingContent(e.target.value)}
                                  className="min-h-[60px] bg-transparent border-none text-primary-foreground placeholder:text-primary-foreground/50 resize-none text-sm sm:text-base transition-all duration-300 focus:scale-105"
                                  placeholder="Edit your message..."
                                  autoFocus
                                />
                                <div className="flex gap-2 sm:gap-3 mt-3">
                                  <ScaleTransition>
                                    <Button
                                      size="sm"
                                  onClick={handleSaveEdit}
                                  disabled={!editingContent.trim()}
                                  className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 font-medium transition-all duration-300"
                                >
                                  Save Changes
                                </Button>
                              </ScaleTransition>
                              <ScaleTransition>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={handleCancelEdit}
                                  className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 transition-all duration-300"
                                >
                                  Cancel
                                </Button>
                              </ScaleTransition>
                            </div>
                          </Card>
                        </ScaleTransition>
                      </div>
                    </FadeTransition>
                  </StaggerItem>
                )
              }

              return (
                <StaggerItem key={message.id}>
                  <FadeTransition>
                    <DynamicChatMessage
                      message={message}
                      onRegenerate={handleRegenerate}
                      onEdit={handleEdit}
                      onFeedback={handleFeedback}
                      isLast={message.sender === "ai" && index === messages.length - 1}
                      isTyping={isTyping && message.sender === "ai" && index === messages.length - 1}
                      showTimestamp={true}
                      showActions={true}
                    />
                  </FadeTransition>
                </StaggerItem>
              )
            })}
          </StaggerContainer>
          {isTyping && <DynamicTypingIndicator />}
          <div ref={messagesEndRef} />
            </div>
          </div>
        </div>

        {/* Scroll to latest button */}
        {showScrollToBottom && (
          <FadeTransition>
            <div className="fixed right-3 sm:right-5 bottom-24 sm:bottom-28 z-20">
              <ScaleTransition>
                <Button
                  size="icon"
                  variant="secondary"
                  className="rounded-full shadow transition-all duration-300 w-9 h-9 sm:w-10 sm:h-10"
                  onClick={() => {
                    const list = document.querySelector('#chat-scroll-area')
                    if (list) list.scrollTo({ top: list.scrollHeight, behavior: 'smooth' })
                    setShowScrollToBottom(false)
                  }}
                  title="Scroll to latest"
                >
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </ScaleTransition>
            </div>
          </FadeTransition>
        )}
      </main>

      {/* Input Area */}
      <footer className="border-t bg-card/70 backdrop-blur-sm sticky bottom-0 pb-safe shadow-inner shrink-0">
  <div className="container mx-auto px-1 sm:px-2 py-1 sm:py-2 max-w-6xl">
          <FadeTransition>
            {/* Suggestions row placed before the text input, at bottom of chat */}
            {(promptIdeas?.length || corrections?.length || nextWords?.length) ? (
              <div className="mb-1 sm:mb-2 flex flex-wrap items-center gap-1 sm:gap-1.5">
                {promptIdeas && promptIdeas.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1 sm:gap-1.5">
                    <span className="text-[10px] sm:text-xs text-muted-foreground mr-1">Prompt ideas:</span>
                    {promptIdeas.slice(0, 4).map((p, idx) => (
                      <Button key={p + idx} size="sm" variant="secondary" onClick={() => applyPromptIdea(p)} className="h-6 px-2 text-[10px] sm:text-xs">
                        {p}
                      </Button>
                    ))}
                  </div>
                )}
                {corrections && corrections.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1 sm:gap-1.5">
                    <span className="text-[10px] sm:text-xs text-muted-foreground mr-1">Fix:</span>
                    {corrections.slice(0, 3).map((c) => (
                      <Button key={c} size="sm" variant="outline" onClick={() => applyCorrection(c)} className="h-6 px-2 text-[10px] sm:text-xs">
                        {c}
                      </Button>
                    ))}
                  </div>
                )}
                {nextWords && nextWords.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1 sm:gap-1.5">
                    <span className="text-[10px] sm:text-xs text-muted-foreground mr-1">Next:</span>
                    {nextWords.slice(0, 3).map((w) => (
                      <Button key={w} size="sm" variant="ghost" onClick={() => applyNextWord(w)} className="h-6 px-2 text-[10px] sm:text-xs">
                        {w}
                      </Button>
                    ))}
                  </div>
                )}
                <div className="ml-auto flex items-center gap-1 pl-1">
                  <span className="text-[10px] sm:text-xs text-muted-foreground">Auto-correct</span>
                  <Switch checked={autoCorrectEnabled} onCheckedChange={setAutoCorrectEnabled} />
                </div>
              </div>
            ) : null}

            <Card className="p-1 sm:p-2 bg-background/70 backdrop-blur-sm border soft-divider shadow-sm transition-all duration-300 hover:shadow-md">
              <div className="flex gap-1 sm:gap-2 items-end">
                <div className="flex-1 min-w-0">
                  <Textarea
                    ref={inputRef}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder="Type your message..."
                    className="min-h-[36px] sm:min-h-[40px] max-h-[100px] sm:max-h-[120px] resize-none border-0 bg-muted/50 focus-visible:ring-1 focus-visible:ring-primary text-sm sm:text-base transition-all duration-300 focus:scale-[1.01] sm:focus:scale-[1.02]"
                    disabled={false}
                  />
                </div>
                {/* Stop streaming button */}
                <ScaleTransition>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-9 h-9 sm:w-11 sm:h-11 text-muted-foreground hover:text-foreground transition-all duration-300 shrink-0"
                    onClick={stopStreaming}
                    disabled={Object.keys(streamTimersRef.current || {}).length === 0}
                    title="Stop generating"
                  >
                    <StopCircle className="w-4 h-4" />
                  </Button>
                </ScaleTransition>
                <ScaleTransition>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-9 h-9 sm:w-11 sm:h-11 text-muted-foreground hover:text-foreground transition-all duration-300 shrink-0"
                    disabled={false}
                  >
                    <Mic className="w-4 h-4" />
                  </Button>
                </ScaleTransition>
                <ScaleTransition>
                  <Button
                    onClick={handleSendMessage}
                    disabled={!inputValue.trim() || isTyping}
                    size="icon"
                    className="w-9 h-9 sm:w-11 sm:h-11 transition-all duration-300 disabled:hover:scale-100 shrink-0"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </ScaleTransition>
              </div>
            </Card>
          </FadeTransition>
        </div>
      </footer>

      {/* History Drawer */}
      <Drawer open={historyOpen} onOpenChange={setHistoryOpen}>
        <DrawerContent className="max-h-[85vh]">
          <DrawerHeader>
            <DrawerTitle>History</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-2 overflow-y-auto">
            {conversations.length === 0 ? (
              <p className="text-sm text-muted-foreground">No conversations yet.</p>
            ) : (
              <ul className="divide-y divide-border/60">
                {conversations.map((c) => (
                  <li key={c.id} className="flex items-center justify-between py-2">
                    <button
                      className="text-left flex-1 pr-2 hover:opacity-90"
                      onClick={() => openConversation(c.id)}
                    >
                      <div className="font-medium line-clamp-1">{c.title || "Conversation"}</div>
                      <div className="text-xs text-muted-foreground">{new Date(c.updatedAt).toLocaleString()}</div>
                    </button>
                    <Button variant="ghost" size="icon" onClick={() => deleteConversation(c.id)} title="Delete">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <DrawerFooter>
            <DrawerClose asChild>
              <Button variant="secondary">Close</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  )
}
